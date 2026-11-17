import { describe, expect, test } from "vitest"
import { hostView, participantView, revealView, updateEventDetails, type EventDetailsInput } from "."
import { created, drawnExchange, joined, setStatus } from "./test-helpers"

function edited(overrides: Partial<EventDetailsInput> = {}): EventDetailsInput {
  return {
    eventDate: "2026-12-19",
    eventTime: "18:00",
    location: "Ben's garden",
    budgetAmount: "30",
    budgetCurrency: "GBP",
    description: "Mulled wine provided",
    instructions: "Handmade is fine",
    notes: null,
    ...overrides,
  }
}

describe("updateEventDetails", () => {
  test("the Host's edit shows up for the Host and every Participant", async () => {
    const { accessCode, hostToken } = await created()
    const mia = await joined(accessCode, "Mia")

    const result = await updateEventDetails(hostToken, edited())

    const expected = {
      eventDate: "2026-12-19",
      eventTime: "18:00",
      location: "Ben's garden",
      budgetAmount: "30.00",
      budgetCurrency: "GBP",
      description: "Mulled wine provided",
      instructions: "Handmade is fine",
      notes: null,
    }
    expect(result).toEqual({ ok: true, value: { eventDetails: expected } })
    expect(await hostView(hostToken)).toMatchObject({ value: { eventDetails: expected } })
    expect(await participantView(mia.personalToken)).toMatchObject({ value: { eventDetails: expected } })
  })

  test("only the Host can edit: a Personal Link, another Exchange's Host Link or no link is refused", async () => {
    const { accessCode, hostToken } = await created()
    const other = await created()
    const mia = await joined(accessCode, "Mia")

    for (const token of [mia.personalToken, undefined, "not-a-token"]) {
      // Refused before validation, so a stranger learns nothing from field errors.
      expect(await updateEventDetails(token, edited({ location: "" }))).toEqual({
        ok: false,
        error: { code: "invalid_credential" },
      })
    }
    expect((await updateEventDetails(other.hostToken, edited())).ok).toBe(true)
    expect(await hostView(hostToken)).toMatchObject({ value: { eventDetails: { location: "Mia's flat" } } })
  })

  test("applies the same validation as creating an Exchange and changes nothing when invalid", async () => {
    const { hostToken } = await created()

    const result = await updateEventDetails(
      hostToken,
      edited({ location: "  ", eventDate: "2026-02-30", eventTime: "25:00", budgetAmount: "-1", budgetCurrency: "" }),
    )

    expect(result).toEqual({
      ok: false,
      error: {
        code: "validation",
        fields: {
          location: "Say where the gifts are handed over.",
          eventDate: "Pick the date of the meetup.",
          eventTime: "Pick the time of the meetup.",
          budgetAmount: "Enter a positive amount with at most 2 decimals.",
          budgetCurrency: "Choose a currency for the budget.",
        },
      },
    })
    expect(await hostView(hostToken)).toMatchObject({ value: { eventDetails: { location: "Mia's flat" } } })
  })

  test("clearing the budget removes both amount and currency", async () => {
    const { hostToken } = await created()

    const result = await updateEventDetails(hostToken, edited({ budgetAmount: "", budgetCurrency: "GBP" }))

    expect(result).toMatchObject({ ok: true, value: { eventDetails: { budgetAmount: null, budgetCurrency: null } } })
  })

  test("leaves the Exchange name, maximum and Status alone", async () => {
    const { hostToken } = await created({ name: "Book Club", maxParticipants: 7 })

    await updateEventDetails(hostToken, edited())

    expect(await hostView(hostToken)).toMatchObject({
      value: { name: "Book Club", maxParticipants: 7, status: "open" },
    })
  })

  test.each(["closed", "assigned"] as const)("is allowed while the Exchange is %s", async (status) => {
    const { exchange, hostToken } = await created()
    await setStatus(exchange.id, status)

    expect(await updateEventDetails(hostToken, edited())).toMatchObject({ ok: true })
  })

  test("an edit after the Draw changes no Assignment", async () => {
    const exchange = await drawnExchange(["Ana", "Ben", "Cara"])
    const recipients = async () => Promise.all(exchange.people.map(async (person) => {
      const view = await revealView(person.personalToken)
      return view.ok ? view.value.recipient.displayName : view.error.code
    }))
    const before = await recipients()
    expect((await updateEventDetails(exchange.hostToken, edited())).ok).toBe(true)
    expect(await recipients()).toEqual(before)
  })

  test("is refused once the Exchange is completed", async () => {
    const { exchange, hostToken } = await created()
    await setStatus(exchange.id, "completed")

    expect(await updateEventDetails(hostToken, edited())).toEqual({
      ok: false,
      error: { code: "invalid_transition" },
    })
    expect(await hostView(hostToken)).toMatchObject({ value: { eventDetails: { location: "Mia's flat" } } })
  })
})
