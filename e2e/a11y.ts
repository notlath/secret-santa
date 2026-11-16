import { expect, type Locator, type Page } from "@playwright/test"

type Mode = "text" | "edges" | "focus"

// Contrast is measured on painted colors: each color is resolved through a canvas, so color-mix and
// oklab values compare correctly, and translucent backgrounds are composited over their ancestors.
async function measure(page: Page, mode: Mode) {
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
    function contrastOn(color: string, element: Element) {
      const behind = backdrop(element.parentElement)
      return ratio(over(rgba(color), behind), behind)
    }
    function describe(element: Element) {
      const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)
      return `<${element.tagName.toLowerCase()}${element.getAttribute("data-slot") ? ` data-slot=${element.getAttribute("data-slot")}` : ""}> "${text}"`
    }
    const outline = (style: CSSStyleDeclaration) => `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`
    const visible = (element: Element) => element.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    const disabled = (element: Element) => element.closest("[disabled], [data-disabled], [aria-disabled='true']") !== null

    const problems: string[] = []
    if (mode === "focus") {
      // The last stop's ring must go away once focus leaves it, or it isn't a focus indicator.
      for (const previous of document.querySelectorAll("[data-audit-ring]")) {
        const stillFocused = previous.matches(":focus-visible, :has(:focus-visible)")
        if (!stillFocused && outline(getComputedStyle(previous)) === previous.getAttribute("data-audit-ring")) {
          problems.push(`${describe(previous)} shows the same outline without focus`)
        }
        if (!stillFocused) previous.removeAttribute("data-audit-ring")
      }
      const focused = document.activeElement
      if (!focused || focused === document.body) return [...problems, "nothing is focused"]
      for (let node: Element | null = focused, depth = 0; node && depth < 3; node = node.parentElement, depth++) {
        const style = getComputedStyle(node)
        if (style.outlineStyle === "none" || parseFloat(style.outlineWidth) < 1) continue
        if (style.outlineStyle === "auto") return [...problems, `${describe(focused)} uses the browser's default focus ring`]
        node.setAttribute("data-audit-ring", outline(style))
        const contrast = contrastOn(style.outlineColor, node)
        return contrast >= 3 ? problems : [...problems, `${describe(focused)} focus ring ${contrast}:1`]
      }
      return [...problems, `${describe(focused)} has no visible focus ring`]
    }

    if (mode === "edges") {
      const controls = 'input[data-slot="input"], textarea, [data-slot="number-input-control"], [data-slot="date-input"], [data-slot="time-input"], [data-slot="select-trigger"], [data-slot="checkbox"], button[data-slot], a[data-slot="button"]'
      for (const control of document.querySelectorAll(controls)) {
        if (!visible(control) || disabled(control)) continue
        const style = getComputedStyle(control)
        const edge = parseFloat(style.borderTopWidth) >= 1 ? style.borderTopColor : style.backgroundColor
        const contrast = contrastOn(edge, control)
        if (contrast < 3) problems.push(`${describe(control)} edge ${contrast}:1`)
      }
      return problems
    }

    for (const element of document.body.querySelectorAll("*")) {
      const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim())
      if (!ownText || !visible(element) || disabled(element)) continue
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
  expect.soft(await measure(page, "edges"), `control edges on ${page.url()}`).toEqual([])
}

const MAX_STOPS = 150

// Without `within`, the walk starts from a marker at the top of the page: blurring would leave Chrome's
// sequential focus starting point where focus was. Inside a modal the walk starts from the current focus.
export async function expectEveryStopNamedAndVisible(page: Page, within?: Locator) {
  if (!within) {
    await page.locator("body").evaluate((body) => {
      const start = Object.assign(document.createElement("span"), { tabIndex: -1, id: "audit-start" })
      body.prepend(start)
      start.focus()
    })
    await page.keyboard.press("Tab")
  }
  const seen = new Set<string>()
  const problems: string[] = []
  let wrapped = false
  for (let step = 0; step < MAX_STOPS; step++) {
    const focused = page.locator(":focus")
    if ((await focused.count()) === 0) {
      problems.push(...(await measure(page, "focus")).filter((problem) => problem.includes("without focus")))
      wrapped = true
      break
    }
    const id = await focused.evaluate((element) => {
      const marked = element.getAttribute("data-audit-id") ?? String(Math.random())
      element.setAttribute("data-audit-id", marked)
      return marked
    })
    const focusProblems = await measure(page, "focus")
    if (seen.has(id)) {
      problems.push(...focusProblems.filter((problem) => problem.includes("without focus")))
      wrapped = true
      break
    }
    seen.add(id)
    if (within) await expect(within.locator(":focus")).toHaveCount(1)
    const role = (await focused.ariaSnapshot()).split("\n")[0]
    if (!/"[^"]+"/.test(role)) problems.push(`unnamed stop: ${role}`)
    problems.push(...focusProblems)
    await page.keyboard.press("Tab")
  }
  await page.evaluate(() => {
    document.getElementById("audit-start")?.remove()
    for (const element of document.querySelectorAll("[data-audit-id], [data-audit-ring]")) {
      element.removeAttribute("data-audit-id")
      element.removeAttribute("data-audit-ring")
    }
  })
  expect(wrapped, `tab stops on ${page.url()} ended within ${MAX_STOPS}`).toBe(true)
  expect(seen.size, `tab stops on ${page.url()}`).toBeGreaterThan(0)
  expect.soft(problems, `tab stops on ${page.url()}`).toEqual([])
}

export async function auditPage(page: Page) {
  await expectReadableText(page)
  await expectEveryStopNamedAndVisible(page)
}

export async function tabTo(page: Page, target: Locator, { backwards = false } = {}) {
  for (let step = 0; step < MAX_STOPS; step++) {
    if (await target.evaluate((element) => element === document.activeElement, undefined, { timeout: 5_000 })) return
    await page.keyboard.press(backwards ? "Shift+Tab" : "Tab")
  }
  throw new Error(`Couldn't reach ${target} with the keyboard`)
}
