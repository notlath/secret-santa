import type { Browser, Page } from "@playwright/test"
import { expect, holdActions, loseNextActionResponse, test } from "./fixtures"
import { joinFromNewDevice, openDashboard } from "./helpers"

async function dashboardWithBen(page: Page, browser: Browser) {
  const ben = await joinFromNewDevice(browser, await openDashboard(page), "Ben")
  await page.reload()
  await page.waitForLoadState("networkidle")
  return ben.context
}

test("a button shows it is working while its action runs", async ({ page, browser }, testInfo) => {
  const device = await dashboardWithBen(page, browser)
  try {
    const release = await holdActions(page)
    const close = page.getByRole("button", { name: "Close registration", exact: true })
    await close.click()
    await expect(close).toHaveAttribute("data-pending", "")
    const spinnerWidth = () => close.evaluate((element) => parseFloat(getComputedStyle(element, "::before").width) || 0)
    await expect.poll(spinnerWidth).toBeGreaterThan(8)
    await expect(close).toHaveCSS("cursor", "progress")
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
