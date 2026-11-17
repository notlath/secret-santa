import { auditPage } from "./a11y"
import { expect, test } from "./fixtures"
import { fillWishlist, joinFromNewDevice, openDashboard } from "./helpers"

test("the gift-box card is cat-guarded before the Draw and plain after it, in the same place", async ({ page, browser }) => {
  test.setTimeout(120000)
  const accessCode = await openDashboard(page)
  const people = []
  for (const name of ["Ana", "Ben", "Cara"]) {
    const person = await joinFromNewDevice(browser, accessCode, name)
    people.push(person)
    await person.page.getByRole("link", { name: "Go to my page" }).click()
    await fillWishlist(person.page, name)
  }
  const ana = people[0].page
  const card = ana.locator("[data-gift-card]")
  const revealLinks = ana.locator('a[href$="/reveal"]')

  await expect(card.getByText("Your gift box opens after the Draw.")).toBeVisible()
  await expect(card.locator("[data-cat]")).toHaveCount(1)
  await expect(card.locator("[data-cat-guard]")).toHaveAttribute("aria-hidden", "true")
  await expect(revealLinks).toHaveCount(0)
  await auditPage(ana)
  const top = () => card.evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY))
  const before = await top()

  await page.reload()
  await page.getByRole("button", { name: "Close registration", exact: true }).click()
  await page.getByRole("button", { name: "Start Draw", exact: true }).click()
  await page.getByRole("button", { name: "Draw now" }).click()
  await expect(page.getByRole("region", { name: "Reveals" })).toBeVisible()

  // Ana's page is still open: LiveRefresh moves it past the Draw.
  await expect(card.getByRole("heading", { name: "Your Recipient is waiting" })).toBeVisible({ timeout: 20000 })
  await expect(card.getByRole("link", { name: "Reveal my Recipient" })).toBeVisible()
  await expect(card.locator("[data-gift-lid]")).toBeVisible()
  await expect(card.locator("[data-cat]")).toHaveCount(0)
  await expect(card.getByText("Your gift box opens after the Draw.")).toHaveCount(0)
  await expect(revealLinks).toHaveCount(1)
  expect(await top()).toBe(before)
  await auditPage(ana)
  for (const person of people) await person.context.close()
})

test("reduced motion: the card shows the plain box with no cat before the Draw", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const ana = await joinFromNewDevice(browser, accessCode, "Ana")
  await ana.page.emulateMedia({ reducedMotion: "reduce" })
  await ana.page.getByRole("link", { name: "Go to my page" }).click()
  const card = ana.page.locator("[data-gift-card]")
  await expect(card.getByText("Your gift box opens after the Draw.")).toBeVisible()
  await expect(card.locator("[data-gift-lid]")).toBeVisible()
  await expect(card.locator("[data-cat]")).toHaveCount(0)
  await ana.context.close()
})
