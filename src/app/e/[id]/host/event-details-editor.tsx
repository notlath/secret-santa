"use client"

import { Button } from "@ui-sdk/react/button"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import type { EventDetailsValues } from "@/lib/exchange-details"

// The form pulls in every ui-sdk field; loading it on demand keeps the dashboard quick to become interactive.
const EditEventDetailsForm = dynamic(() => import("./edit-event-details-form").then((m) => m.EditEventDetailsForm), {
  loading: () => <p className="text-muted-ink">Loading the form…</p>,
})

type Props = {
  exchangeId: string
  details: EventDetailsValues
  editable: boolean
  children: ReactNode
}

export function EventDetailsEditor({ exchangeId, details, editable, children }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  if (editing) {
    return (
      <EditEventDetailsForm
        exchangeId={exchangeId}
        details={details}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          setSaved(true)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {children}
      {saved && (
        <p role="status" className="text-pine">
          Event Details saved. Everyone sees them next time they open the Exchange.
        </p>
      )}
      {editable && (
        <Button type="button" onClick={() => { setSaved(false); setEditing(true) }} className="self-start">
          Edit Event Details
        </Button>
      )}
    </div>
  )
}
