import { expect, test } from "@playwright/test"
import { createExchange } from "./helpers"

test("the Host joins as a Participant too, switches roles, and finds the Exchange on the landing page", async ({
  page,
  browser,
  context,
}) => {
  const { accessCode, hostLink } = await createExchange(page)
  await expect(page.getByRole("heading", { name: "Join as a Participant too" })).toBeHidden()
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()

  await expect(page.getByRole("heading", { name: "Join as a Participant too" })).toBeVisible()
  await page.getByLabel("Display name").fill("Mia")
  await page.getByRole("button", { name: "Join" }).click()
  await expect(page.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
  const personalLink = await page.getByRole("textbox", { name: "Personal Link" }).inputValue()
  expect(personalLink).toMatch(/\/p\/[A-Za-z0-9_-]{22,}$/)
  expect(personalLink.split("/p/")[1]).not.toBe(hostLink.split("/h/")[1])

  await page.getByRole("link", { name: "Go to my page" }).click()
  await expect(page).toHaveURL(/\/e\/[0-9a-f-]{36}$/)
  await expect(page.getByText("You're in as Mia")).toBeVisible()
  const switcher = page.getByRole("navigation", { name: "Switch role" })
  await expect(switcher.getByRole("link", { name: "My exchange" })).toHaveAttribute("aria-current", "page")

  await switcher.getByRole("link", { name: "Host dashboard" }).click()
  await expect(page).toHaveURL(/\/e\/[0-9a-f-]{36}\/host$/)
  await expect(page.getByRole("list", { name: "Participants" }).getByRole("listitem")).toHaveText(["Mia"])
  await expect(switcher.getByRole("link", { name: "Host dashboard" })).toHaveAttribute("aria-current", "page")
  await switcher.getByRole("link", { name: "My exchange" }).click()
  await expect(page.getByText("You're in as Mia")).toBeVisible()

  const exchangeId = page.url().match(/\/e\/([^/]+)$/)![1]
  await context.addCookies([
    { name: "gx_host_00000000-0000-0000-0000-000000000000", value: "stale", url: page.url() },
    { name: "gx_p_00000000-0000-0000-0000-000000000001", value: personalLink.split("/p/")[1], url: page.url() },
  ])
  await page.goto("/")
  const remembered = page.getByRole("list", { name: "Your exchanges on this device" })
  await expect(remembered.getByRole("listitem")).toHaveCount(1)
  const entry = remembered.getByRole("listitem").filter({ hasText: "Office Secret Santa" })
  await expect(entry).toContainText("Host and Participant")
  await entry.getByRole("link", { name: "Host dashboard" }).click()
  await expect(page).toHaveURL(new RegExp(`/e/${exchangeId}/host$`))

  const friend = await browser.newContext()
  const other = await friend.newPage()
  await other.goto(`/join/${accessCode}`)
  await other.getByLabel("Display name").fill("Ben")
  await other.getByRole("button", { name: "Join" }).click()
  await other.getByRole("link", { name: "Go to my page" }).click()
  await expect(other.getByText("You're in as Ben")).toBeVisible()
  await expect(other.getByRole("navigation", { name: "Switch role" })).toBeHidden()
  await other.goto("/")
  await expect(
    other.getByRole("list", { name: "Your exchanges on this device" }).getByRole("listitem"),
  ).toHaveText([/Office Secret Santa.*Participant/])
  await friend.close()
})

test("the landing page doesn't show the device list when nothing is remembered", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: "Create an Exchange" })).toBeVisible()
  await expect(page.getByText("Your exchanges on this device")).toBeHidden()
})
