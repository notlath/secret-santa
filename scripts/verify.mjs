import { createHash } from "node:crypto"
import { execFileSync, spawn } from "node:child_process"
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { config } from "dotenv"
import { artifactPaths, createRunId } from "./artifacts.mjs"

function inputSnapshot(cwd) {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd, encoding: "utf8" })
  const entries = new Map()
  for (const file of [...new Set(files.split("\0").filter(Boolean))].sort()) {
    if (/^(?:node_modules|\.next|\.next-e2e|test-results)\//.test(file) || file === "next-env.d.ts" || file.endsWith(".tsbuildinfo")) continue
    try {
      entries.set(file, createHash("sha256").update(readFileSync(path.join(cwd, file))).digest("hex"))
    } catch (error) {
      if (error.code !== "ENOENT") throw error
      entries.set(file, "deleted")
    }
  }
  return { entries, fingerprint: createHash("sha256").update(JSON.stringify([...entries])).digest("hex") }
}

async function runCheck(command, check, cwd, env, logPath) {
  const log = createWriteStream(logPath)
  let exitCode
  try {
    const child = spawn(command[0], [...command.slice(1), check], { cwd, env, stdio: ["inherit", "pipe", "pipe"] })
    child.stdout.on("data", (chunk) => { process.stdout.write(chunk); log.write(chunk) })
    child.stderr.on("data", (chunk) => { process.stderr.write(chunk); log.write(chunk) })
    exitCode = await new Promise((resolve, reject) => {
      child.on("error", reject)
      child.on("close", (code) => resolve(code ?? 1))
    })
  } catch (error) {
    log.write(`${error.message}\n`)
    exitCode = 1
  } finally {
    await new Promise((resolve) => log.end(resolve))
  }
  return exitCode
}

export async function runVerification({ cwd = process.cwd(), checks = ["lint", "typecheck", "test:tooling", "test", "test:e2e"], command = ["pnpm"] } = {}) {
  const runId = createRunId()
  const paths = artifactPaths(cwd, runId)
  mkdirSync(paths.verification, { recursive: true })
  const before = inputSnapshot(cwd)
  const report = {
    runId, fingerprint: before.fingerprint, status: "running", exitCode: 0, changedFiles: [], checks: [],
    summaryPath: path.join(paths.verification, "summary.json"), e2eOutputPath: paths.e2e,
  }
  console.log(`Verification ${runId}\nInputs: ${before.fingerprint}\nSummary: ${report.summaryPath}`)
  const save = () => writeFileSync(report.summaryPath, `${JSON.stringify(report, null, 2)}\n`)
  save()
  for (const check of checks) {
    console.log(`\nVerifying: ${check}`)
    const started = Date.now()
    const logPath = path.join(paths.verification, `${report.checks.length + 1}-${check.replace(/[^a-zA-Z0-9_-]/g, "-")}.log`)
    const exitCode = await runCheck(command, check, cwd, { ...process.env, E2E_RUN_ID: runId }, logPath)
    report.checks.push({ check, exitCode, durationMs: Date.now() - started, logPath })
    const after = inputSnapshot(cwd)
    if (after.fingerprint !== before.fingerprint) {
      report.status = "invalidated"
      report.exitCode = 1
      report.changedFiles = [...new Set([...before.entries.keys(), ...after.entries.keys()])]
        .filter((file) => before.entries.get(file) !== after.entries.get(file))
      console.error(`Verification inputs changed: ${report.changedFiles.join(", ")}. Run verification again after edits settle.`)
    } else if (exitCode !== 0) {
      report.status = "failed"
      report.exitCode = exitCode
    }
    save()
    if (report.exitCode !== 0) break
  }
  if (report.status === "running") report.status = "passed"
  save()
  console.log(`\nVerification ${report.status}: ${report.checks.map(({ check, exitCode }) => `${check}=${exitCode}`).join(", ")}\nSummary: ${report.summaryPath}\nBrowser artifacts: ${paths.e2e}`)
  return report
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  config({ path: ".env.local", quiet: true })
  if (!process.env.TEST_DATABASE_URL) throw new Error("Set TEST_DATABASE_URL in .env.local before running verification.")
  process.exitCode = (await runVerification()).exitCode
}
