"use client"

import { Button } from "@ui-sdk/react/button"
import { useState } from "react"
import { useHydrated } from "@/hooks/use-hydrated"

// `path` is resolved against the current origin so links work on any deployment.
export function CopyButton({ path, text, children }: { path?: string; text?: string; children: string }) {
  const hydrated = useHydrated()
  const [status, setStatus] = useState("")

  async function copy() {
    const value = text ?? `${window.location.origin}${path ?? ""}`
    try {
      await navigator.clipboard.writeText(value)
      setStatus("Copied to your clipboard.")
    } catch {
      setStatus("Couldn't copy. Select the text and copy it yourself.")
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <Button onClick={copy} disabled={!hydrated}>{children}</Button>
      <span role="status" className="text-sm text-pine">
        {status}
      </span>
    </span>
  )
}
