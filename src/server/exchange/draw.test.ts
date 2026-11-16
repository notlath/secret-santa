import { describe, expect, test } from "vitest"
import { closeRegistration, draw, updateParticipant, hostView, revealView, participantView, lookupByAccessCode, markRevealed } from "."
import { created, joined, setStatus, failSecondAssignmentInsert } from "./test-helpers"

describe("Draw", () => {
  test("a closed Exchange with fewer than 3 Participants cannot be drawn", async () => {
    const exchange = await created()
    const person = await joined(exchange.accessCode, "Mia")
    await updateParticipant(person.personalToken, { wishlist: [{ name: "Book" }, { name: "Mug" }, { name: "Scarf" }] })
    await closeRegistration(exchange.hostToken)

    expect(await draw(exchange.hostToken)).toEqual({ ok: false, error: { code: "too_few_participants" } })
  })
  test.each(["open", "assigned", "completed"] as const)("refuses %s even with 3 Ready Participants", async (status) => {
    const exchange = await created()
    for (const name of ["Mia", "Ben", "Cara"]) {
      const person = await joined(exchange.accessCode, name)
      await updateParticipant(person.personalToken, { wishlist: [{ name: "Book" }, { name: "Mug" }, { name: "Scarf" }] })
    }
    await setStatus(exchange.exchange.id, status)
    expect(await draw(exchange.hostToken)).toEqual({ ok: false, error: { code: status === "open" ? "invalid_transition" : "already_drawn" } })
  })

  test("every Participant must be Ready independently of the count and Status", async () => {
    const exchange = await created()
    for (const name of ["Mia", "Ben", "Cara"]) {
      const person = await joined(exchange.accessCode, name)
      if (name !== "Ben") await updateParticipant(person.personalToken, { wishlist: [{ name: "Book" }, { name: "Mug" }, { name: "Scarf" }] })
    }
    await closeRegistration(exchange.hostToken)
    expect(await draw(exchange.hostToken)).toEqual({ ok: false, error: { code: "not_everyone_ready" } })
  })

  test("only a Host credential can run the Draw", async () => {
    const exchange = await created()
    const person = await joined(exchange.accessCode, "Mia")
    for (const token of [undefined, "unknown", person.personalToken]) {
      expect(await draw(token)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    }
  })
})

async function readyExchange() {
  const exchange = await created()
  const people = []
  for (const name of ["Mia", "Ben", "Cara"]) {
    const person = await joined(exchange.accessCode, name)
    const saved = await updateParticipant(person.personalToken, { wishlist: [
      { name: `${name}'s book`, description: `${name}'s description`, productLink: `https://example.com/${name}` },
      { name: `${name}'s mug` }, { name: `${name}'s scarf` },
    ] })
    expect(saved.ok).toBe(true)
    people.push(person)
  }
  await closeRegistration(exchange.hostToken)
  return { ...exchange, people }
}

test("a Draw assigns everyone a different Recipient and locks edits", async () => {
  const exchange = await readyExchange()
  expect(await draw(exchange.hostToken)).toEqual({ ok: true, value: { status: "assigned" } })
  expect(await hostView(exchange.hostToken)).toMatchObject({ value: { status: "assigned" } })
  const recipients = []
  for (const person of exchange.people) {
    const view = await revealView(person.personalToken)
    expect(view.ok).toBe(true)
    if (!view.ok) throw new Error("Reveal failed")
    expect(view.value.recipient.id).not.toBe(person.participant.id)
    expect(view.value.recipient.wishlist).toHaveLength(3)
    recipients.push(view.value.recipient.id)
    expect(await updateParticipant(person.personalToken, { displayName: "Changed" })).toEqual({ ok: false, error: { code: "invalid_transition" } })
    expect(await updateParticipant(person.personalToken, { wishlist: [{ name: "Changed" }] })).toEqual({ ok: false, error: { code: "invalid_transition" } })
  }
  expect(new Set(recipients)).toEqual(new Set(exchange.people.map((person) => person.participant.id)))
})

test("concurrent Draws have exactly one winner and repeated Draws never replace Recipients", async () => {
  const exchange = await readyExchange()
  const results = await Promise.all([draw(exchange.hostToken), draw(exchange.hostToken)])
  expect(results.filter((result) => result.ok)).toHaveLength(1)
  expect(results.filter((result) => !result.ok)).toEqual([{ ok: false, error: { code: "already_drawn" } }])
  const before = await Promise.all(exchange.people.map((person) => revealView(person.personalToken)))
  expect(await draw(exchange.hostToken)).toEqual({ ok: false, error: { code: "already_drawn" } })
  expect(await Promise.all(exchange.people.map((person) => revealView(person.personalToken)))).toEqual(before)
})

test("an insertion failure rolls back the Status and every Assignment, allowing a clean retry", async () => {
  const exchange = await readyExchange()
  const restore = await failSecondAssignmentInsert(exchange.exchange.id)
  try {
    await expect(draw(exchange.hostToken)).rejects.toThrow()
    expect(await hostView(exchange.hostToken)).toMatchObject({ value: { status: "closed" } })
    for (const person of exchange.people) {
      expect(await revealView(person.personalToken)).toEqual({ ok: false, error: { code: "invalid_transition" } })
    }
  } finally {
    await restore()
  }
  expect((await draw(exchange.hostToken)).ok).toBe(true)
  for (const person of exchange.people) expect((await revealView(person.personalToken)).ok).toBe(true)
})

test("a reveal is private to its Participant and contains only their Recipient's Wishlist", async () => {
  const exchange = await readyExchange()
  for (const person of exchange.people) {
    expect(await revealView(person.personalToken)).toEqual({ ok: false, error: { code: "invalid_transition" } })
  }
  await draw(exchange.hostToken)
  for (const token of [undefined, "unknown", exchange.hostToken]) {
    expect(await revealView(token)).toEqual({ ok: false, error: { code: "invalid_credential" } })
  }
  const host = await hostView(exchange.hostToken)
  const preview = await lookupByAccessCode(exchange.accessCode)
  for (const view of [host, preview]) expect(JSON.stringify(view)).not.toMatch(/recipient|giver|wishlist|'s book/i)
  for (const person of exchange.people) {
    const view = await revealView(person.personalToken)
    if (!view.ok) throw new Error("Reveal failed")
    const recipient = exchange.people.find((other) => other.participant.id === view.value.recipient.id)!
    expect(view.value).toEqual({
      id: exchange.exchange.id, name: "Office Secret Santa", status: "assigned", revealedAt: null,
      recipient: { id: recipient.participant.id, displayName: recipient.participant.displayName, wishlist: [
        { position: 1, name: `${recipient.participant.displayName}'s book`, description: `${recipient.participant.displayName}'s description`, productLink: `https://example.com/${recipient.participant.displayName}` },
        { position: 2, name: `${recipient.participant.displayName}'s mug`, description: null, productLink: null },
        { position: 3, name: `${recipient.participant.displayName}'s scarf`, description: null, productLink: null },
      ] },
      eventDetails: { eventDate: "2026-12-18", eventTime: "19:30", location: "Mia's flat", budgetAmount: "25.50", budgetCurrency: "EUR", description: "Bring something cosy", instructions: "No gift cards", notes: "Ugly sweaters welcome" },
    })
    const personal = await participantView(person.personalToken)
    expect(JSON.stringify(personal)).not.toMatch(/recipientId|giverId|assignments/)
    for (const other of exchange.people.filter((other) => other !== person)) {
      expect(JSON.stringify(personal)).not.toContain(`${other.participant.displayName}'s book`)
    }
  }
})

test("opening a reveal records its first timestamp once, without changing any Recipient", async () => {
  const exchange = await readyExchange()
  const person = exchange.people[0]
  expect(await markRevealed(person.personalToken)).toEqual({ ok: false, error: { code: "invalid_transition" } })
  await draw(exchange.hostToken)
  for (const token of [undefined, "unknown", exchange.hostToken]) {
    expect(await markRevealed(token)).toEqual({ ok: false, error: { code: "invalid_credential" } })
  }
  const first = await markRevealed(person.personalToken)
  expect(first).toMatchObject({ ok: true, value: { revealedAt: expect.any(Date) } })
  const before = await Promise.all(exchange.people.map((person) => revealView(person.personalToken)))
  expect(await markRevealed(person.personalToken)).toEqual(first)
  expect(await Promise.all(exchange.people.map((person) => revealView(person.personalToken)))).toEqual(before)
  const host = await hostView(exchange.hostToken)
  expect(host).toMatchObject({ value: { participants: [
    { id: person.participant.id, revealedAt: first.ok && first.value.revealedAt },
    { revealedAt: null }, { revealedAt: null },
  ] } })
})
