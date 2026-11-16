import { spawn } from "node:child_process"
import { createServer } from "node:net"
import path from "node:path"
import { pathToFileURL } from "node:url"
import reservedPorts from "next/dist/lib/helpers/get-reserved-port.js"
import { artifactPaths, createRunId } from "./artifacts.mjs"

async function availablePort(port) {
  const server = createServer()
  try {
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, resolve) })
    return server.address().port
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve))
  }
}

export async function selectE2EPort(override) {
  if (override !== undefined) {
    const port = Number(override)
    if (!/^\d+$/.test(override) || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("E2E_PORT must be an integer from 1 to 65535")
    }
    if (reservedPorts.isPortIsReserved(port)) throw new Error(`E2E_PORT ${port} is reserved by Next.js`)
    try {
      return await availablePort(port)
    } catch (error) {
      if (error.code === "EADDRINUSE") throw new Error(`E2E_PORT ${port} is already in use. Choose another port.`)
      throw error
    }
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const port = await availablePort(0)
    if (!reservedPorts.isPortIsReserved(port)) return port
  }
  throw new Error("Could not select a non-reserved E2E port. Set E2E_PORT explicitly.")
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = await selectE2EPort(process.env.E2E_PORT)
  const runId = process.env.E2E_RUN_ID ?? createRunId()
  const output = artifactPaths(process.cwd(), runId).e2e
  console.log(`Browser run ${runId}\nPort: ${port}\nArtifacts: ${output}`)
  const child = spawn("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2)], {
    stdio: "inherit", env: { ...process.env, E2E_PORT: String(port), E2E_RUN_ID: runId },
  })
  process.exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject)
    child.on("close", (code) => resolve(code ?? 1))
  })
}
