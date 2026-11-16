import { describe, expect, test } from "vitest"
import { hostView, join, lookupByAccessCode, participantView } from "."
import { created, joined, setStatus } from "./test-helpers"

describe("join", () => {
  test("a Participant who joins appears on the Host dashboard by display name", async () => {
    const { accessCode, hostToken } = await created()

    const result = await join(accessCode, "Mia")

    expect(result).toMatchObject({ ok: true, value: { participant: { displayName: "Mia" } } })
    expect(await hostView(hostToken)).toMatchObject({
      ok: true,
      value: { participants: [{ displayName: "Mia" }] },
    })
  })

  test("accepts the Access Code in any case, with or without the dash", async () => {
    const { accessCode, hostToken } = await created()

    expect((await join(accessCode.toLowerCase(), "Mia")).ok).toBe(true)
    expect((await join(` ${accessCode.replace("-", "")} `, "Ben")).ok).toBe(true)
    expect(await hostView(hostToken)).toMatchObject({
      value: { participants: [{ displayName: "Mia" }, { displayName: "Ben" }] },
    })
  })

  test("refuses an unknown Access Code", async () => {
    await created()

    expect(await join("AAAA-AAAA", "Mia")).toEqual({ ok: false, error: { code: "not_found" } })
  })

  test("refuses a display name already taken, ignoring case and repeated whitespace", async () => {
    const { accessCode, hostToken } = await created()
    await joined(accessCode, "Mary  Ann")

    expect(await join(accessCode, "  mary ann ")).toEqual({ ok: false, error: { code: "display_name_taken" } })
    expect(await join(accessCode, "MARY\tANN")).toEqual({ ok: false, error: { code: "display_name_taken" } })
    expect(await hostView(hostToken)).toMatchObject({ value: { participants: [{ displayName: "Mary  Ann" }] } })
  })

  test("the same display name can be used in another Exchange", async () => {
    const first = await created()
    const second = await created()
    await joined(first.accessCode, "Mia")

    expect((await join(second.accessCode, "Mia")).ok).toBe(true)
  })

  test("trims the display name", async () => {
    const { accessCode } = await created()

    expect(await join(accessCode, "  Mia ")).toMatchObject({ ok: true, value: { participant: { displayName: "Mia" } } })
  })

  test.each([
    ["an empty display name", "   "],
    ["a display name over 30 characters", "x".repeat(31)],
  ])("refuses %s", async (_, name) => {
    const { accessCode } = await created()

    expect(await join(accessCode, name)).toEqual({
      ok: false,
      error: { code: "validation", fields: { displayName: expect.any(String) } },
    })
  })

  test("accepts a 30-character display name", async () => {
    const { accessCode } = await created()

    expect((await join(accessCode, ` ${"x".repeat(30)} `)).ok).toBe(true)
  })

  test("refuses joining a full Exchange", async () => {
    const { accessCode, hostToken } = await created({ maxParticipants: 3 })
    await joined(accessCode, "Mia")
    await joined(accessCode, "Ben")
    await joined(accessCode, "Ana")

    expect(await join(accessCode, "Leo")).toEqual({ ok: false, error: { code: "exchange_full" } })
    expect(await hostView(hostToken)).toMatchObject({ value: { participants: { length: 3 } } })
  })

  test.each(["closed", "assigned", "completed"] as const)("refuses joining a %s Exchange", async (status) => {
    const { exchange, accessCode } = await created()
    await setStatus(exchange.id, status)

    expect(await join(accessCode, "Mia")).toEqual({ ok: false, error: { code: "invalid_transition" } })
  })

  test("simultaneous joins can't exceed the maximum", async () => {
    const { accessCode, hostToken } = await created({ maxParticipants: 3 })
    await joined(accessCode, "Mia")
    await joined(accessCode, "Ben")

    const names = ["Ana", "Leo", "Zoe", "Kai", "Eva", "Max"]
    // Open a connection per join first, so the joins really overlap instead of queueing on connection setup.
    await Promise.all(names.map(() => lookupByAccessCode(accessCode)))

    const results = await Promise.all(names.map((name) => join(accessCode, name)))

    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(results.filter((result) => !result.ok)).toEqual(
      Array(names.length - 1).fill({ ok: false, error: { code: "exchange_full" } }),
    )
    expect(await hostView(hostToken)).toMatchObject({ value: { participants: { length: 3 } } })
  })
})

describe("lookupByAccessCode", () => {
  test("previews the Exchange name, Event Details and Status before joining", async () => {
    const { accessCode } = await created()

    expect(await lookupByAccessCode(accessCode.toLowerCase())).toEqual({
      ok: true,
      value: {
        name: "Office Secret Santa",
        accessCode,
        status: "open",
        full: false,
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

  test("says when the Exchange is full", async () => {
    const { accessCode } = await created({ maxParticipants: 3 })
    for (const name of ["Mia", "Ben", "Ana"]) await joined(accessCode, name)

    expect(await lookupByAccessCode(accessCode)).toMatchObject({ ok: true, value: { full: true } })
  })

  test("refuses an unknown Access Code", async () => {
    expect(await lookupByAccessCode("AAAA-AAAA")).toEqual({ ok: false, error: { code: "not_found" } })
    expect(await lookupByAccessCode("")).toEqual({ ok: false, error: { code: "not_found" } })
  })
})

describe("Personal Link", () => {
  test("opens the Participant's own view with the Event Details", async () => {
    const { exchange, accessCode } = await created()
    const { personalToken, participant } = await joined(accessCode, "Mia")

    expect(await participantView(personalToken)).toEqual({
      ok: true,
      value: {
        id: exchange.id,
        name: "Office Secret Santa",
        status: "open",
        me: { id: participant.id, displayName: "Mia" },
        eventDetails: expect.objectContaining({ eventDate: "2026-12-18", location: "Mia's flat" }),
      },
    })
  })

  test("is a long token of its own for each Participant", async () => {
    const { accessCode } = await created()
    const mia = await joined(accessCode, "Mia")
    const ben = await joined(accessCode, "Ben")

    expect(mia.personalToken).toMatch(/^[A-Za-z0-9_-]{22,}$/)
    expect(ben.personalToken).not.toBe(mia.personalToken)
    expect(await participantView(ben.personalToken)).toMatchObject({ value: { me: { displayName: "Ben" } } })
  })

  test("refuses a missing or unknown Personal Link", async () => {
    expect(await participantView(undefined)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    expect(await participantView("not-a-real-token-aaaaaaaaaaaaaaaa")).toEqual({
      ok: false,
      error: { code: "invalid_credential" },
    })
  })

  test("can't perform host operations, and the Host Link isn't a Personal Link", async () => {
    const { accessCode, hostToken } = await created()
    const { personalToken } = await joined(accessCode, "Mia")

    expect(await hostView(personalToken)).toEqual({ ok: false, error: { code: "invalid_credential" } })
    expect(await participantView(hostToken)).toEqual({ ok: false, error: { code: "invalid_credential" } })
  })
})
