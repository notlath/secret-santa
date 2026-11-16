import { describe, expect, it } from "vitest"
import { hostView, participantView, removeParticipant, reissuePersonalLink, updateParticipant } from "."
import { created, joined, setStatus } from "./test-helpers"

describe("Participant management", () => {
  it("lets the Host remove a Participant and revokes their link", async () => {
    const exchange = await created()
    const person = await joined(exchange.accessCode, "Ben")
    await updateParticipant(person.personalToken, { wishlist: [{ name: "Book" }] })
    expect((await removeParticipant(exchange.hostToken, person.participant.id)).ok).toBe(true)
    expect(await participantView(person.personalToken)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    const view = await hostView(exchange.hostToken)
    expect(view.ok && view.value.participants).toEqual([])
  })
  it("reissues a link and preserves the Participant's Wishlist", async () => {
    const exchange = await created()
    const person = await joined(exchange.accessCode, "Ben")
    await updateParticipant(person.personalToken, { wishlist: [{ name: "Book" }] })
    const result = await reissuePersonalLink(exchange.hostToken, person.participant.id)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error("Reissue failed")
    expect(await participantView(person.personalToken)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    const view = await participantView(result.value.personalToken)
    expect(view.ok && view.value.me).toMatchObject({ displayName: "Ben", wishlist: [{ name: "Book" }] })
  })
  for (const operation of [removeParticipant, reissuePersonalLink]) {
    for (const status of ["open", "closed", "assigned", "completed"] as const) {
      it(`${operation.name} enforces role and ${status} status`, async () => {
        const exchange = await created()
        const person = await joined(exchange.accessCode, "Ben")
        await setStatus(exchange.exchange.id, status)
        expect(await operation(person.personalToken, person.participant.id)).toEqual({ ok: false, error: { code: "invalid_credential" } })
        const result = await operation(exchange.hostToken, person.participant.id)
        expect(result.ok).toBe(status === "open" || status === "closed")
        if (!result.ok) expect(result.error.code).toBe("invalid_transition")
      })
    }
    it(`${operation.name} cannot target another Exchange`, async () => {
      const exchange = await created()
      const other = await created()
      const person = await joined(other.accessCode, "Ben")
      expect(await operation(exchange.hostToken, person.participant.id)).toEqual({ ok: false, error: { code: "not_found" } })
    })
  }
})
