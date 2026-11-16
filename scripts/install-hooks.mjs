import { spawnSync } from "node:child_process"

const existing = spawnSync("git", ["config", "--get", "core.hooksPath"], { encoding: "utf8" })
if (existing.status !== 0 && existing.status !== 1) process.exit(existing.status ?? 1)
const hooksPath = existing.stdout.trim()
if (hooksPath && hooksPath !== ".githooks") {
  throw new Error(`core.hooksPath is already ${hooksPath}. Integrate its hooks before changing it.`)
}
const result = spawnSync("git", ["config", "--local", "core.hooksPath", ".githooks"], { stdio: "inherit" })
process.exitCode = result.status ?? 1
