import { expect, test, type Browser, type Page } from "@playwright/test"
import { auditPage } from "./a11y"
import { openDashboard } from "./helpers"

async function joinAndArrive(browser: Browser, accessCode: string, name: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/join/${accessCode}`)
  await page.getByLabel("Display name").fill(name)
  await page.getByRole("button", { name: "Join", exact: true }).click()
  await page.getByRole("link", { name: "Go to my page" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  return { context, page }
}

async function fillItems(page: Page) {
  for (const position of [1, 2, 3]) {
    await page.getByRole("group", { name: `Item ${position}` }).getByLabel("Name", { exact: true }).fill(`Gift ${position}`)
  }
}

const heading = (page: Page) => page.getByRole("heading", { level: 1 })

test("the heading rises on the first arrival after joining and not after a reload", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")

  await expect(heading(ben)).toHaveAttribute("data-rise")
  await expect(ben).not.toHaveURL(/joined/)
  await auditPage(ben)

  await ben.reload()
  await expect(heading(ben)).toBeVisible()
  await expect(heading(ben)).not.toHaveAttribute("data-rise")
  await context.close()
})

test("opening the personal link later shows no entrance", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  const token = (await context.cookies()).find((cookie) => cookie.value.length >= 22 && /^[A-Za-z0-9_-]+$/.test(cookie.value))!.value
  await ben.goto(`/p/${token}`)
  await expect(heading(ben)).toBeVisible()
  await expect(heading(ben)).not.toHaveAttribute("data-rise")
  await context.close()
})

test("completing the Wishlist with a pointer pops the Ready badge and says you're all set", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  await expect(ben.getByText("You're all set")).toHaveCount(0)

  await fillItems(ben)
  await ben.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(ben.getByText("You're all set")).toBeVisible()
  await expect(ben.locator("[data-pop]")).toBeVisible()
  await context.close()
})

test("completing the Wishlist from the keyboard says you're all set without the pop", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")

  await fillItems(ben)
  await ben.getByRole("button", { name: "Save Wishlist" }).focus()
  await ben.keyboard.press("Enter")
  await expect(ben.getByText("You're all set")).toBeVisible()
  await expect(ben.locator("[data-pop]")).toHaveCount(0)
  await context.close()
})

test("a Participant who is already Ready on load sees the message and no pop", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  await fillItems(ben)
  await ben.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(ben.getByText("You're all set")).toBeVisible()

  await ben.reload()
  await expect(ben.getByText("You're all set")).toBeVisible()
  await expect(ben.locator("[data-pop]")).toHaveCount(0)
  await context.close()
})
