import { describe, expect, test } from "vitest"
import { hostView, join, participantView, updateParticipant } from "."
import { created, joined, setStatus } from "./test-helpers"

const threeItems = [{ name: "Wool socks" }, { name: "A good book", description: "Any crime novel" }, { name: "Mug" }]

async function participant() {
  const exchange = await created()
  const me = await joined(exchange.accessCode, "Mia")
  return { ...exchange, ...me }
}

describe("updateParticipant: Wishlist", () => {
  test("a partial Wishlist saves, and the Participant is not Ready", async () => {
    const { personalToken } = await participant()

    const result = await updateParticipant(personalToken, {
      wishlist: [{ name: "Wool socks", description: "Size 42", productLink: "https://example.com/socks" }, { name: "" }, { name: "" }],
    })

    expect(result.ok).toBe(true)
    expect(await participantView(personalToken)).toMatchObject({
      ok: true,
      value: {
        me: {
          ready: false,
          wishlist: [
            { position: 1, name: "Wool socks", description: "Size 42", productLink: "https://example.com/socks" },
          ],
        },
      },
    })
  })

  test("three named items make the Participant Ready, on their page and on the Host dashboard", async () => {
    const { personalToken, hostToken } = await participant()

    const result = await updateParticipant(personalToken, { wishlist: threeItems })

    expect(result).toMatchObject({ ok: true, value: { ready: true } })
    expect(await participantView(personalToken)).toMatchObject({ value: { me: { ready: true } } })
    expect(await hostView(hostToken)).toMatchObject({ value: { participants: [{ displayName: "Mia", ready: true }] } })
  })

  test("the Host dashboard shows who is not Ready yet", async () => {
    const { accessCode, personalToken, hostToken } = await participant()
    const ben = await joined(accessCode, "Ben")
    await updateParticipant(personalToken, { wishlist: threeItems })
    await updateParticipant(ben.personalToken, { wishlist: [{ name: "Book" }, { name: "Mug" }] })

    expect(await hostView(hostToken)).toMatchObject({
      value: {
        participants: [
          { displayName: "Mia", ready: true },
          { displayName: "Ben", ready: false },
        ],
      },
    })
  })

  test("saving again replaces the Wishlist, so clearing an item makes the Participant not Ready", async () => {
    const { personalToken } = await participant()
    await updateParticipant(personalToken, { wishlist: threeItems })

    await updateParticipant(personalToken, { wishlist: [{ name: "Scarf" }, { name: "" }, { name: "Gloves" }] })

    expect(await participantView(personalToken)).toMatchObject({
      value: {
        me: {
          ready: false,
          wishlist: [
            { position: 1, name: "Scarf", description: null, productLink: null },
            { position: 3, name: "Gloves", description: null, productLink: null },
          ],
        },
      },
    })
  })

  test("trims item fields", async () => {
    const { personalToken } = await participant()

    await updateParticipant(personalToken, {
      wishlist: [{ name: "  Scarf ", description: "  red  ", productLink: " http://example.com/scarf " }],
    })

    expect(await participantView(personalToken)).toMatchObject({
      value: { me: { wishlist: [{ name: "Scarf", description: "red", productLink: "http://example.com/scarf" }] } },
    })
  })

  test.each([
    ["an item name over 80 characters", { name: "x".repeat(81) }, "wishlist.1.name"],
    ["a description without a name", { name: " ", description: "Something warm" }, "wishlist.1.name"],
    ["a description over 300 characters", { name: "Scarf", description: "x".repeat(301) }, "wishlist.1.description"],
    ["a product link that isn't a URL", { name: "Scarf", productLink: "example.com/scarf" }, "wishlist.1.productLink"],
    ["a javascript: product link", { name: "Scarf", productLink: "javascript:alert(1)" }, "wishlist.1.productLink"],
    ["an ftp product link", { name: "Scarf", productLink: "ftp://example.com/scarf" }, "wishlist.1.productLink"],
    [
      "a product link over 2,000 characters",
      { name: "Scarf", productLink: `https://example.com/${"x".repeat(1981)}` },
      "wishlist.1.productLink",
    ],
  ])("refuses %s and saves nothing", async (_, item, field) => {
    const { personalToken } = await participant()

    const result = await updateParticipant(personalToken, { wishlist: [item] })

    expect(result).toMatchObject({ ok: false, error: { code: "validation", fields: { [field]: expect.any(String) } } })
    expect(await participantView(personalToken)).toMatchObject({ value: { me: { wishlist: [] } } })
  })

  test("accepts limits exactly at the maximum", async () => {
    const { personalToken } = await participant()

    const result = await updateParticipant(personalToken, {
      wishlist: [
        { name: "x".repeat(80), description: "y".repeat(300), productLink: `https://example.com/${"z".repeat(1980)}` },
      ],
    })

    expect(result.ok).toBe(true)
  })

  test("names the position of the invalid item", async () => {
    const { personalToken } = await participant()

    const result = await updateParticipant(personalToken, {
      wishlist: [{ name: "Scarf" }, { name: "" }, { name: "Gloves", productLink: "nope" }],
    })

    expect(result).toEqual({
      ok: false,
      error: { code: "validation", fields: { "wishlist.3.productLink": expect.any(String) } },
    })
  })
})

