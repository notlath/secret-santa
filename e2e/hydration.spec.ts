import { expect, expectNativeDisabled, test } from "./fixtures"
import { createExchange } from "./helpers"

for (const action of ["join", "copy"] as const) {
  test(`${action} waits for hydration before accepting input`, async ({ page, delayedPage }) => {
    const { accessCode, hostLink } = await createExchange(page)
    const slow = delayedPage.page
    await slow.goto(action === "join" ? `/join/${accessCode}` : hostLink, { waitUntil: "commit" })
    const button = slow.getByRole("button", { name: action === "join" ? "Join" : "Copy join link", exact: true })
    await expect(button).toBeVisible()
    await expectNativeDisabled(button)
    if (action === "join") await expectNativeDisabled(slow.getByLabel("Display name"))
    delayedPage.release()
    await expect(button).toBeEnabled()
    if (action === "join") {
      await slow.getByLabel("Display name").fill("Ben")
      await button.click()
      await expect(slow.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
    } else {
      await slow.context().grantPermissions(["clipboard-read", "clipboard-write"])
      await button.click()
      await expect(slow.getByRole("region", { name: "Invite your friends" }).getByRole("status")).toContainText("Copied")
    }
  })
}
