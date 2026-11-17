"use client"

import { useAnimate } from "motion/react"
import { useRef, useSyncExternalStore, type PointerEvent } from "react"
import { GiftBox } from "@/components/gift-box"

const EASE = [0.23, 1, 0.32, 1] as const
const HIDDEN_Y = 70
const PEEK_Y = 8
const PAW_HIDDEN_Y = 24
const QUERY = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}
// Until hydrated the server snapshot says "reduced", so the plain box shows and the cat joins after.
const prefersReducedMotion = () => window.matchMedia(QUERY).matches
const reducedOnServer = () => true

export function CatGuard() {
  const [scope, animate] = useAnimate()
  const reduced = useSyncExternalStore(subscribe, prefersReducedMotion, reducedOnServer)
  const busy = useRef(false)
  const runId = useRef(0)

  async function play() {
    if (busy.current || reduced) return
    busy.current = true
    const id = ++runId.current
    // A leave or newer run bumps runId; stale runs stop here. Never await an interrupted animation: it never resolves.
    const step = async (run: () => unknown) => {
      if (runId.current === id) await run()
    }
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    await step(() => animate("[data-gift-lid]", { y: -8, rotate: -6 }, { duration: 0.25, ease: EASE }))
    await step(() => wait(200))
    await step(() => animate("[data-cat]", { y: PEEK_Y }, { duration: 0.9, ease: EASE }))
    await step(() => animate("[data-cat]", { rotate: [0, -7, 0] }, { duration: 0.6, ease: "easeInOut" }))
    await step(() => animate("[data-paw]", { y: [PAW_HIDDEN_Y, -14] }, { duration: 0.35, ease: EASE }))
    await step(() => Promise.all([
      animate("[data-paw]", { y: 0 }, { duration: 0.3, ease: "easeInOut" }),
      animate("[data-gift-lid]", { y: 0, rotate: 0 }, { duration: 0.3, ease: "easeInOut" }),
    ]))
    await step(() => animate("[data-bubble]", { opacity: [0, 1], scale: [0.9, 1] }, { duration: 0.2, ease: EASE }))
    await step(() => wait(600))
    await step(() => Promise.all([
      animate("[data-bubble]", { opacity: 0, scale: 0.9 }, { duration: 0.2, ease: EASE }),
      animate("[data-paw]", { y: PAW_HIDDEN_Y }, { duration: 0.3, ease: "easeInOut" }),
    ]))
    await step(() => wait(200))
    await step(() => animate("[data-cat]", { y: HIDDEN_Y }, { duration: 0.8, ease: "easeInOut" }))
    if (runId.current === id) cooldown()
  }

  function cooldown() {
    setTimeout(() => { busy.current = false }, 400)
  }

  function leave(event: PointerEvent) {
    if (event.pointerType === "touch" || !busy.current) return
    runId.current++
    animate("[data-gift-lid]", { y: 0, rotate: 0 }, { duration: 0.15, ease: EASE })
    animate("[data-cat]", { y: HIDDEN_Y, rotate: 0 }, { duration: 0.15, ease: EASE })
    animate("[data-paw]", { y: PAW_HIDDEN_Y }, { duration: 0.15, ease: EASE })
    animate("[data-bubble]", { opacity: 0, scale: 0.9 }, { duration: 0.15, ease: EASE })
    setTimeout(cooldown, 150)
  }

  function enter(event: PointerEvent) {
    if (event.pointerType === "mouse" || event.pointerType === "pen") void play()
  }

  function tap(event: PointerEvent) {
    if (event.pointerType === "touch") void play()
  }

  // Drawn behind the box: the box itself hides the cat, so it shows only above the lid's real edge at any angle.
  const behind = (
    <span className="pointer-events-none absolute -inset-bs-16 [inset-inline:0] block h-[5.75rem]">
      <span
        data-cat
        style={{ transform: `translateY(${HIDDEN_Y}px)` }}
        className="absolute inset-be-0 [inset-inline-start:6rem] block h-[3.25rem] w-14 origin-bottom"
      >
        <svg viewBox="0 0 96 88" className="h-full w-full overflow-visible">
          <path d="M70 84C84 87 93 78 91 66 89.5 57 83 53 78.5 56" fill="none" stroke="#3a2a24" strokeWidth="7" strokeLinecap="round" />
          <path d="M28 46C21 42 18 34 21 25L19 4C19 3 20 2.5 21 3L35 13C40 11.5 48 11.5 53 13L67 3C68 2.5 69 3 69 4L67 25C70 34 67 42 60 46 68 52 74 62 75 74 76 82 72 88 64 88H24C16 88 12 82 13 74 14 62 20 52 28 46Z" fill="#3a2a24" />
          <path d="M60 49C68 56 73 66 74 76 74 84 70 88 64 88H57C62 79 64 63 60 49Z" fill="var(--ink)" />
          <path d="M53 13 67 3C68 2.5 69 3 69 4L67 25C70 34 67 42 60 46 62 38 62 26 53 13Z" fill="var(--ink)" opacity="0.6" />
          <path d="M22.5 8 24 21 32 14Z" fill="var(--cranberry)" opacity="0.75" />
          <path d="M65.5 8 64 21 56 14Z" fill="var(--cranberry)" opacity="0.6" />
          <path d="M36 53C40 57 48 57 52 53 55 62 52 73 44 79 36 73 33 62 36 53Z" fill="var(--cream-deep)" />
          <path d="M48 56C51 64 49 72 44 79 50 74 53 64 52 54Z" fill="var(--line)" />
          <ellipse cx="33" cy="85" rx="7.5" ry="4" fill="var(--cream-deep)" />
          <ellipse cx="55" cy="85" rx="7.5" ry="4" fill="var(--line)" />
          <path d="M31 83.5V87M35 83.5V87M53 83.5V87M57 83.5V87" stroke="var(--line-strong)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M29 46.5C38 51.5 50 51.5 59 46.5L60.5 50.5C51 55.5 37 55.5 27.5 50.5Z" fill="var(--cranberry)" />
          <circle cx="44" cy="55.5" r="3.6" fill="var(--gold)" />
          <path d="M42 56.5H46" stroke="var(--gold-ink)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="43" cy="54.3" r="1" fill="#e2bd6e" />
          <path d="M37.5 34C39.5 30.5 48.5 30.5 50.5 34 52.5 38.5 49.5 42.5 44 42.5 38.5 42.5 35.5 38.5 37.5 34Z" fill="var(--cream-deep)" />
          <path d="M41.5 33.5H46.5L44 36.5Z" fill="#c4637a" />
          <path d="M44 36.5V38.5M44 38.5C43 40 41 40 40 38.6M44 38.5C45 40 47 40 48 38.6" fill="none" stroke="var(--ink)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M29 26C31 22.5 36 22.5 38 26 36 29.2 31 29.2 29 26Z" fill="var(--gold)" />
          <path d="M50 26C52 22.5 57 22.5 59 26 57 29.2 52 29.2 50 26Z" fill="var(--gold)" />
          <ellipse cx="33.5" cy="26" rx="1.3" ry="2.9" fill="var(--ink)" />
          <ellipse cx="54.5" cy="26" rx="1.3" ry="2.9" fill="var(--ink)" />
          <circle cx="35" cy="24.6" r="0.9" fill="var(--paper)" />
          <circle cx="56" cy="24.6" r="0.9" fill="var(--paper)" />
          <path d="M37 37 23 35M37 39.5 24 42M51 37 65 35M51 39.5 64 42" stroke="var(--line)" strokeWidth="0.8" strokeLinecap="round" opacity="0.85" />
        </svg>
      </span>
      <span data-paw style={{ transform: `translateY(${PAW_HIDDEN_Y}px)` }} className="absolute inset-be-0 [inset-inline-start:8.1rem] block h-[14px] w-4">
        <svg viewBox="0 0 16 14" className="h-full w-full">
          <path d="M2 9V4Q2 0 6 0H10Q14 0 14 4V9Z" fill="#3a2a24" />
          <ellipse cx="8" cy="10" rx="7.5" ry="4" fill="var(--cream-deep)" />
          <path d="M5.5 11.4V13.5M10.5 11.4V13.5" stroke="var(--line-strong)" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  )

  const front = (
    <span data-bubble style={{ opacity: 0 }} className="absolute -inset-bs-[3.75rem] [inset-inline-start:4.75rem] origin-bottom whitespace-nowrap rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink">
      No peeking!
    </span>
  )

  return (
    <div ref={scope} aria-hidden="true" data-cat-guard onPointerEnter={enter} onPointerUp={tap} onPointerLeave={leave} className="shrink-0 touch-manipulation select-none">
      <GiftBox behind={reduced ? null : behind} front={reduced ? null : front} />
    </div>
  )
}
