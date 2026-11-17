import { expect, expectNativeDisabled, test } from "./fixtures"
import { createExchange, drawnExchange } from "./helpers"

for (const action of ["join", "copy"] as const) {
  test(`${action} waits for hydration before accepting input`, async ({ page, delayedPage }) => {
    const { accessCode, hostLink } = await createExchange(page)
    const slow = delayedPage.page
    await slow.goto(action === "join" ? `/join/${accessCode}` : hostLink, { waitUntil: "commit" })
    const button = slow.getByRole("button", { name: action === "join" ? "Join" : "Copy join link", exact: true })
    await expect(button).toBeVisible()
    await expectNativeDisabled(button)
    if (action === "join") await expectNativeDisabled(slow.getByLabel("Display name"))
    delayedPage.release()
    await expect(button).toBeEnabled()
    if (action === "join") {
      await slow.getByLabel("Display name").fill("Ben")
      await button.click()
      await expect(slow.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
    } else {
      await slow.context().grantPermissions(["clipboard-read", "clipboard-write"])
      await button.click()
      await expect(slow.getByRole("region", { name: "Invite your friends" }).getByRole("status")).toContainText("Copied")
    }
  })
}

test("Participant management waits for hydration", async ({ page, delayedPage }) => {
  const { accessCode, hostLink } = await createExchange(page)
  await page.goto(`/join/${accessCode}`)
  await page.getByLabel("Display name").fill("Ben")
  await page.getByRole("button", { name: "Join" }).click()
  await expect(page.getByRole("heading", { name: "Save your Personal Link" })).toBeVisible()
  const slow = delayedPage.page
  await slow.goto(hostLink, { waitUntil: "commit" })
  const reissue = slow.getByRole("button", { name: "Re-issue link for Ben" })
  const remove = slow.getByRole("button", { name: "Remove Ben" })
  await expectNativeDisabled(reissue)
  await expectNativeDisabled(remove)
  delayedPage.release()
  await expect(reissue).toBeEnabled()
  await expect(remove).toBeEnabled()
})

test("Finish controls wait for hydration", async ({ page, delayedPage }) => {
  test.setTimeout(120_000)
  const people = await drawnExchange(page, delayedPage.page.context().browser()!)
  try {
    const slow = delayedPage.page
    await slow.goto(page.url(), { waitUntil: "commit" })
    const finish = slow.getByRole("region", { name: "Finish" })
    const complete = finish.getByRole("button", { name: "Mark completed", exact: true })
    const remove = finish.getByRole("button", { name: "Delete Exchange" })
    await expectNativeDisabled(complete)
    await expectNativeDisabled(remove)
    delayedPage.release()
    await expect(complete).toBeEnabled()
    await expect(remove).toBeEnabled()
  } finally {
    await Promise.all(people.map((person) => person.context.close()))
  }
})

test("forms keep their fields and submit disabled until hydration", async ({ page, delayedPage }) => {
  const { accessCode } = await createExchange(page)
  await page.goto(`/join/${accessCode}`)
  await page.getByLabel("Display name").fill("Ben")
  await page.getByRole("button", { name: "Join" }).click()
  await page.getByRole("link", { name: "Go to my page" }).click()
  await expect(page.getByText("You're in as Ben")).toBeVisible()

  const slow = delayedPage.page
  await slow.goto("/new", { waitUntil: "commit" })
  await expectNativeDisabled(slow.getByRole("button", { name: "Create Exchange" }))
  await expect(slow.getByLabel("Exchange name")).toBeDisabled()

  await slow.goto(page.url(), { waitUntil: "commit" })
  const saveWishlist = slow.getByRole("button", { name: "Save Wishlist" })
  const itemName = slow.getByRole("group", { name: "Item 1" }).getByLabel("Name", { exact: true })
  const saveName = slow.getByRole("button", { name: "Save name" })
  for (const button of [saveWishlist, saveName]) await expectNativeDisabled(button)
  for (const field of [itemName, slow.getByLabel("Display name")]) await expect(field).toBeDisabled()
  delayedPage.release()
  await itemName.fill("Socks")
  await saveWishlist.click()
  await expect(slow.getByRole("status").filter({ hasText: "Wishlist saved." })).toBeVisible()
  expect(new URL(slow.url()).search).toBe("")
  await expect(saveName).toBeEnabled()
})
