import { expect, test } from "@playwright/test"
import { drawnExchange } from "./helpers"

test("Host completes the Exchange and a Participant can still open the reveal", async ({ page, browser }) => {
  test.setTimeout(120_000)
  const people = await drawnExchange(page, browser)
  try {
    const finish = page.getByRole("region", { name: "Finish" })
    await finish.getByRole("button", { name: "Mark completed", exact: true }).click()
    await page.getByRole("alertdialog", { name: "Mark this Exchange completed?" }).getByRole("button", { name: "Mark completed" }).click()
    await expect(page.getByRole("alertdialog")).toHaveCount(0)
    await expect(finish.getByRole("button", { name: "Mark completed" })).toHaveCount(0)
    await expect(finish.getByRole("button", { name: "Delete Exchange" })).toBeVisible()
    await expect(page.getByRole("list", { name: "Participants" }).getByRole("button")).toHaveCount(0)
    await expect(page.getByRole("region", { name: "Event Details" }).getByRole("button", { name: /Edit/ })).toHaveCount(0)

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
    const hostUrl = page.url()
    await page.getByRole("region", { name: "Finish" }).getByRole("button", { name: "Delete Exchange" }).click()
    await page.getByRole("alertdialog", { name: "Delete this Exchange?" }).getByRole("button", { name: "Delete everything" }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.goto(hostUrl)
    await expect(page.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
    for (const person of people) {
      await person.page.reload()
      await expect(person.page.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
    }
  } finally {
    await Promise.all(people.map((person) => person.context.close()))
  }
})
