"use client"

import { useEffect, useState, type ReactNode } from "react"

// The join redirect carries ?joined=1 so the heading can rise once. The flag is kept in state and dropped from the
// URL, so neither a reload nor the re-render that follows the URL change replays or cuts short the rise.
export function ArrivalHeading({ arrived, children }: { arrived: boolean; children: ReactNode }) {
  const [rise] = useState(arrived)
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has("joined")) return
    url.searchParams.delete("joined")
    window.history.replaceState(window.history.state, "", url)
  }, [])
  return (
    <h1 data-rise={rise || undefined} className="font-display text-3xl text-ink sm:text-4xl">
      {children}
    </h1>
  )
}
