import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { test } from "node:test"
import { runVerification } from "./verify.mjs"

function repository(t) {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "gx-verify-"))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  execFileSync("git", ["init", "--quiet"], { cwd })
  writeFileSync(path.join(cwd, ".gitignore"), "test-results/\n.next/\nnext-env.d.ts\n.env.local\n")
  mkdirSync(path.join(cwd, "src"))
  writeFileSync(path.join(cwd, "src", "input.ts"), "original")
  execFileSync("git", ["add", "."], { cwd })
  return cwd
}

test("verification rejects a passing check when an input changes during it", async (t) => {
  const cwd = repository(t)
  const result = await runVerification({ cwd, checks: ["probe", "must-not-run"], command: [process.execPath, "-e", `
    require('node:fs').writeFileSync('src/input.ts', 'changed')
    console.log('The check itself passed')
  `] })
  assert.equal(result.status, "invalidated")
  assert.equal(result.exitCode, 1)
  assert.deepEqual(result.changedFiles, ["src/input.ts"])
  assert.equal(result.checks.length, 1)
  const saved = JSON.parse(readFileSync(result.summaryPath, "utf8"))
  assert.equal(saved.status, "invalidated")
  assert.match(readFileSync(result.checks[0].logPath, "utf8"), /The check itself passed/)
})

test("verification includes new untracked inputs and notices tracked deletions", async (t) => {
  for (const [code, file] of [
    ["writeFileSync('src/new.ts', 'new')", "src/new.ts"],
    ["unlinkSync('src/input.ts')", "src/input.ts"],
  ]) {
    const cwd = repository(t)
    const result = await runVerification({ cwd, checks: ["probe"], command: [process.execPath, "-e", `
      const {writeFileSync, unlinkSync} = require('node:fs'); ${code}
    `] })
    assert.equal(result.status, "invalidated")
    assert.deepEqual(result.changedFiles, [file])
  }
})

test("generated files do not invalidate verification, and repeated runs retain their logs", async (t) => {
  const cwd = repository(t)
  const options = { cwd, checks: ["probe"], command: [process.execPath, "-e", `
    const fs = require('node:fs')
    fs.mkdirSync('.next', {recursive: true})
    fs.writeFileSync('.next/generated.ts', 'generated')
    fs.writeFileSync('next-env.d.ts', 'generated')
    fs.writeFileSync('.env.local', 'fixture only')
    console.log('retained output')
  `] }
  const first = await runVerification(options)
  const second = await runVerification(options)
  assert.equal(first.status, "passed")
  assert.equal(second.status, "passed")
  assert.equal(second.fingerprint, first.fingerprint)
  assert.notEqual(first.summaryPath, second.summaryPath)
  assert.match(readFileSync(first.checks[0].logPath, "utf8"), /retained output/)
  assert.match(readFileSync(second.checks[0].logPath, "utf8"), /retained output/)
})

test("failed checks retain their exit code and stop later checks", async (t) => {
  const cwd = repository(t)
  const result = await runVerification({ cwd, checks: ["fail", "must-not-run"], command: [process.execPath, "-e", "process.exit(3)"] })
  assert.equal(result.status, "failed")
  assert.equal(result.exitCode, 3)
  assert.equal(result.checks.length, 1)
})
