import { expect, test, type BrowserContext, type Page } from "@playwright/test"
import { createExchange } from "./helpers"

test("Host draws once; every Participant privately opens the same Recipient on return", async ({ page, browser }, testInfo) => {
  test.setTimeout(120_000)
  const { accessCode } = await createExchange(page)
  await page.getByRole("checkbox", { name: "I've saved my Host Link" }).check()
  await page.getByRole("link", { name: "Go to the dashboard" }).click()
  const hostUrl = page.url()
  const people: { name: string; page: Page; context: BrowserContext }[] = []
  try {
    for (const name of ["Ana", "Ben", "Cara"]) {
      const context = await browser.newContext()
      const friend = await context.newPage()
      people.push({ name, page: friend, context })
      await friend.goto(`/join/${accessCode}`)
      await friend.getByLabel("Display name").fill(name)
      await friend.getByRole("button", { name: "Join", exact: true }).click()
      await friend.getByRole("link", { name: "Go to my page" }).click()
      for (const position of [1, 2, 3]) {
        const item = friend.getByRole("group", { name: `Item ${position}` })
        await item.getByLabel("Name", { exact: true }).fill(`${name}'s gift ${position}`)
        await item.getByLabel("Description").fill(`${name}'s description ${position}`)
        await item.getByLabel("Product link").fill(`https://example.com/${name}/${position}`)
      }
      await friend.getByRole("button", { name: "Save Wishlist" }).click()
      await expect(friend.getByRole("heading", { name: "You're Ready" })).toBeVisible()
    }
    await page.reload()
    await page.getByRole("button", { name: "Close registration", exact: true }).click()
    const start = page.getByRole("button", { name: "Start Draw", exact: true })
    await expect(start).toBeEnabled()
    await start.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("alertdialog", { name: "Draw for 3 participants?" })
    await expect(dialog).toHaveAccessibleDescription("This can't be undone.")
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(dialog.getByRole("button", { name: "Draw now" })).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused()
    await page.keyboard.press("Tab")
    await page.keyboard.press("Enter")
    await expect(page.getByText("The Draw is complete. Ask everyone to open their reveal.")).toBeVisible()
    const tracking = page.getByRole("region", { name: "Reveals" })
    await expect(tracking.getByText("0 of 3 have seen their Recipient")).toBeVisible()
    await expect(start).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole("button", { name: "Start Draw", exact: true })).toHaveCount(0)
    await expect(page.getByText(/gift [123]|description [123]/)).toHaveCount(0)

    const recipients = []
    for (const [index, person] of people.entries()) {
      const friend = person.page
      await friend.reload()
      await expect(friend.getByText(/your Wishlist is locked/)).toBeVisible()
      await expect(friend.getByRole("button", { name: "Save Wishlist" })).toHaveCount(0)
      await friend.getByRole("link", { name: "Reveal my Recipient" }).click()
      await expect(friend.getByRole("heading", { name: "Your Recipient" })).toHaveCount(0)
      if (index === 0) await friend.screenshot({ path: testInfo.outputPath("gift-box.png"), fullPage: true })
      await page.reload()
      await expect(tracking.getByText(`${index} of 3 have seen their Recipient`)).toBeVisible()
      if (index === 1) await friend.emulateMedia({ reducedMotion: "reduce" })
      const open = friend.getByRole("button", { name: "Open my gift box" })
      const movement = open.evaluate((button) => new Promise<boolean>((resolve) => {
        let moved = false
        function sample() {
          if (!button.isConnected) return resolve(moved)
          if ([...button.querySelectorAll("*")].some((part) => getComputedStyle(part).transform !== "none")) moved = true
          requestAnimationFrame(sample)
        }
        sample()
      }))
      const [animated] = await Promise.all([
        movement,
        index === 2 ? (async () => { await open.focus(); await friend.keyboard.press("Enter") })() : open.click(),
      ])
      expect(animated).toBe(index === 0)
      const recipient = friend.getByRole("region", { name: "Your Recipient" })
      await expect(recipient).toBeVisible()
      const recipientName = await recipient.getByTestId("recipient-name").innerText()
      expect(recipientName).not.toBe(person.name)
      recipients.push(recipientName)
      await expect(recipient.getByRole("heading", { name: "Your Recipient" })).toBeFocused()
      for (const position of [1, 2, 3]) {
        await expect(recipient.getByText(`${recipientName}'s gift ${position}`)).toBeVisible()
        await expect(recipient.getByText(`${recipientName}'s description ${position}`)).toBeVisible()
        const link = recipient.getByRole("link", { name: "example.com", exact: true }).nth(position - 1)
        await expect(link).toHaveAttribute("target", "_blank")
        await expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow")
      }
      await expect(friend.getByText("Mia's flat")).toBeVisible()
      await expect(friend.getByText("$25.50")).toBeVisible()
      await friend.screenshot({ path: testInfo.outputPath(`reveal-${person.name}.png`), fullPage: true })
      await friend.reload()
      await expect(friend.getByTestId("recipient-name")).toHaveText(recipientName)
      await expect(open).toHaveCount(0)
      await page.reload()
      await expect(tracking.getByText(`${index + 1} of 3 have seen their Recipient`)).toBeVisible()
      await expect(tracking.getByRole("listitem").filter({ hasText: person.name })).toContainText("Seen")
    }
    expect(new Set(recipients)).toEqual(new Set(["Ana", "Ben", "Cara"]))
    await page.goto(hostUrl.replace(/\/host$/, "/reveal"))
    await expect(page.getByRole("heading", { name: "You need your Personal Link" })).toBeVisible()
    await expect(page.getByTestId("recipient-name")).toHaveCount(0)
  } finally {
    await Promise.all(people.map((person) => person.context.close()))
  }
})
