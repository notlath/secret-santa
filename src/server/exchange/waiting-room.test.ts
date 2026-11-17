import { expect, test } from "vitest"
import { participantView, updateParticipant } from "."
import { created, joined } from "./test-helpers"

test("a Participant sees everyone and their readiness without other Wishlists", async () => {
  const { accessCode } = await created()
  const mia = await joined(accessCode, "Mia")
  const ben = await joined(accessCode, "Ben")
  await updateParticipant(ben.personalToken, { wishlist: [{ name: "Private book" }, { name: "Socks" }, { name: "Tea" }] })
  const view = await participantView(mia.personalToken)
  expect(view.ok).toBe(true)
  if (!view.ok) throw new Error("Participant view failed")
  expect(view.value).toMatchObject({ participants: [
    { displayName: "Mia", ready: false },
    { displayName: "Ben", ready: true },
  ] })
  expect(JSON.stringify(view.value)).not.toContain("Private book")
})
