"use client"

import { Button } from "@ui-sdk/react/button"
import { useEffect, useState } from "react"

const STORAGE_KEY = "festive-snow-paused"
const FLAKES = 42
const SIZE = [4, 10]
const FALL_SECONDS = [7, 12]

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Seeded, so the server and the client render the same flakes.
const rand = seeded(7)
const flakes = Array.from({ length: FLAKES }, () => {
  const dur = FALL_SECONDS[0] + rand() * (FALL_SECONDS[1] - FALL_SECONDS[0])
  return {
    x: `${rand() * 100}vw`,
    size: `${SIZE[0] + rand() * (SIZE[1] - SIZE[0])}px`,
    dur: `${dur}s`,
    delay: `${-rand() * dur}s`,
    drift: `${(rand() - 0.5) * 80}px`,
    gold: rand() > 0.5,
  }
})

export function Snowfall() {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is browser-only, so it is read after mount
    try { setPaused(localStorage.getItem(STORAGE_KEY) === "1") } catch {}
  }, [])

  function toggle() {
    const next = !paused
    setPaused(next)
    try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0") } catch {}
  }

  return (
    <div data-snow-root>
      <div aria-hidden="true" data-snowfall data-paused={paused || undefined} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {flakes.map((flake, index) => (
          <span
            key={index}
            data-gold={flake.gold || undefined}
            style={{ "--x": flake.x, "--size": flake.size, "--dur": flake.dur, "--delay": flake.delay, "--drift": flake.drift } as React.CSSProperties}
          />
        ))}
      </div>
      <Button
        onClick={toggle}
        aria-pressed={paused}
        className="fixed z-40 min-h-11 bg-paper inset-be-4 [inset-inline-end:1rem]"
      >
        {paused ? "Let it snow" : "Pause snow"}
      </Button>
    </div>
  )
}
