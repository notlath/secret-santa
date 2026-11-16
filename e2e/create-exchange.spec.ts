import { expect, test, type Page } from "@playwright/test"

async function createExchange(page: Page) {
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

test("a Host creates an Exchange, saves the Host Link and reaches the dashboard", async ({ page }) => {
  const { accessCode } = await createExchange(page)

  const go = page.getByRole("link", { name: "Go to the dashboard" })
  await expect(go).toBeDisabled()
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await go.click()

  await expect(page).toHaveURL(/\/e\/[0-9a-f-]{36}\/host$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Office Secret Santa")
  await expect(page.getByTestId("access-code")).toHaveText(accessCode)
  await expect(page.getByText("Friday, December 18, 2026")).toBeVisible()
  await expect(page.getByText("7:30 PM")).toBeVisible()
  await expect(page.getByText("Mia's flat")).toBeVisible()
  await expect(page.getByText("$25.50")).toBeVisible()
  await expect(page.getByText("No gift cards")).toBeVisible()

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"])
  await page.getByRole("button", { name: "Copy join link" }).click()
  await expect(page.getByRole("status")).toContainText("Copied")
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toMatch(new RegExp(`/join/${accessCode}$`))
})

test("the Host Link opens the dashboard on another device", async ({ page, browser }) => {
  const { hostLink } = await createExchange(page)

  const otherDevice = await browser.newContext()
  const other = await otherDevice.newPage()
  await other.goto(hostLink)
  await expect(other).toHaveURL(/\/e\/[0-9a-f-]{36}\/host$/)
  await expect(other.getByRole("heading", { level: 1 })).toHaveText("Office Secret Santa")
  const exchangeId = other.url().match(/\/e\/([^/]+)\/host$/)![1]
  expect(await otherDevice.cookies()).toEqual([
    expect.objectContaining({
      name: `gx_host_${exchangeId}`,
      value: hostLink.split("/h/")[1],
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    }),
  ])
  await otherDevice.close()
})

test("the dashboard refuses a device without the Host Link", async ({ page, browser }) => {
  const { hostLink } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  await expect(page).toHaveURL(/\/host$/)
  const dashboard = page.url()

  const otherDevice = await browser.newContext()
  const other = await otherDevice.newPage()
  await other.goto(dashboard)
  await expect(other.getByText("Office Secret Santa")).toHaveCount(0)
  await expect(other.getByRole("heading", { name: "You need the Host Link" })).toBeVisible()

  await other.goto(hostLink.replace(/\/h\/.+$/, "/h/not-a-real-token"))
  await expect(other.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
  await otherDevice.close()
})
