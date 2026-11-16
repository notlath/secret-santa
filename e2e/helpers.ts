import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test"

export async function createExchange(page: Page) {
  await page.goto("/")
  await page.getByRole("link", { name: "Create an Exchange" }).click()
  await expect(page).toHaveURL(/\/new$/)

  await page.getByLabel("Exchange name").fill("Office Secret Santa")
  const max = page.getByRole("textbox", { name: "Maximum Participants" })
  await max.fill("12")
  await page.getByRole("group", { name: "Date" }).getByRole("spinbutton").first().click()
  await page.keyboard.type("12182026")
  await page.getByRole("group", { name: "Time" }).getByRole("spinbutton").first().click()
  await page.keyboard.type("0730P")
  await page.getByLabel("Location").fill("Mia's flat")
  await page.getByRole("textbox", { name: "Budget" }).fill("25.5")
  await expect(page.getByRole("combobox", { name: "Currency" })).toContainText("USD")
  await page.getByLabel("Instructions").fill("No gift cards")

  await page.getByRole("button", { name: "Create Exchange" }).click()

  await expect(page.getByRole("heading", { name: "Save your Host Link" })).toBeVisible()
  const accessCode = (await page.getByTestId("access-code").innerText()).trim()
  expect(accessCode).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)
  const hostLink = await page.getByRole("textbox", { name: "Host Link" }).inputValue()
  expect(hostLink).toMatch(/\/h\/[A-Za-z0-9_-]{22,}$/)
  return { accessCode, hostLink }
}

export async function openDashboard(page: Page) {
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  return accessCode
}

// Each Participant joins in their own browser context, standing in for their own device; the caller closes it.
export async function joinFromNewDevice(browser: Browser, accessCode: string, name: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/join/${accessCode}`)
  await page.getByLabel("Display name").fill(name)
  await page.getByRole("button", { name: "Join", exact: true }).click()
  const personalLink = await page.getByRole("textbox", { name: "Personal Link" }).inputValue()
  return { name, page, context, personalLink }
}

export async function fillWishlist(page: Page, name: string) {
  // Submitting before hydration falls back to a native GET, so let scripts finish first.
  await page.waitForLoadState("networkidle")
  for (const position of [1, 2, 3]) {
    await page.getByRole("group", { name: `Item ${position}` }).getByLabel("Name", { exact: true }).fill(`${name}'s gift ${position}`)
  }
  await page.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(page.getByRole("heading", { name: "You're Ready" })).toBeVisible()
}

// Creates an Exchange, has three Participants join with full Wishlists, then closes registration and draws.
// The Host stays on `page`; each Participant keeps their own browser context, which the caller must close.
export async function drawnExchange(page: Page, browser: Browser) {
  const accessCode = await openDashboard(page)
  const people: { name: string; page: Page; context: BrowserContext }[] = []
  for (const name of ["Ana", "Ben", "Cara"]) {
    const person = await joinFromNewDevice(browser, accessCode, name)
    people.push(person)
    await person.page.getByRole("link", { name: "Go to my page" }).click()
    await fillWishlist(person.page, name)
  }
  await page.reload()
  await page.getByRole("button", { name: "Close registration", exact: true }).click()
  await page.getByRole("button", { name: "Start Draw", exact: true }).click()
  await page.getByRole("button", { name: "Draw now" }).click()
  await expect(page.getByRole("region", { name: "Reveals" })).toBeVisible()
  return people
}
