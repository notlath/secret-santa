import { describe, expect, test } from "vitest"
import { deviceExchanges } from "."
import { created, joined } from "./test-helpers"

describe("deviceExchanges", () => {
  test("lists each Exchange with a valid link once, with the roles this device holds, and nothing else", async () => {
    const office = await created({ name: "Office Secret Santa" })
    const family = await created({ name: "Family Swap" })
    const hostAsParticipant = await joined(office.accessCode, "Mia")
    const familyMember = await joined(family.accessCode, "Ben")

    const result = await deviceExchanges([
      { exchangeId: office.exchange.id, role: "host", token: office.hostToken },
      { exchangeId: office.exchange.id, role: "participant", token: hostAsParticipant.personalToken },
      { exchangeId: family.exchange.id, role: "participant", token: familyMember.personalToken },
    ])

    expect(result).toHaveLength(2)
    expect(result).toEqual(
      expect.arrayContaining([
        { id: office.exchange.id, name: "Office Secret Santa", roles: ["host", "participant"] },
        { id: family.exchange.id, name: "Family Swap", roles: ["participant"] },
      ]),
    )
  })

  test("leaves out invalid tokens, tokens for another role, and tokens stored under another Exchange", async () => {
    const office = await created({ name: "Office Secret Santa" })
    const family = await created({ name: "Family Swap" })
    const mia = await joined(office.accessCode, "Mia")

    const result = await deviceExchanges([
      { exchangeId: office.exchange.id, role: "host", token: "not-a-real-token" },
      { exchangeId: office.exchange.id, role: "host", token: mia.personalToken },
      { exchangeId: office.exchange.id, role: "participant", token: office.hostToken },
      { exchangeId: family.exchange.id, role: "host", token: office.hostToken },
      { exchangeId: family.exchange.id, role: "participant", token: mia.personalToken },
      { exchangeId: "not-a-uuid", role: "host", token: family.hostToken },
    ])

    expect(result).toEqual([])
  })

  test("returns nothing for a device without links", async () => {
    expect(await deviceExchanges([])).toEqual([])
  })
})
