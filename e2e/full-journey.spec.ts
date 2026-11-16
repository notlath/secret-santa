import type { BrowserContext, Page } from "@playwright/test"
import { expect, test } from "./fixtures"
import { createExchange, fillWishlist, joinFromNewDevice } from "./helpers"

type Person = { name: string; page: Page; personalLink: string }

test("the whole Exchange, from creating it to every reveal, across separate devices", async ({ page, browser }) => {
  test.setTimeout(180_000)
  const contexts: BrowserContext[] = []
  try {
    const { accessCode } = await createExchange(page)
    await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
    await page.getByLabel("Display name").fill("Mia")
    await page.getByRole("button", { name: "Join", exact: true }).click()
    const hostPersonalLink = await page.getByRole("textbox", { name: "Personal Link" }).inputValue()
    await page.getByRole("link", { name: "Go to my page" }).click()
    await expect(page.getByText("You're in as Mia")).toBeVisible()
    await fillWishlist(page, "Mia")
    const exchangeUrl = page.url()
    const people: Person[] = [{ name: "Mia", page, personalLink: hostPersonalLink }]

    for (const name of ["Ana", "Ben", "Cara"]) {
      const person = await joinFromNewDevice(browser, accessCode, name)
      contexts.push(person.context)
      await person.page.getByRole("link", { name: "Go to my page" }).click()
      await expect(person.page).toHaveURL(exchangeUrl)
      await fillWishlist(person.page, name)
      people.push(person)
    }

    await page.getByRole("navigation", { name: "Switch role" }).getByRole("link", { name: "Host dashboard" }).click()
    await expect(page).toHaveURL(`${exchangeUrl}/host`)
    const hostUrl = page.url()
    await expect(page.getByRole("meter", { name: "Wishlists ready" })).toHaveAttribute("aria-valuetext", "4 of 4 ready")
    await page.getByRole("button", { name: "Close registration", exact: true }).click()
    await page.getByRole("button", { name: "Start Draw", exact: true }).click()
    await page.getByRole("alertdialog", { name: "Draw for 4 participants?" }).getByRole("button", { name: "Draw now" }).click()
    const reveals = page.getByRole("region", { name: "Reveals" })
    await expect(reveals.getByText("0 of 4 have seen their Recipient")).toBeVisible()

    const recipients: string[] = []
    for (const person of people) {
      await person.page.goto(exchangeUrl)
      await person.page.getByRole("link", { name: "Reveal my Recipient" }).click()
      await person.page.getByRole("button", { name: "Open my gift box" }).click()
      const recipient = person.page.getByTestId("recipient-name")
      await expect(recipient).toBeVisible()
      const name = await recipient.innerText()
      expect(name).not.toBe(person.name)
      await expect(person.page.getByText(`${name}'s gift 1`)).toBeVisible()
      await person.page.reload()
      await expect(person.page.getByTestId("recipient-name")).toHaveText(name)
      recipients.push(name)
    }
    expect(new Set(recipients)).toEqual(new Set(people.map((person) => person.name)))
    await page.goto(hostUrl)
    await expect(reveals.getByText("4 of 4 have seen their Recipient")).toBeVisible()

    const fresh = await browser.newContext()
    contexts.push(fresh)
    const returning = await fresh.newPage()
    await returning.goto(people[1].personalLink)
    await expect(returning).toHaveURL(exchangeUrl)
    await expect(returning.getByText("You're in as Ana")).toBeVisible()
    await returning.getByRole("link", { name: "Reveal my Recipient" }).click()
    await expect(returning.getByTestId("recipient-name")).toHaveText(recipients[1])

    await returning.goto(hostUrl)
    await expect(returning.getByRole("heading", { name: "You need the Host Link" })).toBeVisible()
    await expect(returning.getByTestId("access-code")).toHaveCount(0)
    const hostData = await returning.request.get(hostUrl.replace(/\/host$/, "/view/host"))
    expect(hostData.status()).toBe(404)
  } finally {
    await Promise.all(contexts.map((context) => context.close()))
  }
})
