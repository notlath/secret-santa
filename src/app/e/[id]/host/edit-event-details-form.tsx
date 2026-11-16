"use client"

import { Button } from "@ui-sdk/react/button"
import { useState, useTransition, type FormEvent } from "react"
import { EventDetailsFields, readEventDetails } from "@/components/event-details-fields"
import { validateEventDetails, type EventDetailsValues } from "@/lib/exchange-details"
import { updateEventDetailsAction } from "./actions"

type Props = {
  exchangeId: string
  details: EventDetailsValues
  onSaved: () => void
  onCancel: () => void
}

export function EditEventDetailsForm({ exchangeId, details, onSaved, onCancel }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()

  function clear(field: string) {
    if (!errors[field]) return
    setErrors((previous) => {
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = readEventDetails(new FormData(event.currentTarget))
    const checked = validateEventDetails(input)
    if (!checked.ok) {
      setErrors(checked.fields)
      return
    }
    setMessage("")
    startTransition(async () => {
      try {
        const result = await updateEventDetailsAction(exchangeId, input)
        if (result.ok) onSaved()
        else {
          setErrors(result.fields)
          setMessage(result.message ?? "")
        }
      } catch {
        setMessage("We couldn't reach the server. Check your connection and try again.")
      }
    })
  }

  return (
    <form noValidate onSubmit={submit} aria-label="Edit Event Details" className="flex flex-col gap-8">
      <EventDetailsFields errors={errors} onEdit={clear} defaults={details} />
      {message && (
        <p role="alert" className="rounded-lg bg-cranberry/10 px-4 py-3 text-cranberry">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" data-variant="solid" disabled={pending} focusableWhenDisabled>
          {pending ? "Saving…" : "Save Event Details"}
        </Button>
        <Button type="button" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
