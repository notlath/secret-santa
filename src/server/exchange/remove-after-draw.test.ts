import { expect, test } from "vitest"
import { closeRegistration, draw, hostView, markRevealed, participantView, removeParticipant, revealView, updateParticipant } from "."
import { created, joined } from "./test-helpers"

async function drawnExchange(names: string[]) {
  const exchange = await created()
  const people = []
  for (const name of names) {
    const person = await joined(exchange.accessCode, name)
    await updateParticipant(person.personalToken, { wishlist: [{ name: `${name}'s book` }, { name: `${name}'s mug` }, { name: `${name}'s scarf` }] })
    people.push(person)
  }
  await closeRegistration(exchange.hostToken)
  expect((await draw(exchange.hostToken)).ok).toBe(true)
  return { ...exchange, people }
}

async function recipientsOf(people: Awaited<ReturnType<typeof drawnExchange>>["people"]) {
  const result = new Map<string, string>()
  for (const person of people) {
    const view = await revealView(person.personalToken)
    if (view.ok) result.set(person.participant.id, view.value.recipient.id)
  }
  return result
}

test("removing after the Draw changes exactly one Giver's Recipient and keeps one valid circle", async () => {
  const exchange = await drawnExchange(["Ana", "Ben", "Cara", "Dev"])
  const before = await recipientsOf(exchange.people)
  const removed = exchange.people[1]
  const giver = exchange.people.find((person) => before.get(person.participant.id) === removed.participant.id)!
  for (const person of exchange.people) await markRevealed(person.personalToken)

  expect((await removeParticipant(exchange.hostToken, removed.participant.id)).ok).toBe(true)

  const remaining = exchange.people.filter((person) => person !== removed)
  const after = await recipientsOf(remaining)
  const changed = remaining.filter((person) => after.get(person.participant.id) !== before.get(person.participant.id))
  expect(changed).toEqual([giver])
  expect(after.get(giver.participant.id)).toBe(before.get(removed.participant.id))
  expect(new Set(after.values())).toEqual(new Set(remaining.map((person) => person.participant.id)))
  for (const [giverId, recipientId] of after) expect(recipientId).not.toBe(giverId)

  const giverView = await revealView(giver.personalToken)
  expect(giverView.ok && giverView.value.revealedAt).toBeNull()
  expect(giverView.ok && giverView.value.recipientChangedBecause).toBe(removed.participant.displayName)
  for (const person of remaining.filter((person) => person !== giver)) {
    const view = await revealView(person.personalToken)
    expect(view.ok && view.value.revealedAt).not.toBeNull()
    expect(view.ok && view.value.recipientChangedBecause).toBeNull()
  }
  const host = await hostView(exchange.hostToken)
  expect(host.ok && host.value.participants.filter((person) => person.revealedAt)).toHaveLength(2)
  expect(await participantView(removed.personalToken)).toEqual({ ok: false, error: { code: "invalid_credential" } })
  expect(await revealView(removed.personalToken)).toEqual({ ok: false, error: { code: "invalid_credential" } })
})

test("only the Host can remove after the Draw", async () => {
  const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
  const target = exchange.people[2].participant.id
  for (const token of [undefined, "unknown", exchange.people[0].personalToken]) {
    expect(await removeParticipant(token, target)).toEqual({ ok: false, error: { code: "invalid_credential" } })
  }
  expect(await recipientsOf(exchange.people)).toHaveProperty("size", 3)
})

test("a removal down to 2 Participants leaves a valid pair, and a 2-person Exchange cannot lose anyone", async () => {
  const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
  expect((await removeParticipant(exchange.hostToken, exchange.people[0].participant.id)).ok).toBe(true)
  const remaining = exchange.people.slice(1)
  const after = await recipientsOf(remaining)
  expect(after.get(remaining[0].participant.id)).toBe(remaining[1].participant.id)
  expect(after.get(remaining[1].participant.id)).toBe(remaining[0].participant.id)
  expect(await removeParticipant(exchange.hostToken, remaining[0].participant.id)).toEqual({ ok: false, error: { code: "too_few_participants" } })
  expect(await recipientsOf(remaining)).toEqual(after)
})

test("a second removal updates the note for a Giver who is affected again", async () => {
  const exchange = await drawnExchange(["Ana", "Ben", "Cara", "Dev"])
  const before = await recipientsOf(exchange.people)
  const [first] = exchange.people
  const giver = exchange.people.find((person) => before.get(person.participant.id) === first.participant.id)!
  await removeParticipant(exchange.hostToken, first.participant.id)
  const next = (await recipientsOf(exchange.people.filter((person) => person !== first))).get(giver.participant.id)!
  const second = exchange.people.find((person) => person.participant.id === next)!
  await removeParticipant(exchange.hostToken, second.participant.id)
  const view = await revealView(giver.personalToken)
  expect(view.ok && view.value.recipientChangedBecause).toBe(second.participant.displayName)
})
