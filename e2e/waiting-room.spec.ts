import { expect, test, type Browser } from "@playwright/test"
import { createExchange } from "./helpers"

async function join(browser: Browser, code: string, name: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/join/${code}`)
  await page.getByLabel("Display name").fill(name)
  await page.getByRole("button", { name: "Join" }).click()
  await page.getByRole("link", { name: "Go to my page" }).click()
  return { context, page }
}

test("waiting room and Host dashboard update as Participants join", async ({ page, browser }) => {
  test.setTimeout(90000)
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  const mia = await join(browser, accessCode, "Mia")
  await expect(mia.page.getByRole("list", { name: "Participants" })).toContainText("Mia")
  await mia.page.getByRole("group", { name: "Item 1" }).getByLabel("Name").fill("Unfinished draft")
  await mia.page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  let hiddenPolls = 0
  mia.page.on("request", (request) => {
    if (request.url().includes("/view/participant")) hiddenPolls++
  })
  const ben = await join(browser, accessCode, "Ben")
  await mia.page.waitForTimeout(11000)
  expect(hiddenPolls).toBe(0)
  await expect(mia.page.getByRole("list", { name: "Participants" })).not.toContainText("Ben")
  await mia.page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await expect(mia.page.getByRole("list", { name: "Participants" })).toContainText("Ben", { timeout: 20000 })
  await expect(page.getByRole("list", { name: "Participants" })).toContainText("Ben", { timeout: 20000 })
  await expect(mia.page.getByRole("group", { name: "Item 1" }).getByLabel("Name")).toHaveValue("Unfinished draft")
  for (const [index, name] of ["Book", "Tea", "Socks"].entries()) {
    await ben.page.getByRole("group", { name: `Item ${index + 1}` }).getByLabel("Name").fill(name)
  }
  await ben.page.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(mia.page.getByRole("list", { name: "Participants" }).getByRole("listitem").filter({ hasText: "Ben" })).toContainText("Ready", { timeout: 20000 })
  await expect(mia.page.getByText("Book", { exact: true })).toHaveCount(0)
  const viewUrl = `${new URL(mia.page.url()).pathname}/view`
  const personalView = await mia.page.request.get(`${viewUrl}/participant`)
  expect(personalView.ok()).toBe(true)
  expect(await personalView.text()).not.toContain("Book")
  expect((await mia.page.request.get(`${viewUrl}/host`)).status()).toBe(404)
  const cal = await join(browser, accessCode, "Cal")
  await expect(mia.page.getByRole("list", { name: "Participants" })).toContainText("Cal", { timeout: 20000 })
  await cal.context.close()
  await mia.context.close()
  await ben.context.close()
})
