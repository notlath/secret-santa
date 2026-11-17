"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { ExchangeStatus } from "@/server/exchange"

const DrawCelebrationContext = createContext<() => void>(() => {})

export function DrawCelebration({ status, children }: { status: ExchangeStatus; children: ReactNode }) {
  const [celebrated, setCelebrated] = useState(false)
  return (
    <DrawCelebrationContext.Provider value={() => setCelebrated(true)}>
      <div data-draw-celebration={celebrated && status === "assigned" || undefined} className="contents">
        {children}
      </div>
    </DrawCelebrationContext.Provider>
  )
}

export function useDrawCelebration() {
  return useContext(DrawCelebrationContext)
}
