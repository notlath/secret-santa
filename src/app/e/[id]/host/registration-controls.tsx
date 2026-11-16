"use client"

import { Button } from "@ui-sdk/react/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { HostView } from "@/server/exchange"
import { changeRegistrationAction } from "./actions"

type Props = Pick<HostView, "status" | "participants"> & { exchangeId: string }

export function RegistrationControls({ exchangeId, status, participants }: Props) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null)
  if (status !== "open" && status !== "closed") return null

  const missing: string[] = []
  if (status === "open") missing.push("Close registration before starting the Draw.")
  if (participants.length < 3) missing.push(`At least 3 Participants are needed (${participants.length} joined).`)
  const notReady = participants.filter((person) => !person.ready)
  if (notReady.length > 0) missing.push(`Not Ready: ${notReady.map((person) => person.displayName).join(", ")}.`)

  async function changeRegistration() {
    setFeedback(null)
    try {
      const result = await changeRegistrationAction(exchangeId, status === "open" ? "close" : "reopen")
      setFeedback(result.ok
        ? { error: false, message: status === "open" ? "Registration is closed. Wishlists can still be edited." : "Registration is open. Friends can join again." }
        : { error: true, message: result.message })
      router.refresh()
    } catch {
      setFeedback({ error: true, message: "Couldn't change registration. Please try again." })
    }
  }

  return (
    <section aria-labelledby="registration" className="flex flex-col gap-4">
      <h2 id="registration" className="font-display text-xl text-ink">Registration and Draw</h2>
      <p className="text-muted-ink">
        {status === "open" ? "Close registration when everyone has joined. You can reopen it for a late friend." : "New friends can't join while registration is closed. Participants can still edit their Wishlists."}
      </p>
      <Button className="self-start" onClick={changeRegistration} pendingAnnouncement="Changing registration">
        {status === "open" ? "Close registration" : "Reopen registration"}
      </Button>
      <p role="status" className={feedback?.error ? "text-cranberry" : "text-pine"}>{feedback?.message}</p>
      <div id="draw-requirements" className="flex flex-col gap-2 text-muted-ink">
        {missing.length > 0 ? (
          <ul className="flex list-inside list-disc flex-col gap-2">
            {missing.map((reason) => <li key={reason} className="[overflow-wrap:anywhere]">{reason}</li>)}
          </ul>
        ) : <p>Everyone is Ready. Starting the Draw is coming soon.</p>}
      </div>
      <Button disabled focusableWhenDisabled aria-describedby="draw-requirements" className="self-start">Start Draw</Button>
    </section>
  )
}
