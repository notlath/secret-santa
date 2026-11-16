import { expect, type Page } from "@playwright/test"

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
