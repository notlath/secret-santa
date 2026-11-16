import { expect, test, type Browser, type Page } from "@playwright/test"
import { createExchange } from "./helpers"

async function hostWithDashboard(page: Page) {
  const created = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  await expect(page).toHaveURL(/\/e\/[0-9a-f-]{36}\/host$/)
  return created
}

async function joinAndOpenMyPage(browser: Browser, accessCode: string, displayName: string) {
  const device = await browser.newContext()
  const page = await device.newPage()
  await page.goto(`/join/${accessCode}`)
  await page.getByLabel("Display name").fill(displayName)
  await page.getByRole("button", { name: "Join" }).click()
  await page.getByRole("link", { name: "Go to my page" }).click()
  await expect(page).toHaveURL(/\/e\/[0-9a-f-]{36}$/)
  return { device, page }
}

function item(page: Page, position: number) {
  return page.getByRole("group", { name: `Item ${position}` })
}

test("a Participant fills in a Wishlist, sees they're Ready, and the Host's meter follows", async ({ page, browser }) => {
  const { accessCode } = await hostWithDashboard(page)
  const { device, page: ben } = await joinAndOpenMyPage(browser, accessCode, "Ben")

  await expect(ben.getByRole("heading", { name: "Not Ready yet" })).toBeVisible()
  await item(ben, 1).getByLabel("Name").fill("Wool socks")
  await item(ben, 1).getByLabel("Description").fill("Size 42, anything but beige")
  await ben.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(ben.getByRole("status").filter({ hasText: "Wishlist saved." })).toBeVisible()
  await expect(ben.getByText("Add 2 more Wishlist Items")).toBeVisible()

  await page.reload()
  const meter = page.getByRole("meter", { name: "Wishlists ready" })
  await expect(meter).toContainText("0 of 1 ready")
  await expect(page.getByRole("list", { name: "Participants" }).getByRole("listitem")).toHaveText([/^Ben\s*Not ready/])

  await item(ben, 2).getByLabel("Name").fill("A crime novel")
  await item(ben, 3).getByLabel("Name").fill("Hot chocolate")
  await item(ben, 3).getByLabel("Product link").fill("example.com/cocoa")
  await ben.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(item(ben, 3).getByRole("textbox", { name: "Product link" })).toHaveAccessibleDescription(
    /starting with https:\/\//,
  )
  await item(ben, 3).getByLabel("Product link").fill("https://example.com/cocoa")
  await ben.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(ben.getByRole("heading", { name: "You're Ready" })).toBeVisible()

  await ben.reload()
  await expect(ben.getByRole("heading", { name: "You're Ready" })).toBeVisible()
  await expect(item(ben, 1).getByLabel("Description")).toHaveValue("Size 42, anything but beige")
  await expect(item(ben, 3).getByLabel("Product link")).toHaveValue("https://example.com/cocoa")

  await page.reload()
  await expect(meter).toContainText("1 of 1 ready")
  await expect(page.getByRole("list", { name: "Participants" }).getByRole("listitem")).toHaveText([/^Ben\s*✓ Ready/])
  await device.close()
})

test("a Participant changes their display name, and a taken name is refused", async ({ page, browser }) => {
  const { accessCode } = await hostWithDashboard(page)
  const ana = await joinAndOpenMyPage(browser, accessCode, "Ana")
  const { device, page: ben } = await joinAndOpenMyPage(browser, accessCode, "Ben")

  const name = ben.getByRole("textbox", { name: "Display name" })
  await name.fill(" ana ")
  await ben.getByRole("button", { name: "Save name" }).click()
  await expect(name).toHaveAccessibleDescription(/Someone already has that name/)

  await name.fill("Benji")
  await ben.getByRole("button", { name: "Save name" }).click()
  await expect(ben.getByText("You're in as Benji")).toBeVisible()

  await page.reload()
  await expect(page.getByRole("list", { name: "Participants" }).getByRole("listitem")).toHaveText([/Ana/, /Benji/])
  await ana.device.close()
  await device.close()
})