describe("updateParticipant: display name", () => {
  test("changes the display name the Host sees", async () => {
    const { personalToken, hostToken } = await participant()

    const result = await updateParticipant(personalToken, { displayName: "  Mia R. " })

    expect(result).toMatchObject({ ok: true, value: { displayName: "Mia R." } })
    expect(await hostView(hostToken)).toMatchObject({ value: { participants: [{ displayName: "Mia R." }] } })
  })

  test("refuses a name another Participant has, ignoring case and repeated whitespace", async () => {
    const { accessCode, personalToken, hostToken } = await participant()
    await joined(accessCode, "Mary  Ann")

    expect(await updateParticipant(personalToken, { displayName: " mary ann" })).toEqual({
      ok: false,
      error: { code: "display_name_taken" },
    })
    expect(await hostView(hostToken)).toMatchObject({
      value: { participants: [{ displayName: "Mia" }, { displayName: "Mary  Ann" }] },
    })
  })

  test("a Participant can change the case of their own name", async () => {
    const { personalToken } = await participant()

    expect(await updateParticipant(personalToken, { displayName: "MIA" })).toMatchObject({
      ok: true,
      value: { displayName: "MIA" },
    })
  })

  test("a joiner can't take a name after another Participant renamed to it", async () => {
    const { accessCode, personalToken } = await participant()
    await updateParticipant(personalToken, { displayName: "Ben" })

    expect(await join(accessCode, "ben")).toEqual({ ok: false, error: { code: "display_name_taken" } })
  })

  test.each([
    ["empty", "  "],
    ["over 30 characters", "x".repeat(31)],
  ])("refuses a display name that is %s", async (_, displayName) => {
    const { personalToken } = await participant()

    expect(await updateParticipant(personalToken, { displayName })).toMatchObject({
      ok: false,
      error: { code: "validation", fields: { displayName: expect.any(String) } },
    })
  })

  test("a refused change saves nothing else in the same request", async () => {
    const { accessCode, personalToken } = await participant()
    await joined(accessCode, "Ben")

    await updateParticipant(personalToken, { displayName: "Ben", wishlist: threeItems })

    expect(await participantView(personalToken)).toMatchObject({
      value: { me: { displayName: "Mia", wishlist: [] } },
    })
  })
})

describe("updateParticipant: permissions", () => {
  test.each(["open", "closed"] as const)("allows edits while %s", async (status) => {
    const { personalToken, exchange } = await participant()
    await setStatus(exchange.id, status)

    expect((await updateParticipant(personalToken, { displayName: "Mia R.", wishlist: threeItems })).ok).toBe(true)
  })

  test.each(["assigned", "completed"] as const)("refuses edits once %s and keeps the Wishlist", async (status) => {
    const { personalToken, exchange } = await participant()
    await updateParticipant(personalToken, { wishlist: [{ name: "Scarf" }] })
    await setStatus(exchange.id, status)

    expect(await updateParticipant(personalToken, { wishlist: threeItems })).toEqual({
      ok: false,
      error: { code: "invalid_transition" },
    })
    expect(await updateParticipant(personalToken, { displayName: "Mia R." })).toEqual({
      ok: false,
      error: { code: "invalid_transition" },
    })
    expect(await participantView(personalToken)).toMatchObject({
      value: { me: { displayName: "Mia", wishlist: [{ name: "Scarf" }] } },
    })
  })

  test("refuses the Host Link and a missing or unknown token", async () => {
    const { hostToken } = await participant()

    for (const token of [hostToken, undefined, "not-a-real-token"]) {
      expect(await updateParticipant(token, { wishlist: threeItems })).toEqual({
        ok: false,
        error: { code: "invalid_credential" },
      })
    }
  })
})

describe("Wishlist privacy", () => {
  test("a Participant's view never includes another Participant's Wishlist", async () => {
    const { accessCode, personalToken } = await participant()
    const ben = await joined(accessCode, "Ben")
    await updateParticipant(ben.personalToken, {
      wishlist: [
        { name: "Zebra telescope", description: "Zebra description", productLink: "https://zebra.example.com" },
        { name: "Zebra book" },
        { name: "Zebra mug" },
      ],
    })

    const view = await participantView(personalToken)

    expect(view.ok).toBe(true)
    expect(JSON.stringify(view)).not.toMatch(/Zebra|zebra\.example/)
  })

  test("the Host dashboard shows Ready status but no Wishlist contents", async () => {
    const { personalToken, hostToken } = await participant()
    await updateParticipant(personalToken, {
      wishlist: [{ name: "Zebra telescope" }, { name: "Zebra book" }, { name: "Zebra mug" }],
    })

    const view = await hostView(hostToken)

    expect(view).toMatchObject({ value: { participants: [{ ready: true }] } })
    expect(JSON.stringify(view)).not.toMatch(/Zebra/)
  })
})
