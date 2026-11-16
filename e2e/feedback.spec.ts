import type { Page } from "@playwright/test"
import { expect, loseNextActionResponse, test } from "./fixtures"
import { createExchange } from "./helpers"

async function dashboardWithBen(page: Page, browser: import("@playwright/test").Browser) {
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  const device = await browser.newContext()
  const friend = await device.newPage()
  await friend.goto(`/join/${accessCode}`)
  await friend.getByLabel("Display name").fill("Ben")
  await friend.getByRole("button", { name: "Join" }).click()
  await expect(friend.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
  await page.reload()
  await page.waitForLoadState("networkidle")
  return device
}

test("a button shows it is working while its action runs", async ({ page, browser }, testInfo) => {
  const device = await dashboardWithBen(page, browser)
  try {
    let release = () => {}
    const held = new Promise<void>((resolve) => { release = resolve })
    await page.route(() => true, async (route) => {
      if (route.request().method() === "POST" && route.request().headers()["next-action"]) await held
      await route.continue()
    })
    const close = page.getByRole("button", { name: "Close registration", exact: true })
    await close.click()
    await expect(close).toHaveAttribute("data-pending", "")
    const spinner = await close.evaluate((element) => {
      const before = getComputedStyle(element, "::before")
      return { content: before.content, width: parseFloat(before.width), cursor: getComputedStyle(element).cursor }
    })
    expect(spinner.content).not.toBe("none")
    expect(spinner.width).toBeGreaterThan(8)
    expect(spinner.cursor).toBe("progress")
    await close.screenshot({ path: testInfo.outputPath("pending-button.png") })
    release()
    await expect(page.getByRole("status").filter({ hasText: "Registration is closed." })).toBeVisible()
    await expect(page.getByRole("button", { name: "Reopen registration" })).not.toHaveAttribute("data-pending")
  } finally {
    await device.close()
  }
})

test("a failed removal is announced once, inside its dialog", async ({ page, browser }) => {
  const device = await dashboardWithBen(page, browser)
  try {
    await page.getByRole("button", { name: "Remove Ben" }).click()
    const dialog = page.getByRole("alertdialog", { name: "Remove Ben?" })
    await loseNextActionResponse(page)
    await dialog.getByRole("button", { name: "Remove Participant" }).click()
    const failure = "Couldn't remove this Participant. Please try again."
    await expect(dialog.getByRole("alert")).toHaveText(failure)
    await expect(page.getByText(failure)).toHaveCount(1)
  } finally {
    await device.close()
  }
})
