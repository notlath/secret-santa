import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { test } from "node:test"
import { prepareE2E } from "./prepare-e2e.mjs"

function fixture(t, contents) {
  const output = mkdtempSync(path.join(os.tmpdir(), "gx-e2e-lock-"))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  mkdirSync(path.join(output, "dev"))
  if (contents !== undefined) writeFileSync(path.join(output, "dev", "lock"), contents)
  return output
}

test("a fresh output directory needs no recovery", (t) => {
  const output = fixture(t)
  prepareE2E(output)
  assert.deepEqual(readdirSync(path.join(output, "dev")), [])
})

test("a live process retains its lock and blocks a competing run", (t) => {
  const contents = JSON.stringify({ pid: process.pid })
  const output = fixture(t, contents)
  assert.throws(() => prepareE2E(output), /owned by live PID/)
  assert.equal(readFileSync(path.join(output, "dev", "lock"), "utf8"), contents)
})

test("an exited process's lock is preserved under a stale filename", (t) => {
  const child = spawnSync(process.execPath, ["-e", ""])
  assert.equal(child.status, 0)
  const contents = JSON.stringify({ pid: child.pid })
  const output = fixture(t, contents)
  prepareE2E(output)
  const files = readdirSync(path.join(output, "dev"))
  assert.equal(files.length, 1)
  assert.match(files[0], /^lock\.stale-/)
  assert.equal(readFileSync(path.join(output, "dev", files[0]), "utf8"), contents)
})

for (const contents of ["not-json", "null", "{}", JSON.stringify({ pid: -1 }), JSON.stringify({ pid: "123" })]) {
  test(`an unreadable or invalid lock is preserved: ${contents}`, (t) => {
    const output = fixture(t, contents)
    assert.throws(() => prepareE2E(output), /Inspect it before retrying E2E/)
    assert.equal(readFileSync(path.join(output, "dev", "lock"), "utf8"), contents)
  })
}
