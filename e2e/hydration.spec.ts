import { expect, test } from "@playwright/test"
import { createExchange } from "./helpers"

for (const action of ["join", "copy"] as const) {
  test(`${action} waits for hydration before accepting input`, async ({ page, browser }) => {
    const { accessCode, hostLink } = await createExchange(page)
    const device = await browser.newContext()
    const slow = await device.newPage()
    let releaseScripts = () => {}
    const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve })
    await slow.route("**/_next/static/**/*.js*", async (route) => {
      await scriptsReady
      await route.continue()
    })
    try {
      await slow.goto(action === "join" ? `/join/${accessCode}` : hostLink, { waitUntil: "commit" })
      const button = slow.getByRole("button", { name: action === "join" ? "Join" : "Copy join link", exact: true })
      await expect(button).toBeVisible()
      await expect(button).toBeDisabled()
      await expect(button).toHaveAttribute("disabled", "")
      if (action === "join") await expect(slow.getByLabel("Display name")).toBeDisabled()
      releaseScripts()
      await expect(button).toBeEnabled()
      if (action === "join") {
        await slow.getByLabel("Display name").fill("Ben")
        await button.click()
        await expect(slow.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
      } else {
        await device.grantPermissions(["clipboard-read", "clipboard-write"])
        await button.click()
        await expect(slow.getByRole("region", { name: "Invite your friends" }).getByRole("status")).toContainText("Copied")
      }
    } finally {
      releaseScripts()
      await device.close()
    }
  })
}
