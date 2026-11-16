import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { db } from "@/server/db"
import { assignment, exchange as exchangeTable, participant, wishlistItem } from "@/server/db/schema"
import {
  closeRegistration, deleteExchange, deviceExchanges, draw, hostView, join, markCompleted, markRevealed, participantView,
  reissuePersonalLink, removeParticipant, reopenRegistration, revealView, updateEventDetails, updateParticipant,
} from "."
import { created, drawnExchange, joined, setStatus } from "./test-helpers"

describe("markCompleted", () => {
  it("moves an assigned Exchange to completed", async () => {
    const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
    expect(await markCompleted(exchange.hostToken)).toEqual({ ok: true, value: { status: "completed" } })
    const view = await hostView(exchange.hostToken)
    expect(view.ok && view.value.status).toBe("completed")
  })

  for (const status of ["open", "closed", "completed"] as const) {
    it(`refuses ${status} without changing Status`, async () => {
      const exchange = await created()
      await setStatus(exchange.exchange.id, status)
      expect(await markCompleted(exchange.hostToken)).toEqual({ ok: false, error: { code: "invalid_transition" } })
      const view = await hostView(exchange.hostToken)
      expect(view.ok && view.value.status).toBe(status)
    })
  }

  it("refuses missing, unknown and Participant credentials", async () => {
    const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
    for (const token of [undefined, "unknown", exchange.people[0].personalToken]) {
      expect(await markCompleted(token)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    }
    const view = await hostView(exchange.hostToken)
    expect(view.ok && view.value.status).toBe("assigned")
  })
})

describe("a Completed Exchange", () => {
  async function completed() {
    const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
    expect((await markCompleted(exchange.hostToken)).ok).toBe(true)
    return exchange
  }

  it("refuses every edit and leaves the data unchanged", async () => {
    const exchange = await completed()
    const [ana, ben] = exchange.people
    const refused = { ok: false, error: { code: "invalid_transition" } }
    expect(await updateEventDetails(exchange.hostToken, { eventDate: "2027-01-01", eventTime: "10:00", location: "Elsewhere" })).toEqual(refused)
    expect(await updateParticipant(ana.personalToken, { displayName: "Anna" })).toEqual(refused)
    expect(await updateParticipant(ana.personalToken, { wishlist: [{ name: "x" }, { name: "y" }, { name: "z" }] })).toEqual(refused)
    expect(await removeParticipant(exchange.hostToken, ben.participant.id)).toEqual(refused)
    expect(await reissuePersonalLink(exchange.hostToken, ben.participant.id)).toEqual(refused)
    expect(await closeRegistration(exchange.hostToken)).toEqual(refused)
    expect(await reopenRegistration(exchange.hostToken)).toEqual(refused)
    expect(await join(exchange.accessCode, "Late")).toEqual(refused)
    expect(await draw(exchange.hostToken)).toEqual({ ok: false, error: { code: "already_drawn" } })

    const view = await participantView(ana.personalToken)
    expect(view.ok && view.value.me).toMatchObject({ displayName: "Ana", ready: true })
    expect(view.ok && view.value.participants).toHaveLength(3)
    expect(view.ok && view.value.eventDetails.location).toBe("Mia's flat")
    expect(await db.$count(assignment, eq(assignment.exchangeId, exchange.exchange.id))).toBe(3)
  })

  it("keeps every Participant's reveal visible", async () => {
    const exchange = await completed()
    for (const person of exchange.people) {
      const view = await revealView(person.personalToken)
      expect(view.ok && view.value.status).toBe("completed")
      expect(view.ok && view.value.recipient.wishlist).toHaveLength(3)
    }
  })

  it("does not change a Participant's revealed mark when they reopen the box", async () => {
    const exchange = await completed()
    const result = await markRevealed(exchange.people[0].personalToken)
    expect(result).toEqual({ ok: true, value: { revealedAt: null } })
  })
})

describe("deleteExchange", () => {
  for (const status of ["open", "closed", "assigned", "completed"] as const) {
    it(`deletes an Exchange in ${status} and cascades to all its data`, async () => {
      const exchange = status === "open" || status === "closed" ? await created() : await drawnExchange(["Ana", "Ben", "Cara"])
      if (status === "open" || status === "closed") {
        const person = await joined(exchange.accessCode, "Ana")
        await updateParticipant(person.personalToken, { wishlist: [{ name: "a" }, { name: "b" }, { name: "c" }] })
        await setStatus(exchange.exchange.id, status)
      }
      if (status === "completed") await markCompleted(exchange.hostToken)
      const id = exchange.exchange.id
      const ids = (await db.select({ id: participant.id }).from(participant).where(eq(participant.exchangeId, id))).map((row) => row.id)
      expect(ids.length).toBeGreaterThan(0)

      expect(await deleteExchange(exchange.hostToken)).toEqual({ ok: true, value: null })

      expect(await db.$count(exchangeTable, eq(exchangeTable.id, id))).toBe(0)
      expect(await db.$count(participant, eq(participant.exchangeId, id))).toBe(0)
      expect(await db.$count(assignment, eq(assignment.exchangeId, id))).toBe(0)
      for (const participantId of ids) expect(await db.$count(wishlistItem, eq(wishlistItem.participantId, participantId))).toBe(0)
    })
  }

  it("refuses missing, unknown and Participant credentials and deletes nothing", async () => {
    const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
    for (const token of [undefined, "unknown", exchange.people[0].personalToken]) {
      expect(await deleteExchange(token)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    }
    expect((await hostView(exchange.hostToken)).ok).toBe(true)
  })

  it("leaves other Exchanges untouched", async () => {
    const doomed = await created()
    const kept = await created()
    await joined(kept.accessCode, "Ana")
    await deleteExchange(doomed.hostToken)
    const view = await hostView(kept.hostToken)
    expect(view.ok && view.value.participants).toHaveLength(1)
  })

  it("makes every Host and Personal Link stop working", async () => {
    const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
    await deleteExchange(exchange.hostToken)
    const invalid = { ok: false, error: { code: "invalid_credential" } }
    expect(await hostView(exchange.hostToken)).toEqual(invalid)
    expect(await deleteExchange(exchange.hostToken)).toEqual(invalid)
    for (const person of exchange.people) {
      expect(await participantView(person.personalToken)).toEqual(invalid)
      expect(await revealView(person.personalToken)).toEqual(invalid)
    }
    expect(await deviceExchanges([
      { exchangeId: exchange.exchange.id, role: "host", token: exchange.hostToken },
      { exchangeId: exchange.exchange.id, role: "participant", token: exchange.people[0].personalToken },
    ])).toEqual([])
    expect(await join(exchange.accessCode, "Late")).toEqual({ ok: false, error: { code: "not_found" } })
  })
})
