import type { Page } from "@playwright/test"
import { auditPage } from "./a11y"
import { expect, test } from "./fixtures"
import { drawnExchange, joinFromNewDevice, openDashboard } from "./helpers"

const snow = (page: Page) => page.locator("[data-snowfall]")
const toggle = (page: Page) => page.getByRole("button", { name: /Pause snow|Let it snow/ })

test("the pause choice survives a reload", async ({ page }) => {
  await page.goto("/")
  await expect(snow(page)).toBeAttached()
  await page.getByRole("button", { name: "Pause snow" }).click()
  await expect(page.getByRole("button", { name: "Let it snow" })).toHaveAttribute("aria-pressed", "true")
  await page.reload()
  await expect(page.getByRole("button", { name: "Let it snow" })).toBeVisible()
  await expect(snow(page)).toHaveAttribute("data-paused", "true")
})

test("snow does not block clicks and the festive pages pass the audit", async ({ page, browser }) => {
  test.setTimeout(120_000)
  await page.goto("/")
  await expect(snow(page)).toBeAttached()
  await expect(snow(page)).toHaveAttribute("aria-hidden", "true")
  await auditPage(page)
  await page.getByRole("link", { name: "Create an Exchange" }).click()
  await expect(page).toHaveURL(/\/new$/)

  const accessCode = await openDashboard(page)
  const person = await joinFromNewDevice(browser, accessCode, "Ana")
  try {
    await person.page.getByRole("link", { name: "Go to my page" }).click()
    await expect(snow(person.page)).toBeAttached()
    await auditPage(person.page)
    await person.page.getByRole("group", { name: "Item 1" }).getByLabel("Name", { exact: true }).click()
  } finally {
    await person.context.close()
  }
})

test("the pause choice carries to the Participant page on the same device", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const person = await joinFromNewDevice(browser, accessCode, "Ana")
  try {
    await person.page.goto("/")
    await person.page.getByRole("button", { name: "Pause snow" }).click()
    await person.page.goto("/")
    await person.page.getByRole("link", { name: "My exchange" }).click()
    await expect(person.page.getByRole("button", { name: "Let it snow" })).toBeVisible()
    await expect(snow(person.page)).toHaveAttribute("data-paused", "true")
  } finally {
    await person.context.close()
  }
})

test("with reduced motion there is no snow and no toggle on the landing page, Participant page or reveal", async ({ page, browser }) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await expect(snow(page)).toBeHidden()
  await expect(toggle(page)).toHaveCount(0)

  const people = await drawnExchange(page, browser)
  try {
    const mine = people[0].page
    await mine.emulateMedia({ reducedMotion: "reduce" })
    await mine.reload()
    await expect(mine.getByRole("link", { name: "Reveal my Recipient" })).toBeVisible()
    await expect(snow(mine)).toBeHidden()
    await expect(toggle(mine)).toHaveCount(0)
    await mine.getByRole("link", { name: "Reveal my Recipient" }).click()
    await expect(mine).toHaveURL(/\/reveal$/)
    await expect(snow(mine)).toBeHidden()
    await expect(toggle(mine)).toHaveCount(0)
  } finally {
    for (const person of people) await person.context.close()
  }
})

test("the reveal has snow and the Host dashboard has none", async ({ page, browser }) => {
  test.setTimeout(120_000)
  const people = await drawnExchange(page, browser)
  try {
    await expect(snow(page)).toHaveCount(0)
    const mine = people[0].page
    await mine.reload()
    await mine.getByRole("link", { name: "Reveal my Recipient" }).click()
    await expect(snow(mine)).toBeAttached()
    await auditPage(mine)
  } finally {
    for (const person of people) await person.context.close()
  }
})
