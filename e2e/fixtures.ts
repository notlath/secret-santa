import { expect, test as base, type Locator, type Page } from "@playwright/test"

export const test = base.extend<{ delayedPage: { page: Page; release: () => void } }>({
  delayedPage: async ({ context }, provide) => {
    const page = await context.newPage()
    let release = () => {}
    const ready = new Promise<void>((resolve) => { release = resolve })
    await page.route("**/_next/static/**/*.js*", async (route) => {
      await ready
      await route.continue()
    })
    try {
      await provide({ page, release })
    } finally {
      release()
      await page.unrouteAll({ behavior: "wait" })
      await page.close()
    }
  },
})

export { expect }

export async function expectNativeDisabled(control: Locator) {
  await expect(control).toBeDisabled()
  await expect(control).toHaveAttribute("disabled", "")
}

export type OpeningMode = "pointer" | "reduced-motion-pointer" | "keyboard"

export async function openAndExpectMotion(page: Page, button: Locator, mode: OpeningMode) {
  await expect(button).toBeEnabled()
  await page.emulateMedia({ reducedMotion: mode === "reduced-motion-pointer" ? "reduce" : "no-preference" })
  const movement = button.evaluate((element) => new Promise<boolean>((resolve, reject) => {
    let moved = false
    let finished = false
    const timeout = setTimeout(() => { finished = true; reject(new Error("The reveal did not finish opening")) }, 10_000)
    function sample() {
      if (finished) return
      if (!element.isConnected) {
        clearTimeout(timeout)
        resolve(moved)
        return
      }
      if ([...element.querySelectorAll("*")].some((part) => getComputedStyle(part).transform !== "none")) moved = true
      requestAnimationFrame(sample)
    }
    sample()
  }))
  const activate = async () => {
    if (mode === "keyboard") {
      await button.focus()
      await page.keyboard.press("Enter")
    } else await button.click()
  }
  const [animated] = await Promise.all([movement, activate()])
  expect(animated, `${mode} opening motion`).toBe(mode === "pointer")
}
