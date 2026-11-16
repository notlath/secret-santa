import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test"
import { createExchange } from "./helpers"

async function drawnExchange(page: Page, browser: Browser) {
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

test("Host completes the Exchange and a Participant can still open the reveal", async ({ page, browser }) => {
  test.setTimeout(120_000)
  const people = await drawnExchange(page, browser)
  try {
    await page.getByRole("button", { name: "Mark completed", exact: true }).click()
    await page.getByRole("alertdialog", { name: "Mark this Exchange completed?" }).getByRole("button", { name: "Mark completed" }).click()
    await expect(page.getByRole("button", { name: "Mark completed" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Delete Exchange" })).toBeVisible()

    const ana = people[0].page
    await ana.reload()
    await ana.getByRole("link", { name: "Reveal my Recipient" }).click()
    await ana.getByRole("button", { name: "Open my gift box" }).click()
    await expect(ana.getByTestId("recipient-name")).toBeVisible()
  } finally {
    await Promise.all(people.map((person) => person.context.close()))
  }
})

test("Host deletes the Exchange and Participant links show the explanation", async ({ page, browser }) => {
  test.setTimeout(120_000)
  const people = await drawnExchange(page, browser)
  try {
    await page.getByRole("button", { name: "Delete Exchange" }).click()
    await page.getByRole("alertdialog", { name: "Delete this Exchange?" }).getByRole("button", { name: "Delete everything" }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.goto(`/e/${people[0].page.url().match(/\/e\/([^/?#]+)/)![1]}/host`)
    await expect(page.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
    for (const person of people) {
      await person.page.reload()
      await expect(person.page.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
    }
  } finally {
    await Promise.all(people.map((person) => person.context.close()))
  }
})
