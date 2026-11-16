"use client"

import { Button } from "@ui-sdk/react/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react/number-input"
import { useState, type FormEvent } from "react"
import { EventDetailsFields, FormSection, readEventDetails, TextField } from "@/components/event-details-fields"
import { LIMITS, validateExchangeDetails, type ExchangeDetailsInput } from "@/lib/exchange-details"
import { createExchangeAction } from "./actions"
import { SaveHostLink } from "./save-host-link"

type Created = { accessCode: string; hostToken: string }

export function CreateExchangeForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [created, setCreated] = useState<Created | null>(null)

  if (created) return <SaveHostLink {...created} />

  function clear(field: string) {
    if (!errors[field]) return
    setErrors((previous) => {
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input: ExchangeDetailsInput = {
      name: String(data.get("name") ?? ""),
      maxParticipants: Number(data.get("maxParticipants") ?? ""),
      ...readEventDetails(data),
    }
    const checked = validateExchangeDetails(input)
    if (!checked.ok) {
      setErrors(checked.fields)
      return
    }
    setPending(true)
    setMessage("")
    try {
      const result = await createExchangeAction(input)
      if (result.ok) setCreated(result)
      else {
        setErrors(result.fields)
        setMessage(result.message ?? "")
      }
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8">
      <FormSection title="The Exchange">
        <TextField name="name" label="Exchange name" maxLength={LIMITS.name} error={errors.name} onEdit={clear}
          description="Something your friends will recognise, like “Office Secret Santa”." />
        <Field name="maxParticipants" invalid={errors.maxParticipants ? true : undefined}>
          <NumberInput defaultValue={10} min={LIMITS.minParticipants} max={LIMITS.maxParticipants} step={1}
            onValueChange={() => clear("maxParticipants")}>
            <FieldLabel>Maximum Participants</FieldLabel>
            <NumberInputGroup>
              <NumberInputDecrement aria-label="Fewer Participants" />
              <NumberInputControl />
              <NumberInputIncrement aria-label="More Participants" />
            </NumberInputGroup>
          </NumberInput>
          <FieldDescription>Between 3 and 50 people.</FieldDescription>
          {errors.maxParticipants && <FieldError match>{errors.maxParticipants}</FieldError>}
        </Field>
      </FormSection>

      <EventDetailsFields errors={errors} onEdit={clear} />

      {message && (
        <p role="alert" className="rounded-lg bg-cranberry/10 px-4 py-3 text-cranberry">
          {message}
        </p>
      )}

      <Button type="submit" data-variant="solid" disabled={pending} focusableWhenDisabled className="self-start">
        {pending ? "Creating…" : "Create Exchange"}
      </Button>
    </form>
  )
}
