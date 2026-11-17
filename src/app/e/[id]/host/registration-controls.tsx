"use client"

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@ui-sdk/react/alert-dialog"
import { Button } from "@ui-sdk/react/button"
import { useRouter } from "next/navigation"
import { useRef, useState, type MouseEvent } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import { celebrate } from "@/lib/celebrate"
import type { HostView } from "@/server/exchange"
import { changeRegistrationAction, drawAction } from "./actions"
import { useDrawCelebration } from "./draw-celebration"

type Props = Pick<HostView, "status" | "participants"> & { exchangeId: string }

export function RegistrationControls({ exchangeId, status, participants }: Props) {
  const hydrated = useHydrated()
  const router = useRouter()
  const celebrateBadge = useDrawCelebration()
  const activation = useRef<{ pointer: boolean; target: HTMLElement } | null>(null)
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null)
  if (status !== "open" && status !== "closed") return null

  const missing: string[] = []
  if (status === "open") missing.push("Close registration before starting the Draw.")
  if (participants.length < 3) missing.push(`At least 3 Participants are needed (${participants.length} joined).`)
  const notReady = participants.filter((person) => !person.ready)
  if (notReady.length > 0) missing.push(`Not Ready: ${notReady.map((person) => person.displayName).join(", ")}.`)

  async function runDraw() {
    setFeedback(null)
    let result
    try {
      result = await drawAction(exchangeId)
    } catch {
      const message = "Couldn't run the Draw. Please try again."
      setFeedback({ error: true, message })
      throw new Error(message)
    }
    if (!result.ok) {
      setFeedback({ error: true, message: result.message })
      throw new Error(result.message)
    }
    if (activation.current?.pointer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      celebrate(activation.current.target)
      celebrateBadge()
    }
    router.refresh()
  }

  function rememberActivation(event: MouseEvent<HTMLElement>) {
    activation.current = { pointer: event.detail !== 0, target: event.currentTarget }
  }

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
      <Button disabled={!hydrated} className="self-start" onClick={changeRegistration} pendingAnnouncement="Changing registration">
        {status === "open" ? "Close registration" : "Reopen registration"}
      </Button>
      <p role="status" className={feedback?.error ? "text-cranberry" : "text-pine"}>{feedback?.message}</p>
      <div id="draw-requirements" className="flex flex-col gap-2 text-muted-ink">
        {missing.length > 0 ? (
          <ul className="flex list-inside list-disc flex-col gap-2">
            {missing.map((reason) => <li key={reason} className="[overflow-wrap:anywhere]">{reason}</li>)}
          </ul>
        ) : <p>Everyone is Ready. You can start the Draw.</p>}
      </div>
      <AlertDialog pendingAnnouncement="Running the Draw">
        <AlertDialogTrigger render={<Button disabled={!hydrated || missing.length > 0} focusableWhenDisabled={hydrated} aria-describedby="draw-requirements" className="self-start" />}>Start Draw</AlertDialogTrigger>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogTitle className="font-display text-xl">Draw for {participants.length} participants?</AlertDialogTitle>
          <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          <p role="alert" className="text-cranberry">{feedback?.error ? feedback.message : null}</p>
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialogClose render={<Button />}>Cancel</AlertDialogClose>
            <AlertDialogClose value="confirm" action={runDraw} render={<Button data-variant="solid" onClickCapture={rememberActivation} />}>Draw now</AlertDialogClose>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
