import { expect, test } from "@playwright/test"
import { createExchange } from "./helpers"

test("Host closes registration, refuses a waiting join, and reopens for a late friend", async ({ page, browser }) => {
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  const draw = page.getByRole("button", { name: "Start Draw", exact: true })
  await expect(draw).toBeDisabled()
  await expect(draw).toHaveAccessibleDescription(/Close registration[\s\S]*At least 3 Participants/)

  const device = await browser.newContext()
  const friend = await device.newPage()
  try {
    await friend.goto(`/join/${accessCode}`)
    await friend.getByLabel("Display name").fill("Ben")
    const close = page.getByRole("button", { name: "Close registration", exact: true })
    await close.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("button", { name: "Reopen registration", exact: true })).toBeVisible()
    await expect(page.getByRole("region", { name: "Registration and Draw" }).getByRole("status")).toHaveText("Registration is closed. Wishlists can still be edited.")
    await expect(draw).toHaveAccessibleDescription(/At least 3 Participants/)
    await expect(draw).not.toHaveAccessibleDescription(/Close registration/)
    await friend.getByRole("button", { name: "Join", exact: true }).click()
    await expect(friend.getByText(/Registration for this Exchange is closed/)).toBeVisible()
    await friend.reload()
    await expect(friend.getByText(/Registration for this Exchange is closed/)).toBeVisible()
    await expect(friend.getByRole("button", { name: "Join", exact: true })).toHaveCount(0)

    await page.getByRole("button", { name: "Reopen registration", exact: true }).click()
    await expect(page.getByRole("button", { name: "Close registration", exact: true })).toBeVisible()
    await friend.reload()
    await friend.getByLabel("Display name").fill("Ben")
    await friend.getByRole("button", { name: "Join", exact: true }).click()
    await expect(friend.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
    await page.reload()
    await expect(draw).toHaveAccessibleDescription(/Not Ready: Ben/)
  } finally {
    await device.close()
  }
})

test("Draw blockers name only Participants who aren't Ready and clear when all conditions are met", async ({ page, browser }, testInfo) => {
  test.setTimeout(60_000)
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  const devices = []
  try {
    for (const name of ["Ana", "Ben", "Cara"]) {
      const device = await browser.newContext()
      devices.push(device)
      const friend = await device.newPage()
      await friend.goto(`/join/${accessCode}`)
      await friend.getByLabel("Display name").fill(name)
      await friend.getByRole("button", { name: "Join", exact: true }).click()
      await friend.getByRole("link", { name: "Go to my page" }).click()
      if (name !== "Ben") {
        for (const position of [1, 2, 3]) {
          await friend.getByRole("group", { name: `Item ${position}` }).getByLabel("Name").fill(`Gift ${position}`)
        }
        await friend.getByRole("button", { name: "Save Wishlist" }).click()
        await expect(friend.getByRole("heading", { name: "You're Ready" })).toBeVisible()
      }
    }
    await page.reload()
    const draw = page.getByRole("button", { name: "Start Draw", exact: true })
    await expect(draw).toHaveAccessibleDescription("Close registration before starting the Draw. Not Ready: Ben.")
    await page.getByRole("button", { name: "Close registration", exact: true }).click()
    await expect(draw).toHaveAccessibleDescription("Not Ready: Ben.")

    const ben = devices[1].pages()[0]
    await ben.reload()
    for (const position of [1, 2, 3]) {
      await ben.getByRole("group", { name: `Item ${position}` }).getByLabel("Name").fill(`Gift ${position}`)
    }
    await ben.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(ben.getByRole("heading", { name: "You're Ready" })).toBeVisible()
    await page.reload()
    await expect(draw).toHaveAccessibleDescription("Everyone is Ready. Starting the Draw is coming soon.")
    await expect(draw).toBeDisabled()
    await draw.focus()
    await expect(draw).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("button", { name: "Reopen registration", exact: true })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("registration-ready.png"), fullPage: true })
  } finally {
    await Promise.all(devices.map((device) => device.close()))
  }
})
