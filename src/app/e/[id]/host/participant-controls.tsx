"use client"

import { AlertDialog, AlertDialogTrigger, AlertDialogBackdrop, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogClose } from "@ui-sdk/react/alert-dialog"
import { Button } from "@ui-sdk/react/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CopyButton } from "@/components/copy-button"
import { useHydrated } from "@/hooks/use-hydrated"
import { manageParticipantAction } from "./actions"

export function ParticipantControls({ exchangeId, participantId, name }: { exchangeId: string; participantId: string; name: string }) {
  const hydrated = useHydrated()
  const router = useRouter()
  const [link, setLink] = useState<string>()
  const [message, setMessage] = useState("")

  async function manage(operation: "remove" | "reissue") {
    setMessage("")
    if (operation === "reissue") setLink(undefined)
    try {
      const result = await manageParticipantAction(exchangeId, participantId, operation)
      if (!result.ok) { setMessage(result.message); throw new Error(result.message) }
      if (result.personalToken) setLink(`${window.location.origin}/p/${result.personalToken}`)
      if (operation === "remove") router.refresh()
    } catch (error) {
      setMessage(operation === "reissue" ? "The link may have changed. Re-issue it again to get a working link." : "Couldn't remove this Participant. Please try again.")
      throw error
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button disabled={!hydrated} onClick={() => manage("reissue")} pendingAnnouncement="Creating a new Personal Link" aria-label={`Re-issue link for ${name}`}>Re-issue link</Button>
        <AlertDialog pendingAnnouncement="Removing Participant">
          <AlertDialogTrigger render={<Button disabled={!hydrated} aria-label={`Remove ${name}`} />}>Remove</AlertDialogTrigger>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogTitle className="font-display text-xl">Remove {name}?</AlertDialogTitle>
            <AlertDialogDescription>Their Wishlist will be deleted and their Personal Link will stop working.</AlertDialogDescription>
            <p role="alert" className="text-cranberry">{message}</p>
            <div className="flex flex-wrap justify-end gap-3">
              <AlertDialogClose render={<Button />}>Cancel</AlertDialogClose>
              <AlertDialogClose value="confirm" action={() => manage("remove")} render={<Button data-variant="solid" />}>Remove Participant</AlertDialogClose>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {link && <div className="flex flex-col gap-2"><p role="status">New Personal Link for {name}. The old link no longer works.</p><p className="break-all">{link}</p><CopyButton text={link}>Copy new Personal Link</CopyButton></div>}
      <p role="status" className="text-cranberry">{message}</p>
    </div>
  )
}
