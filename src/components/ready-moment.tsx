"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { ReadyBadge } from "@/components/ready-badge"
import { WISHLIST_SIZE } from "@/lib/wishlist"

// Whether the last save came from a pointer; only then may becoming Ready animate.
const PointerSaveState = createContext(false)
const ReportPointerSave = createContext<(pointer: boolean) => void>(() => {})

export function ReadyMoments({ children }: { children: ReactNode }) {
  const [pointer, setPointer] = useState(false)
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    function onPreferenceChange(event: MediaQueryListEvent) {
      if (event.matches) setPointer(false)
    }
    preference.addEventListener("change", onPreferenceChange)
    return () => preference.removeEventListener("change", onPreferenceChange)
  }, [])
  return (
    <ReportPointerSave.Provider value={setPointer}>
      <PointerSaveState.Provider value={pointer}>{children}</PointerSaveState.Provider>
    </ReportPointerSave.Provider>
  )
}

export function useReportSave() {
  return useContext(ReportPointerSave)
}

export function ReadyState({ ready, saved }: { ready: boolean; saved: number }) {
  const pointerSave = useContext(PointerSaveState)
  const clearPointerSave = useContext(ReportPointerSave)
  const missing = WISHLIST_SIZE - saved
  if (!ready) {
    return (
      <section aria-labelledby="ready" className="flex flex-col gap-1 rounded-2xl border-2 border-gold bg-paper p-5">
        <h2 id="ready" className="font-display text-xl text-gold-ink">
          Not Ready yet
        </h2>
        <p className="text-muted-ink">
          Add {missing} more Wishlist {missing === 1 ? "Item" : "Items"} so the Host can run the Draw.
        </p>
      </section>
    )
  }
  const pop = pointerSave
  return (
    <section aria-labelledby="ready" className="flex flex-col gap-1 rounded-2xl border-2 border-pine bg-paper p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="ready" className="font-display text-xl text-pine">
          You&apos;re Ready
        </h2>
        <span data-pop={pop || undefined} onAnimationEnd={() => clearPointerSave(false)} className="inline-flex">
          <ReadyBadge ready />
        </span>
      </div>
      <p className="font-semibold text-pine">You&apos;re all set</p>
      <p className="text-muted-ink">All three Wishlist Items are in. You can still change them until the Draw.</p>
    </section>
  )
}
