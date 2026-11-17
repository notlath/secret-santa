import { auditPage } from "./a11y"
import { expect, test } from "./fixtures"

test("reduced motion: the landing page shows the plain gift box without a cat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await expect(page.locator("[data-hero-art] [data-gift-lid]")).toBeVisible()
  await expect(page.locator("[data-cat]")).toHaveCount(0)
  await expect(page.getByText("No peeking!")).toHaveCount(0)
  await expect(page.getByRole("img")).toHaveCount(0)
  await auditPage(page)
})

test("the cat is hidden from assistive technology and plays again after an early leave", async ({ page }) => {
  await page.goto("/")
  const art = page.locator("[data-hero-art]")
  const cat = page.locator("[data-cat]")
  await expect(cat).toHaveCount(1)
  await expect(page.locator("[data-cat-guard]")).toHaveAttribute("aria-hidden", "true")
  await expect(page.getByText("No peeking!")).toHaveCSS("opacity", "0")
  await auditPage(page)

  const offset = (selector: string) => async () =>
    Math.round(await page.locator(selector).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42))
  const catY = offset("[data-cat]")
  const lidY = offset("[data-gift-lid]")

  // Hover until hydration has attached the handler, then leave early: everything settles and can replay.
  for (let play = 0; play < 2; play++) {
    await expect.poll(async () => { await page.mouse.move(5, 5); await art.hover(); await page.waitForTimeout(350); return lidY() }, { timeout: 8000 }).toBeLessThan(-4)
    await page.mouse.move(5, 5)
    await expect.poll(catY, { timeout: 1500 }).toBe(70)
    await expect.poll(lidY, { timeout: 1500 }).toBe(0)
    await page.waitForTimeout(500)
  }
})
