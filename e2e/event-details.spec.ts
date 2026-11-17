import { expect, test } from "@playwright/test"
import { createExchange } from "./helpers"

test("the Host changes the location and a Participant sees it", async ({ page, browser }) => {
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  await expect(page).toHaveURL(/\/e\/[0-9a-f-]{36}\/host$/)
  const hostUrl = page.url()

  const device = await browser.newContext()
  const friend = await device.newPage()
  await friend.goto(`/join/${accessCode}`)
  await friend.getByLabel("Display name").fill("Ben")
  await friend.getByRole("button", { name: "Join" }).click()
  await friend.getByRole("link", { name: "Go to my page" }).click()
  await expect(friend.getByText("Mia's flat")).toBeVisible()

  await page.getByRole("button", { name: "Edit Event Details" }).click()
  const form = page.getByRole("form", { name: "Edit Event Details" })
  await expect(form.getByRole("textbox", { name: "Budget" })).toHaveValue("25.5")
  await expect(form.getByLabel("Instructions")).toHaveValue("No gift cards")
  await form.getByLabel("Location").fill("")
  await form.getByRole("button", { name: "Save Event Details" }).click()
  await expect(form.getByLabel("Location")).toHaveAccessibleDescription(/Say where the gifts are handed over/)

  await form.getByLabel("Location").fill("The Crown, upstairs")
  await form.getByRole("button", { name: "Save Event Details" }).click()

  await expect(page.getByText("Event Details saved.")).toBeVisible()
  const details = page.getByRole("region", { name: "Event Details" })
  await expect(details.getByText("The Crown, upstairs")).toBeVisible()
  await expect(details.getByText("Friday, December 18, 2026")).toBeVisible()
  await expect(details.getByText("$25.50")).toBeVisible()
  await expect(details.getByText("No gift cards")).toBeVisible()

  await friend.reload()
  await expect(friend.getByText("The Crown, upstairs")).toBeVisible()
  await expect(friend.getByText("Mia's flat")).toHaveCount(0)

  const eventUrl = hostUrl.replace(/\/host$/, "/event")
  await friend.goto(eventUrl)
  await expect(friend.getByRole("heading", { level: 1 })).toHaveText("Office Secret Santa")
  await expect(friend.getByText("The Crown, upstairs")).toBeVisible()
  await expect(friend.getByText("7:30 PM")).toBeVisible()
  await page.goto(eventUrl)
  await expect(page.getByText("The Crown, upstairs")).toBeVisible()
  await expect(page.getByRole("button", { name: "Edit Event Details" })).toHaveCount(0)

  const stranger = await (await browser.newContext()).newPage()
  await stranger.goto(eventUrl)
  await expect(stranger.getByRole("heading", { name: "You need your link" })).toBeVisible()
  await expect(stranger.getByText("The Crown, upstairs")).toHaveCount(0)
})
