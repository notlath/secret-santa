import { expect, test, type Browser, type Page } from "@playwright/test"
import { createExchange } from "./helpers"

async function hostWithDashboard(page: Page) {
  const created = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  await expect(page).toHaveURL(/\/e\/[0-9a-f-]{36}\/host$/)
  return created
}

async function joinFromNewDevice(browser: Browser, accessCode: string, displayName: string) {
  const device = await browser.newContext()
  const page = await device.newPage()
  await page.goto(`/join/${accessCode}`)
  await page.getByLabel("Display name").fill(displayName)
  await page.getByRole("button", { name: "Join" }).click()
  await expect(page.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
  const personalLink = await page.getByRole("textbox", { name: "Personal Link" }).inputValue()
  return { device, page, personalLink }
}

test("a friend joins with the Access Code and the Host sees them", async ({ page, browser }) => {
  const { accessCode } = await hostWithDashboard(page)
  await expect(page.getByText("Nobody has joined yet.")).toBeVisible()

  const friend = await browser.newContext()
  const other = await friend.newPage()
  await other.goto("/")
  await other.getByRole("link", { name: "Join an Exchange" }).click()
  await expect(other).toHaveURL(/\/join$/)
  await other.getByLabel("Access Code").fill(accessCode.replace("-", "").toLowerCase())
  await other.getByRole("button", { name: "Find Exchange" }).click()

  await expect(other.getByRole("heading", { level: 1 })).toHaveText("Office Secret Santa")
  await expect(other.getByText("Friday, December 18, 2026")).toBeVisible()
  await expect(other.getByText("Mia's flat")).toBeVisible()
  await expect(other.getByText("$25.50")).toBeVisible()

  await other.getByLabel("Display name").fill("Ben")
  await other.getByRole("button", { name: "Join" }).click()

  await expect(other.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
  const personalLink = await other.getByRole("textbox", { name: "Personal Link" }).inputValue()
  expect(personalLink).toMatch(/\/p\/[A-Za-z0-9_-]{22,}$/)
  await friend.grantPermissions(["clipboard-read", "clipboard-write"])
  await other.getByRole("button", { name: "Copy Personal Link" }).click()
  await expect(other.getByRole("status")).toContainText("Copied")
  expect(await other.evaluate(() => navigator.clipboard.readText())).toBe(personalLink)

  await other.getByRole("link", { name: "Go to my page" }).click()
  await expect(other).toHaveURL(/\/e\/[0-9a-f-]{36}$/)
  await expect(other.getByRole("heading", { level: 1 })).toHaveText("Office Secret Santa")
  await expect(other.getByText("Mia's flat")).toBeVisible()
  await expect(other.getByText("You're in as Ben")).toBeVisible()
  await other.getByRole("button", { name: "Copy my personal link" }).click()
  expect(await other.evaluate(() => navigator.clipboard.readText())).toBe(personalLink)

  await page.reload()
  await expect(page.getByRole("list", { name: "Participants" }).getByRole("listitem")).toHaveText([/^Ben\s*Not ready$/])
  await friend.close()
})

test("a join link fills in the code, and a taken name is refused", async ({ page, browser }) => {
  const { accessCode } = await hostWithDashboard(page)
  const { device } = await joinFromNewDevice(browser, accessCode, "Ben")
  await device.close()

  const second = await browser.newContext()
  const other = await second.newPage()
  await other.goto(`/join/${accessCode.toLowerCase()}`)
  await other.getByLabel("Display name").fill("  BEN ")
  await other.getByRole("button", { name: "Join" }).click()
  await expect(other.getByRole("textbox", { name: "Display name" })).toHaveAccessibleDescription(
    /Someone already has that name/,
  )
  await other.getByLabel("Display name").fill("Ana")
  await other.getByRole("button", { name: "Join" }).click()
  await expect(other.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
  await second.close()
})

test("an unknown Access Code shows a clear message", async ({ page }) => {
  await page.goto("/join")
  await page.getByLabel("Access Code").fill("AAAA-AAAA")
  await page.getByRole("button", { name: "Find Exchange" }).click()
  await expect(page.getByText("There's no Exchange with that code")).toBeVisible()
  await expect(page.getByLabel("Access Code")).toHaveValue("AAAA-AAAA")
})

test("the Personal Link signs the Participant in on another device, but not as Host", async ({ page, browser }) => {
  const { accessCode } = await hostWithDashboard(page)
  const hostDashboard = page.url()
  const { device, personalLink } = await joinFromNewDevice(browser, accessCode, "Ben")
  await device.close()

  const phone = await browser.newContext()
  const other = await phone.newPage()
  await other.goto(personalLink)
  await expect(other).toHaveURL(/\/e\/[0-9a-f-]{36}$/)
  await expect(other.getByText("You're in as Ben")).toBeVisible()
  const exchangeId = other.url().match(/\/e\/([^/]+)$/)![1]
  expect(await phone.cookies()).toEqual([
    expect.objectContaining({
      name: `gx_p_${exchangeId}`,
      value: personalLink.split("/p/")[1],
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    }),
  ])

  await other.goto(hostDashboard)
  await expect(other.getByRole("heading", { name: "You need the Host Link" })).toBeVisible()

  await other.goto(personalLink.replace(/\/p\/.+$/, "/p/not-a-real-token"))
  await expect(other.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
  await phone.close()
})

test("the Participant page refuses a device without the Personal Link", async ({ page, browser }) => {
  const { accessCode } = await hostWithDashboard(page)
  const { device, page: joinedPage } = await joinFromNewDevice(browser, accessCode, "Ben")
  await joinedPage.getByRole("link", { name: "Go to my page" }).click()
  await expect(joinedPage).toHaveURL(/\/e\/[0-9a-f-]{36}$/)
  const participantPage = joinedPage.url()
  await device.close()

  await page.goto(participantPage)
  await expect(page.getByRole("heading", { name: "You need your Personal Link" })).toBeVisible()
})
