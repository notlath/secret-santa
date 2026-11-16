"use client"

import { AlertDialog, AlertDialogTrigger, AlertDialogBackdrop, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogClose } from "@ui-sdk/react/alert-dialog"
import { Button } from "@ui-sdk/react/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import type { ExchangeStatus } from "@/server/exchange"
import { finishExchangeAction } from "./actions"

export function FinishControls({ exchangeId, status }: { exchangeId: string; status: ExchangeStatus }) {
  const hydrated = useHydrated()
  const router = useRouter()
  const [message, setMessage] = useState("")

  async function finish(operation: "complete" | "delete") {
    setMessage("")
    let result
    try {
      result = await finishExchangeAction(exchangeId, operation)
    } catch {
      const failure = operation === "complete" ? "Couldn't mark the Exchange completed. Please try again." : "Couldn't delete the Exchange. Please try again."
      setMessage(failure)
      throw new Error(failure)
    }
    if (!result.ok) { setMessage(result.message); throw new Error(result.message) }
    if (operation === "delete") router.replace("/")
    else router.refresh()
  }

  return (
    <section aria-labelledby="finish" className="flex flex-col gap-4">
      <h2 id="finish" className="font-display text-xl text-ink">Finish</h2>
      {status === "assigned" && (
        <>
          <p className="text-muted-ink">After the meetup, mark the Exchange completed. Everything becomes read-only, and everyone can still open their reveal.</p>
          <AlertDialog pendingAnnouncement="Marking the Exchange completed">
            <AlertDialogTrigger render={<Button disabled={!hydrated} className="self-start" />}>Mark completed</AlertDialogTrigger>
            <AlertDialogBackdrop />
            <AlertDialogContent>
              <AlertDialogTitle className="font-display text-xl">Mark this Exchange completed?</AlertDialogTitle>
              <AlertDialogDescription>Nothing can be edited afterwards. Reveals stay visible. This can&apos;t be undone.</AlertDialogDescription>
              <p role="alert" className="text-cranberry">{message}</p>
              <div className="flex flex-wrap justify-end gap-3">
                <AlertDialogClose render={<Button />}>Cancel</AlertDialogClose>
                <AlertDialogClose value="confirm" action={() => finish("complete")} render={<Button data-variant="solid" />}>Mark completed</AlertDialogClose>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      <p className="text-muted-ink">Deleting removes every name, Wishlist and Assignment, and all links stop working.</p>
      <AlertDialog pendingAnnouncement="Deleting the Exchange">
        <AlertDialogTrigger render={<Button disabled={!hydrated} className="self-start" />}>Delete Exchange</AlertDialogTrigger>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogTitle className="font-display text-xl">Delete this Exchange?</AlertDialogTitle>
          <AlertDialogDescription>All Participants, Wishlists and Assignments are removed and every link stops working. This can&apos;t be undone.</AlertDialogDescription>
          <p role="alert" className="text-cranberry">{message}</p>
          <div className="flex flex-wrap justify-end gap-3">
            <AlertDialogClose render={<Button />}>Cancel</AlertDialogClose>
            <AlertDialogClose value="confirm" action={() => finish("delete")} render={<Button data-variant="solid" />}>Delete everything</AlertDialogClose>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <p role="status" className="text-cranberry">{message}</p>
    </section>
  )
}
