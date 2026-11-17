import assert from "node:assert/strict"
import { createServer } from "node:net"
import { test } from "node:test"
import { selectE2EPort } from "./run-e2e.mjs"

test("reserved and invalid explicit ports fail with an explanation", async () => {
  await assert.rejects(selectE2EPort("4045"), /4045.*reserved/)
  for (const value of ["abc", "", "0", "65536", "1.5", "-1"]) {
    await assert.rejects(selectE2EPort(value), /E2E_PORT/)
  }
})

test("an occupied explicit port fails instead of reusing another server", async (t) => {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  await assert.rejects(selectE2EPort(String(server.address().port)), /already in use/)
})

test("automatically selected ports can be bound, and a valid override is preserved", async () => {
  const port = await selectE2EPort()
  assert.equal(await selectE2EPort(String(port)), port)
  const server = createServer()
  try {
    await new Promise((resolve, reject) => { server.on("error", reject); server.listen(port, resolve) })
    assert.equal(server.address().port, port)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
