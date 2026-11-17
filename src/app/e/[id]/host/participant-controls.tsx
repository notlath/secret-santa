"use client"

import { AlertDialog, AlertDialogTrigger, AlertDialogBackdrop, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogClose } from "@ui-sdk/react/alert-dialog"
import { Button } from "@ui-sdk/react/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CopyButton } from "@/components/copy-button"
import { useHydrated } from "@/hooks/use-hydrated"
import { manageParticipantAction } from "./actions"

export function ParticipantControls({ exchangeId, participantId, name, drawn, remaining }: { exchangeId: string; participantId: string; name: string; drawn: boolean; remaining: number }) {
  const hydrated = useHydrated()
  const router = useRouter()
  const [link, setLink] = useState<string>()
  const [messages, setMessages] = useState({ remove: "", reissue: "" })

  async function manage(operation: "remove" | "reissue") {
    setMessages((current) => ({ ...current, [operation]: "" }))
    if (operation === "reissue") setLink(undefined)
    try {
      const result = await manageParticipantAction(exchangeId, participantId, operation)
      if (!result.ok) { setMessages((current) => ({ ...current, [operation]: result.message })); throw new Error(result.message) }
      if (result.personalToken) setLink(`${window.location.origin}/p/${result.personalToken}`)
      if (operation === "remove") router.refresh()
    } catch (error) {
      const failure = operation === "reissue" ? "The link may have changed. Re-issue it again to get a working link." : "Couldn't remove this Participant. Please try again."
      setMessages((current) => ({ ...current, [operation]: failure }))
      throw error
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button disabled={!hydrated} onClick={() => manage("reissue")} pendingAnnouncement="Creating a new Personal Link" aria-label={`Re-issue link for ${name}`}>Re-issue link</Button>
        {(!drawn || remaining > 2) && (
          <AlertDialog pendingAnnouncement="Removing Participant">
            <AlertDialogTrigger render={<Button disabled={!hydrated} aria-label={`Remove ${name}`} />}>Remove</AlertDialogTrigger>
            <AlertDialogBackdrop />
            <AlertDialogContent>
              <AlertDialogTitle className="font-display text-xl">Remove {name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {drawn
                  ? "Their Personal Link will stop working. The person who was giving to them will give to their Recipient instead, and will open their reveal again."
                  : "Their Wishlist will be deleted and their Personal Link will stop working."}
              </AlertDialogDescription>
              {drawn && remaining === 3 && <p className="font-semibold text-cranberry">Only 2 left, both will know who has them.</p>}
              <p role="alert" className="text-cranberry">{messages.remove}</p>
              <div className="flex flex-wrap justify-end gap-3">
                <AlertDialogClose render={<Button />}>Cancel</AlertDialogClose>
                <AlertDialogClose value="confirm" action={() => manage("remove")} render={<Button data-variant="solid" />}>Remove Participant</AlertDialogClose>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {link && <div className="flex flex-col gap-2"><p role="status">New Personal Link for {name}. The old link no longer works.</p><p className="break-all">{link}</p><CopyButton text={link}>Copy new Personal Link</CopyButton></div>}
      <p role="status" className="text-cranberry">{messages.reissue}</p>
    </div>
  )
}
