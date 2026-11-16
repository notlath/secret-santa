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

// Creates an Exchange, has three Participants join with full Wishlists, then closes registration and draws.
// The Host stays on `page`; each Participant keeps their own browser context, which the caller must close.
export async function drawnExchange(page: Page, browser: Browser) {
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  const people: { name: string; page: Page; context: BrowserContext }[] = []
  for (const name of ["Ana", "Ben", "Cara"]) {
    const context = await browser.newContext()
    const friend = await context.newPage()
    people.push({ name, page: friend, context })
    await friend.goto(`/join/${accessCode}`)
    await friend.getByLabel("Display name").fill(name)
    await friend.getByRole("button", { name: "Join", exact: true }).click()
    await friend.getByRole("link", { name: "Go to my page" }).click()
    for (const position of [1, 2, 3]) {
      await friend.getByRole("group", { name: `Item ${position}` }).getByLabel("Name", { exact: true }).fill(`${name}'s gift ${position}`)
    }
    await friend.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(friend.getByRole("heading", { name: "You're Ready" })).toBeVisible()
  }
  await page.reload()
  await page.getByRole("button", { name: "Close registration", exact: true }).click()
  await page.getByRole("button", { name: "Start Draw", exact: true }).click()
  await page.getByRole("button", { name: "Draw now" }).click()
  await expect(page.getByRole("region", { name: "Reveals" })).toBeVisible()
  return people
}
