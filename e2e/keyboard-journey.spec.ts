import type { BrowserContext, Locator, Page } from "@playwright/test"
import { expect, test } from "./fixtures"
import { auditPage, expectEveryStopNamedAndVisible, expectReadableText, tabTo } from "./a11y"

async function typeInto(page: Page, field: Locator, text: string) {
  await tabTo(page, field)
  await page.keyboard.type(text)
}

async function press(page: Page, control: Locator, key = "Enter") {
  await tabTo(page, control)
  await page.keyboard.press(key)
}

async function auditDialog(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused()
  await expectReadableText(page)
  await expectEveryStopNamedAndVisible(page, dialog)
}

async function cancelReturnsFocus(page: Page, trigger: Locator, title: string) {
  await press(page, trigger)
  const dialog = page.getByRole("alertdialog", { name: title })
  await auditDialog(page, dialog)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await press(page, trigger)
  await expect(dialog).toBeVisible()
  await press(page, dialog.getByRole("button", { name: "Cancel", exact: true }), "Space")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
}

async function fillWishlistByKeyboard(page: Page, name: string) {
  await page.waitForLoadState("networkidle")
  await auditPage(page)
  for (const position of [1, 2, 3]) {
    await typeInto(page, page.getByRole("group", { name: `Item ${position}` }).getByLabel("Name", { exact: true }), `${name}'s gift ${position}`)
  }
  await press(page, page.getByRole("button", { name: "Save Wishlist" }))
  await expect(page.getByRole("status").filter({ hasText: "Wishlist saved." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "You're Ready" })).toBeVisible()
}

test("the whole Exchange works by keyboard alone, with every control named and its focus visible", async ({ page, browser }) => {
  test.setTimeout(240_000)
  const contexts: BrowserContext[] = []
  try {
    await page.goto("/")
    await auditPage(page)
    await press(page, page.getByRole("link", { name: "Create an Exchange" }))
    await expect(page).toHaveURL(/\/new$/)
    await page.waitForLoadState("networkidle")
    await auditPage(page)

    await typeInto(page, page.getByLabel("Exchange name"), "Keyboard Santa")
    await typeInto(page, page.getByRole("group", { name: "Date" }).getByRole("spinbutton").first(), "12182026")
    await typeInto(page, page.getByRole("group", { name: "Time" }).getByRole("spinbutton").first(), "0730P")
    await typeInto(page, page.getByLabel("Location"), "Mia's flat")
    await press(page, page.getByRole("button", { name: "Create Exchange" }))

    await expect(page.getByRole("heading", { name: "Save your Host Link" })).toBeFocused()
    const accessCode = (await page.getByTestId("access-code").innerText()).trim()
    await auditPage(page)
    await press(page, page.getByRole("checkbox", { name: "I've saved my Host Link" }), "Space")
    await expect(page.getByRole("checkbox", { name: "I've saved my Host Link" })).toBeChecked()
    await typeInto(page, page.getByLabel("Display name"), "Mia")
    await page.keyboard.press("Enter")
    await expect(page.getByRole("heading", { name: "Save your Personal Link" })).toBeFocused()
    await auditPage(page)
    await press(page, page.getByRole("link", { name: "Go to my page" }))
    await expect(page.getByText("You're in as Mia")).toBeVisible()
    const exchangeUrl = page.url().split("?")[0]
    await fillWishlistByKeyboard(page, "Mia")

    for (const name of ["Ana", "Ben"]) {
      const context = await browser.newContext()
      contexts.push(context)
      const friend = await context.newPage()
      await friend.goto("/join")
      await auditPage(friend)
      await typeInto(friend, friend.getByLabel("Access Code"), accessCode.replace("-", "").toLowerCase())
      await friend.keyboard.press("Enter")
      await expect(friend.getByRole("heading", { name: "Keyboard Santa" })).toBeVisible()
      await friend.waitForLoadState("networkidle")
      await auditPage(friend)
      await typeInto(friend, friend.getByLabel("Display name"), name)
      await friend.keyboard.press("Enter")
      await expect(friend.getByRole("heading", { name: "Save your Personal Link" })).toBeFocused()
      await press(friend, friend.getByRole("link", { name: "Go to my page" }))
      await expect(friend).toHaveURL(exchangeUrl)
      await fillWishlistByKeyboard(friend, name)
    }

    await press(page, page.getByRole("navigation", { name: "Switch role" }).getByRole("link", { name: "Host dashboard" }))
    await expect(page).toHaveURL(`${exchangeUrl}/host`)
    await page.waitForLoadState("networkidle")
    await expect(page.getByRole("meter", { name: "Wishlists ready" })).toHaveAttribute("aria-valuetext", "3 of 3 ready")
    await auditPage(page)
    await cancelReturnsFocus(page, page.getByRole("button", { name: "Remove Ben" }), "Remove Ben?")

    await press(page, page.getByRole("button", { name: "Close registration", exact: true }))
    await expect(page.getByRole("status").filter({ hasText: "Registration is closed." })).toBeVisible()
    const start = page.getByRole("button", { name: "Start Draw", exact: true })
    await expect(start).toBeEnabled()
    await cancelReturnsFocus(page, start, "Draw for 3 participants?")
    await press(page, start)
    await press(page, page.getByRole("alertdialog").getByRole("button", { name: "Draw now" }))
    await expect(page.getByRole("region", { name: "Reveals" })).toBeVisible()
    await expect(page.getByText("Draw done", { exact: true })).toBeVisible()
    await expect(page.locator("canvas")).toHaveCount(0)
    await auditPage(page)

    await press(page, page.getByRole("navigation", { name: "Switch role" }).getByRole("link", { name: "My exchange" }))
    await expect(page).toHaveURL(exchangeUrl)
    await auditPage(page)
    await press(page, page.getByRole("link", { name: "Reveal my Recipient" }))
    await page.waitForLoadState("networkidle")
    await auditPage(page)
    await press(page, page.getByRole("button", { name: "Open my gift box" }))
    await expect(page.getByRole("heading", { name: "Your Recipient" })).toBeFocused()
    await expect(page.getByTestId("recipient-name")).not.toHaveText("Mia")
    await auditPage(page)

    await page.goto(`${exchangeUrl}/event`)
    await auditPage(page)
    await press(page, page.getByRole("link", { name: "← Back to the dashboard" }))
    await expect(page).toHaveURL(`${exchangeUrl}/host`)

    await page.goto(`${exchangeUrl}/host`)
    await page.waitForLoadState("networkidle")
    const complete = page.getByRole("button", { name: "Mark completed" })
    await cancelReturnsFocus(page, complete, "Mark this Exchange completed?")
    await cancelReturnsFocus(page, page.getByRole("button", { name: "Delete Exchange" }), "Delete this Exchange?")
    await press(page, complete)
    await press(page, page.getByRole("alertdialog").getByRole("button", { name: "Mark completed" }))
    await expect(page.getByText("Completed", { exact: true })).toBeVisible()
    await expectEveryStopNamedAndVisible(page)
    await expectReadableText(page)

    await page.goto("/p/not-a-real-token")
    await expect(page.getByRole("heading", { name: "This link no longer works" })).toBeVisible()
    await auditPage(page)
  } finally {
    await Promise.all(contexts.map((context) => context.close()))
  }
})
