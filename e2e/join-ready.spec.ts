import { expect, test, type Browser, type Page } from "@playwright/test"
import { auditPage } from "./a11y"
import { openDashboard } from "./helpers"
import { setPageVisibility } from "./fixtures"

async function joinAndArrive(browser: Browser, accessCode: string, name: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(`/join/${accessCode}`)
  await page.getByLabel("Display name").fill(name)
  await page.getByRole("button", { name: "Join", exact: true }).click()
  await page.getByRole("link", { name: "Go to my page" }).click()
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  return { context, page }
}

async function fillItems(page: Page) {
  for (const position of [1, 2, 3]) {
    await page.getByRole("group", { name: `Item ${position}` }).getByLabel("Name", { exact: true }).fill(`Gift ${position}`)
  }
}

const heading = (page: Page) => page.getByRole("heading", { level: 1 })

async function observeReadyPop(page: Page) {
  await page.evaluate(() => {
    document.addEventListener("animationstart", (event) => {
      if ((event.target as Element).matches("[data-pop]")) document.documentElement.dataset.readyPopped = "true"
    })
  })
}

test("the heading rises on the first arrival after joining and not after a reload", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")

  await expect(heading(ben)).toHaveAttribute("data-rise")
  await expect(ben).not.toHaveURL(/joined/)
  await auditPage(ben)

  await ben.reload()
  await expect(heading(ben)).toBeVisible()
  await expect(heading(ben)).not.toHaveAttribute("data-rise")
  await context.close()
})

test("opening the personal link later shows no entrance", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  const token = (await context.cookies()).find((cookie) => cookie.value.length >= 22 && /^[A-Za-z0-9_-]+$/.test(cookie.value))!.value
  await ben.goto(`/p/${token}`)
  await expect(heading(ben)).toBeVisible()
  await expect(heading(ben)).not.toHaveAttribute("data-rise")
  await context.close()
})

test("keyboard arrival shows the heading without motion", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const context = await browser.newContext()
  const ben = await context.newPage()
  try {
    await ben.goto(`/join/${accessCode}`)
    await ben.getByLabel("Display name").fill("Ben")
    await ben.getByRole("button", { name: "Join", exact: true }).click()
    await ben.getByRole("link", { name: "Go to my page" }).focus()
    await ben.keyboard.press("Enter")
    await expect(heading(ben)).toBeVisible()
    await expect(heading(ben)).not.toHaveAttribute("data-rise")
  } finally { await context.close() }
})

test("completing the Wishlist with a pointer pops the Ready badge and says you're all set", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  await expect(ben.getByText("You're all set")).toHaveCount(0)

  await fillItems(ben)
  await observeReadyPop(ben)
  await ben.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(ben.getByText("You're all set")).toBeVisible()
  await expect(ben.locator("html")).toHaveAttribute("data-ready-popped", "true")
  await context.close()
})

test("completing the Wishlist from the keyboard says you're all set without the pop", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")

  await fillItems(ben)
  await ben.getByRole("button", { name: "Save Wishlist" }).focus()
  await ben.keyboard.press("Enter")
  await expect(ben.getByText("You're all set")).toBeVisible()
  await expect(ben.locator("[data-pop]")).toHaveCount(0)
  await context.close()
})

test("a Participant who is already Ready on load sees the message and no pop", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  await fillItems(ben)
  await ben.getByRole("button", { name: "Save Wishlist" }).click()
  await expect(ben.getByText("You're all set")).toBeVisible()

  await ben.reload()
  await expect(ben.getByText("You're all set")).toBeVisible()
  await expect(ben.locator("[data-pop]")).toHaveCount(0)
  await context.close()
})

test("becoming Ready again after loading Ready celebrates the new local transition", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  try {
    await fillItems(ben)
    await ben.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(ben.getByText("You're all set")).toBeVisible()
    await ben.reload()
    await expect(ben.getByText("You're all set")).toBeVisible()
    const third = ben.getByRole("group", { name: "Item 3" }).getByLabel("Name", { exact: true })
    await third.clear()
    await ben.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(ben.getByRole("heading", { name: "Not Ready yet" })).toBeVisible()
    await third.fill("Gift 3")
    await observeReadyPop(ben)
    await ben.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(ben.getByText("You're all set")).toBeVisible()
    await expect(ben.locator("html")).toHaveAttribute("data-ready-popped", "true")
  } finally { await context.close() }
})

test("a remote completion does not celebrate an earlier incomplete local save", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  try {
    await ben.getByRole("group", { name: "Item 1" }).getByLabel("Name", { exact: true }).fill("Gift 1")
    await ben.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(ben.getByText("Wishlist saved.")).toBeVisible()
    await observeReadyPop(ben)
    const remote = await context.newPage()
    await remote.goto(ben.url())
    await fillItems(remote)
    await remote.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(remote.getByText("You're all set")).toBeVisible()
    await setPageVisibility(ben, "hidden")
    await setPageVisibility(ben, "visible")
    await expect(ben.getByText("You're all set")).toBeVisible()
    await expect(ben.locator("[data-pop]")).toHaveCount(0)
    await expect(ben.locator("html")).not.toHaveAttribute("data-ready-popped")
  } finally { await context.close() }
})

test("a pointer save under reduced motion shows Ready without animation", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  try {
    await ben.emulateMedia({ reducedMotion: "reduce" })
    await fillItems(ben)
    await observeReadyPop(ben)
    await ben.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(ben.getByText("You're all set")).toBeVisible()
    expect(await ben.getByRole("region", { name: "You're Ready" }).evaluate((region) => region.getAnimations({ subtree: true }).length)).toBe(0)
    await expect(ben.locator("html")).not.toHaveAttribute("data-ready-popped")
  } finally { await context.close() }
})

test("enabling reduced motion during the Ready pop prevents it replaying", async ({ page, browser }) => {
  const accessCode = await openDashboard(page)
  const { context, page: ben } = await joinAndArrive(browser, accessCode, "Ben")
  try {
    await fillItems(ben)
    await ben.evaluate(() => {
      document.addEventListener("animationstart", (event) => {
        const target = event.target as Element
        if (!target.matches("[data-pop]")) return
        target.getAnimations().forEach((animation) => animation.pause())
        document.documentElement.dataset.readyPopped = "true"
      })
    })
    await ben.getByRole("button", { name: "Save Wishlist" }).click()
    await expect(ben.locator("html")).toHaveAttribute("data-ready-popped", "true")
    await ben.emulateMedia({ reducedMotion: "reduce" })
    await expect(ben.locator("[data-pop]")).toHaveCount(0)
    await ben.emulateMedia({ reducedMotion: "no-preference" })
    await expect(ben.locator("[data-pop]")).toHaveCount(0)
  } finally { await context.close() }
})
