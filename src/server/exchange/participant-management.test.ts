import { describe, expect, it } from "vitest"
import { hostView, markRevealed, participantView, removeParticipant, reissuePersonalLink, revealView, updateParticipant } from "."
import { created, drawnExchange, joined, setStatus } from "./test-helpers"

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
  it("reissues a lost link after the Draw: the same Recipient, and the old token refused everywhere", async () => {
    const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
    const ana = exchange.people[0]
    const before = await revealView(ana.personalToken)
    if (!before.ok) throw new Error("Reveal failed")
    const result = await reissuePersonalLink(exchange.hostToken, ana.participant.id)
    if (!result.ok) throw new Error(`Reissue failed: ${result.error.code}`)
    const refused = { ok: false, error: { code: "invalid_credential" } }
    expect(await revealView(ana.personalToken)).toEqual(refused)
    expect(await markRevealed(ana.personalToken)).toEqual(refused)
    expect(await updateParticipant(ana.personalToken, { displayName: "Anna" })).toEqual(refused)
    const after = await revealView(result.value.personalToken)
    expect(after.ok && after.value.recipient.displayName).toBe(before.value.recipient.displayName)
  })
  it("refuses a removed Participant's old token on every operation", async () => {
    const exchange = await created()
    const person = await joined(exchange.accessCode, "Ben")
    expect((await removeParticipant(exchange.hostToken, person.participant.id)).ok).toBe(true)
    const refused = { ok: false, error: { code: "invalid_credential" } }
    expect(await updateParticipant(person.personalToken, { displayName: "Benny" })).toEqual(refused)
    expect(await revealView(person.personalToken)).toEqual(refused)
    expect(await markRevealed(person.personalToken)).toEqual(refused)
  })
  for (const operation of [removeParticipant, reissuePersonalLink]) {
    // Removal in `assigned` closes the gap; remove-after-draw.test.ts covers it.
    for (const status of (["open", "closed", "assigned", "completed"] as const).filter((status) => operation !== removeParticipant || status !== "assigned")) {
      it(`${operation.name} enforces role and ${status} status`, async () => {
        const exchange = await created()
        const person = await joined(exchange.accessCode, "Ben")
        await setStatus(exchange.exchange.id, status)
        expect(await operation(person.personalToken, person.participant.id)).toEqual({ ok: false, error: { code: "invalid_credential" } })
        const result = await operation(exchange.hostToken, person.participant.id)
        const allowed = operation === reissuePersonalLink ? ["open", "closed", "assigned"] : ["open", "closed"]
        expect(result.ok).toBe(allowed.includes(status))
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
