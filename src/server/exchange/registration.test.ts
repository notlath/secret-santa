import { describe, expect, it } from "vitest"
import { closeRegistration, reopenRegistration, hostView, join, lookupByAccessCode, participantView, updateParticipant } from "."
import { created, joined, setStatus } from "./test-helpers"

describe("registration", () => {
  it("lets the Host close an open Exchange", async () => {
    const exchange = await created()
    expect(await closeRegistration(exchange.hostToken)).toEqual({ ok: true, value: { status: "closed" } })
    const view = await hostView(exchange.hostToken)
    expect(view.ok && view.value.status).toBe("closed")
  })
  it("lets the Host reopen a closed Exchange", async () => {
    const exchange = await created()
    await closeRegistration(exchange.hostToken)
    expect(await reopenRegistration(exchange.hostToken)).toEqual({ ok: true, value: { status: "open" } })
    const view = await hostView(exchange.hostToken)
    expect(view.ok && view.value.status).toBe("open")
  })
  for (const [operation, allowed] of [[closeRegistration, "open"], [reopenRegistration, "closed"]] as const) {
    for (const status of ["open", "closed", "assigned", "completed"] as const) {
      if (status === allowed) continue
      it(`${operation.name} refuses ${status} without changing Status`, async () => {
        const exchange = await created()
        await setStatus(exchange.exchange.id, status)
        expect(await operation(exchange.hostToken)).toEqual({ ok: false, error: { code: "invalid_transition" } })
        const view = await hostView(exchange.hostToken)
        expect(view.ok && view.value.status).toBe(status)
      })
    }
    it(`${operation.name} refuses missing, unknown, and Participant credentials`, async () => {
      const exchange = await created()
      const person = await joined(exchange.accessCode, "Ben")
      for (const token of [undefined, "unknown", person.personalToken]) {
        expect(await operation(token)).toEqual({ ok: false, error: { code: "invalid_credential" } })
      }
      const view = await hostView(exchange.hostToken)
      expect(view.ok && view.value.status).toBe("open")
    })
  }

  it("refuses joins while closed and permits them again after reopening", async () => {
    const exchange = await created()
    await closeRegistration(exchange.hostToken)
    expect(await join(exchange.accessCode, "Ben")).toEqual({ ok: false, error: { code: "invalid_transition" } })
    const preview = await lookupByAccessCode(exchange.accessCode)
    expect(preview.ok && preview.value.status).toBe("closed")
    await reopenRegistration(exchange.hostToken)
    expect((await join(exchange.accessCode, "Ben")).ok).toBe(true)
  })

  it("keeps Wishlist and display name edits available while closed", async () => {
    const exchange = await created()
    const person = await joined(exchange.accessCode, "Ben")
    await closeRegistration(exchange.hostToken)
    const wishlist = [1, 2, 3].map((position) => ({ position, name: `Gift ${position}` }))
    expect((await updateParticipant(person.personalToken, { displayName: "Benji", wishlist })).ok).toBe(true)
    const view = await participantView(person.personalToken)
    expect(view.ok && view.value.me).toMatchObject({ displayName: "Benji", ready: true, wishlist })
  })
})
