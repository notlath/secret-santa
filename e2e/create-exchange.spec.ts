import { expect, test } from "@playwright/test"
import { createExchange } from "./helpers"

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
