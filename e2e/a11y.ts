import { expect, type Locator, type Page } from "@playwright/test"

// Contrast is measured on painted colors: each color is resolved through a canvas, so color-mix and
// oklab values compare correctly, and translucent backgrounds are composited over their ancestors.
async function measure(page: Page, mode: "text" | "focus") {
  return page.evaluate((mode) => {
    const canvas = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
    type RGBA = [number, number, number, number]
    function rgba(color: string): RGBA {
      canvas.clearRect(0, 0, 1, 1)
      canvas.fillStyle = "#000"
      canvas.fillStyle = color
      canvas.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data
      return [r, g, b, a / 255]
    }
    function over(top: RGBA, bottom: RGBA): RGBA {
      const a = top[3]
      return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1]
    }
    function backdrop(element: Element | null): RGBA {
      const layers: RGBA[] = []
      for (let node = element; node; node = node.parentElement) {
        const layer = rgba(getComputedStyle(node).backgroundColor)
        if (layer[3] > 0) layers.push(layer)
        if (layer[3] === 1) break
      }
      return layers.reduceRight<RGBA>((below, layer) => over(layer, below), [255, 255, 255, 1])
    }
    function luminance([r, g, b]: RGBA) {
      const [R, G, B] = [r, g, b].map((v) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4))
      return 0.2126 * R + 0.7152 * G + 0.0722 * B
    }
    function ratio(a: RGBA, b: RGBA) {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100
    }
    function describe(element: Element) {
      const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)
      return `<${element.tagName.toLowerCase()}${element.getAttribute("data-slot") ? ` data-slot=${element.getAttribute("data-slot")}` : ""}> "${text}"`
    }

    if (mode === "focus") {
      const focused = document.activeElement
      if (!focused || focused === document.body) return ["nothing is focused"]
      for (let node: Element | null = focused, depth = 0; node && depth < 3; node = node.parentElement, depth++) {
        const style = getComputedStyle(node)
        if (style.outlineStyle === "none" || parseFloat(style.outlineWidth) < 1) continue
        if (style.outlineStyle === "auto") return [`${describe(focused)} uses the browser's default focus ring`]
        const behind = backdrop(node.parentElement)
        const contrast = ratio(over(rgba(style.outlineColor), behind), behind)
        return contrast >= 3 ? [] : [`${describe(focused)} focus ring ${contrast}:1`]
      }
      return [`${describe(focused)} has no visible focus ring`]
    }

    const problems: string[] = []
    for (const element of document.body.querySelectorAll("*")) {
      const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim())
      if (!ownText || !element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
      if (element.closest("[disabled], [data-disabled], [aria-disabled='true']")) continue
      const style = getComputedStyle(element)
      const behind = backdrop(element)
      const contrast = ratio(over(rgba(style.color), behind), behind)
      const size = parseFloat(style.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
      if (contrast < (large ? 3 : 4.5)) problems.push(`${describe(element)} text ${contrast}:1`)
    }
    return problems
  }, mode)
}

export async function expectReadableText(page: Page) {
  expect.soft(await measure(page, "text"), `text contrast on ${page.url()}`).toEqual([])
}

// Tabs through every stop on the page once, checking each is named and shows a 3:1 focus ring.
export async function expectEveryStopNamedAndVisible(page: Page) {
  // Blurring keeps Chrome's sequential focus starting point where focus was, so start from a marker at the top.
  await page.locator("body").evaluate((body) => {
    const start = Object.assign(document.createElement("span"), { tabIndex: -1, id: "audit-start" })
    body.prepend(start)
    start.focus()
  })
  const seen = new Set<string>()
  const problems: string[] = []
  for (let step = 0; step < 80; step++) {
    await page.keyboard.press("Tab")
    const focused = page.locator(":focus")
    if ((await focused.count()) === 0) break
    const id = await focused.evaluate((element) => {
      const marked = element.getAttribute("data-audit-id") ?? String(Math.random())
      element.setAttribute("data-audit-id", marked)
      return marked
    })
    if (seen.has(id)) break
    seen.add(id)
    const role = (await focused.ariaSnapshot()).split("\n")[0]
    if (!/"[^"]+"/.test(role)) problems.push(`unnamed stop: ${role}`)
    problems.push(...(await measure(page, "focus")))
  }
  await page.locator("#audit-start").evaluate((start) => start.remove())
  expect(seen.size, `tab stops on ${page.url()}`).toBeGreaterThan(0)
  expect.soft(problems, `tab stops on ${page.url()}`).toEqual([])
}

export async function auditPage(page: Page) {
  await expectReadableText(page)
  await expectEveryStopNamedAndVisible(page)
}

// Presses Tab (or Shift+Tab) until the target has focus, proving it is reachable by keyboard.
export async function tabTo(page: Page, target: Locator, { backwards = false } = {}) {
  for (let step = 0; step < 80; step++) {
    if (await target.evaluate((element) => element === document.activeElement).catch(() => false)) return
    await page.keyboard.press(backwards ? "Shift+Tab" : "Tab")
  }
  throw new Error(`Couldn't reach ${target} with the keyboard`)
}
