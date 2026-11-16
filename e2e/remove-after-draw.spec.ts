import { expect, test, type BrowserContext, type Page } from "@playwright/test"
import { createExchange } from "./helpers"

test("Host removes a Participant after the Draw; their Giver sees the new Recipient and why", async ({ page, browser }) => {
  test.setTimeout(120_000)
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  const people: { name: string; page: Page; context: BrowserContext }[] = []
  try {
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
    const tracking = page.getByRole("region", { name: "Reveals" })
    await expect(tracking.getByText("0 of 3 have seen their Recipient")).toBeVisible()

    const recipients = new Map<string, string>()
    for (const person of people) {
      await person.page.reload()
      await person.page.getByRole("link", { name: "Reveal my Recipient" }).click()
      await person.page.getByRole("button", { name: "Open my gift box" }).click()
      recipients.set(person.name, await person.page.getByTestId("recipient-name").innerText())
    }
    await page.reload()
    await expect(tracking.getByText("3 of 3 have seen their Recipient")).toBeVisible()

    const removed = "Cara"
    const giver = people.find((person) => recipients.get(person.name) === removed)!
    const bystander = people.find((person) => person.name !== removed && person !== giver)!
    await expect(page.getByRole("button", { name: /^Re-issue link/ })).toHaveCount(0)
    await page.getByRole("button", { name: `Remove ${removed}` }).click()
    const dialog = page.getByRole("alertdialog", { name: `Remove ${removed}?` })
    await expect(dialog).toContainText("Only 2 left, both will know who has them.")
    await dialog.getByRole("button", { name: "Remove Participant" }).click()
    await expect(page.getByRole("button", { name: `Remove ${removed}` })).toHaveCount(0)
    await expect(tracking.getByText("1 of 2 have seen their Recipient")).toBeVisible()
    await expect(page.getByRole("button", { name: /^Remove / })).toHaveCount(0)

    await giver.page.goto(giver.page.url().replace(/\/e\/([^/]+).*/, "/e/$1/reveal"))
    await expect(giver.page.getByText(`Your Recipient changed because ${removed} left`)).toBeVisible()
    await giver.page.getByRole("button", { name: "Open my gift box" }).click()
    const newRecipient = await giver.page.getByTestId("recipient-name").innerText()
    expect(newRecipient).toBe(recipients.get(removed))
    await bystander.page.goto(bystander.page.url().replace(/\/e\/([^/]+).*/, "/e/$1/reveal"))
    await expect(bystander.page.getByTestId("recipient-name")).toHaveText(recipients.get(bystander.name)!)
    await expect(bystander.page.getByText(/Your Recipient changed/)).toHaveCount(0)

    const gone = people.find((person) => person.name === removed)!
    await gone.page.reload()
    await expect(gone.page.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
  } finally {
    await Promise.all(people.map((person) => person.context.close()))
  }
})
