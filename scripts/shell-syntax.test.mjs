import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readdirSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"

const scripts = path.dirname(new URL(import.meta.url).pathname)

// Wizards are interactive, so nothing else ever runs them; at least make sure bash can parse them.
for (const file of readdirSync(scripts).filter((name) => name.endsWith(".sh"))) {
  test(`${file} parses`, () => {
    const result = spawnSync("bash", ["-n", path.join(scripts, file)], { encoding: "utf8" })
    assert.equal(result.status, 0, result.stderr)
  })
}
