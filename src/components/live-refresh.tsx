"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function LiveRefresh({ exchangeId, role, snapshot }: { exchangeId: string; role: "host" | "participant"; snapshot: string }) {
  const router = useRouter()
  const current = useRef(snapshot)
  useEffect(() => { current.current = snapshot }, [snapshot])
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    let controller: AbortController | undefined
    async function poll() {
      controller?.abort()
      controller = new AbortController()
      try {
        const response = await fetch(`/e/${exchangeId}/view/${role}`, { cache: "no-store", signal: controller.signal })
        if (!response.ok) {
          if (response.status === 404) router.refresh()
          return
        }
        const next = JSON.stringify(await response.json())
        if (next !== current.current) {
          router.refresh()
        }
      } catch {
        // A later poll retries network failures; hiding the page also aborts an in-flight request.
      }
    }
    function update() {
      if (timer) clearInterval(timer)
      controller?.abort()
      timer = undefined
      if (document.visibilityState === "visible") {
        void poll()
        timer = setInterval(() => void poll(), 10_000)
      }
    }
    update()
    document.addEventListener("visibilitychange", update)
    return () => {
      if (timer) clearInterval(timer)
      controller?.abort()
      document.removeEventListener("visibilitychange", update)
    }
  }, [exchangeId, role, router])
  return null
}
