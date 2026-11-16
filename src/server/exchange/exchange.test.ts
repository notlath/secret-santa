import { describe, expect, test } from "vitest"
import { createExchange, hostView, type ExchangeDetailsInput } from "."

function details(overrides: Partial<ExchangeDetailsInput> = {}): ExchangeDetailsInput {
  return {
    name: "Office Secret Santa",
    maxParticipants: 10,
    eventDate: "2026-12-18",
    eventTime: "19:30",
    location: "Mia's flat",
    budgetAmount: "25.50",
    budgetCurrency: "EUR",
    description: "Bring something cosy",
    instructions: "No gift cards",
    notes: "Ugly sweaters welcome",
    ...overrides,
  }
}

async function created(overrides: Partial<ExchangeDetailsInput> = {}) {
  const result = await createExchange(details(overrides))
  if (!result.ok) throw new Error(`createExchange failed: ${JSON.stringify(result.error)}`)
  return result.value
}

describe("createExchange", () => {
  test("the Host Link opens a host view with the Event Details exactly as entered", async () => {
    const { exchange, accessCode, hostToken } = await created()

    const view = await hostView(hostToken)

    expect(view).toEqual({
      ok: true,
      value: {
        id: exchange.id,
        name: "Office Secret Santa",
        status: "open",
        accessCode,
        maxParticipants: 10,
        eventDetails: {
          eventDate: "2026-12-18",
          eventTime: "19:30",
          location: "Mia's flat",
          budgetAmount: "25.50",
          budgetCurrency: "EUR",
          description: "Bring something cosy",
          instructions: "No gift cards",
          notes: "Ugly sweaters welcome",
        },
      },
    })
  })

  test("gives each Exchange a readable Access Code and a long Host Link token of its own", async () => {
    const first = await created()
    const second = await created()

    expect(first.accessCode).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)
    expect(first.hostToken).toMatch(/^[A-Za-z0-9_-]{22,}$/)
    expect(second.accessCode).not.toBe(first.accessCode)
    expect(second.hostToken).not.toBe(first.hostToken)
    expect((await hostView(second.hostToken)).ok && (await hostView(second.hostToken))).toMatchObject({
      value: { id: second.exchange.id },
    })
  })

  test("optional fields can be left out", async () => {
    const { hostToken } = await created({
      budgetAmount: "",
      budgetCurrency: "EUR",
      description: "",
      instructions: undefined,
      notes: null,
    })

    const view = await hostView(hostToken)

    expect(view).toMatchObject({
      ok: true,
      value: {
        eventDetails: {
          budgetAmount: null,
          budgetCurrency: null,
          description: null,
          instructions: null,
          notes: null,
        },
      },
    })
  })

  test("trims text fields", async () => {
    const { hostToken } = await created({ name: "  Family  ", location: " Grandma's " })

    expect(await hostView(hostToken)).toMatchObject({
      value: { name: "Family", eventDetails: { location: "Grandma's" } },
    })
  })

  test.each<[string, Partial<ExchangeDetailsInput>, string]>([
    ["an empty name", { name: "   " }, "name"],
    ["a name over 60 characters", { name: "x".repeat(61) }, "name"],
    ["an empty location", { location: "" }, "location"],
    ["a location over 120 characters", { location: "x".repeat(121) }, "location"],
    ["fewer than 3 Participants", { maxParticipants: 2 }, "maxParticipants"],
    ["more than 50 Participants", { maxParticipants: 51 }, "maxParticipants"],
    ["a fractional Participant count", { maxParticipants: 4.5 }, "maxParticipants"],
    ["a missing date", { eventDate: "" }, "eventDate"],
    ["an impossible date", { eventDate: "2026-02-30" }, "eventDate"],
    ["a missing time", { eventTime: "" }, "eventTime"],
    ["an impossible time", { eventTime: "25:00" }, "eventTime"],
    ["a zero budget", { budgetAmount: "0" }, "budgetAmount"],
    ["a negative budget", { budgetAmount: "-5" }, "budgetAmount"],
    ["a budget with 3 decimals", { budgetAmount: "10.005" }, "budgetAmount"],
    ["a budget that isn't a number", { budgetAmount: "ten" }, "budgetAmount"],
    ["a budget without a currency", { budgetAmount: "20", budgetCurrency: "" }, "budgetCurrency"],
    ["an unknown currency", { budgetCurrency: "ZZZ" }, "budgetCurrency"],
    ["a description over 1,000 characters", { description: "x".repeat(1001) }, "description"],
    ["instructions over 1,000 characters", { instructions: "x".repeat(1001) }, "instructions"],
    ["notes over 1,000 characters", { notes: "x".repeat(1001) }, "notes"],
  ])("refuses %s", async (_, overrides, field) => {
    const result = await createExchange(details(overrides))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe("validation")
    expect(result.error).toHaveProperty(["fields", field], expect.any(String))
  })

  test("accepts the limits", async () => {
    const result = await createExchange(
      details({
        name: "x".repeat(60),
        location: "x".repeat(120),
        maxParticipants: 50,
        budgetAmount: "0.01",
        description: "x".repeat(1000),
      }),
    )
    expect(result.ok).toBe(true)
    expect((await createExchange(details({ maxParticipants: 3 }))).ok).toBe(true)
  })

  test("reports every invalid field at once", async () => {
    const result = await createExchange(details({ name: "", location: "" }))

    expect(result).toEqual({
      ok: false,
      error: { code: "validation", fields: { name: expect.any(String), location: expect.any(String) } },
    })
  })
})

describe("hostView", () => {
  test("refuses a missing or unknown Host Link", async () => {
    await created()

    expect(await hostView(undefined)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    expect(await hostView("")).toEqual({ ok: false, error: { code: "invalid_credential" } })
    expect(await hostView("not-a-real-token-aaaaaaaaaaaaaaaa")).toEqual({
      ok: false,
      error: { code: "invalid_credential" },
    })
  })
})
