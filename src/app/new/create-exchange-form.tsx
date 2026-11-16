"use client"

import { Button } from "@ui-sdk/react/button"
import { DateInput } from "@ui-sdk/react/date-input"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "@ui-sdk/react/number-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-sdk/react/select"
import { Textarea } from "@ui-sdk/react/textarea"
import { TimeInput } from "@ui-sdk/react/time-input"
import { useMemo, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react"
import { currencyForLocale, currencyOptions } from "@/lib/currency"
import { LIMITS, validateExchangeDetails, type ExchangeDetailsInput } from "@/lib/exchange-details"
import { createExchangeAction } from "./actions"
import { SaveHostLink } from "./save-host-link"

type Created = { accessCode: string; hostToken: string }

const noSubscription = () => () => {}

export function CreateExchangeForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [created, setCreated] = useState<Created | null>(null)
  const [chosenCurrency, setCurrency] = useState<string | null>(null)
  const localeCurrency = useSyncExternalStore(noSubscription, () => currencyForLocale(navigator.language), () => "USD")
  const currency = chosenCurrency ?? localeCurrency
  const currencies = useMemo(() => currencyOptions("en"), [])

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
    const text = (key: string) => String(data.get(key) ?? "")
    const input: ExchangeDetailsInput = {
      name: text("name"),
      maxParticipants: Number(text("maxParticipants")),
      eventDate: text("eventDate"),
      eventTime: text("eventTime"),
      location: text("location"),
      budgetAmount: text("budgetAmount"),
      budgetCurrency: text("budgetCurrency"),
      description: text("description"),
      instructions: text("instructions"),
      notes: text("notes"),
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
      <Section title="The Exchange">
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
      </Section>

      <Section title="The meetup">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="eventDate" invalid={errors.eventDate ? true : undefined}>
            <FieldLabel>Date</FieldLabel>
            <DateInput onValueChange={() => clear("eventDate")} />
            {errors.eventDate && <FieldError match>{errors.eventDate}</FieldError>}
          </Field>
          <Field name="eventTime" invalid={errors.eventTime ? true : undefined}>
            <FieldLabel>Time</FieldLabel>
            <TimeInput onValueChange={() => clear("eventTime")} />
            {errors.eventTime && <FieldError match>{errors.eventTime}</FieldError>}
          </Field>
        </div>
        <TextField name="location" label="Location" maxLength={LIMITS.location} error={errors.location} onEdit={clear}
          description="Where the gifts are handed over." />
        <div className="grid grid-cols-[1fr_minmax(0,1.3fr)] gap-4">
          <Field name="budgetAmount" invalid={errors.budgetAmount ? true : undefined}>
            <NumberInput min={0} step={0.01} onValueChange={() => clear("budgetAmount")}>
              <FieldLabel>Budget</FieldLabel>
              <NumberInputGroup className="w-full">
                <NumberInputControl placeholder="Optional" className="m-0 h-11 w-full rounded-[var(--ui-radius)] px-3 text-left" />
              </NumberInputGroup>
            </NumberInput>
            {errors.budgetAmount && <FieldError match>{errors.budgetAmount}</FieldError>}
          </Field>
          <Field name="budgetCurrency" invalid={errors.budgetCurrency ? true : undefined}>
            <FieldLabel>Currency</FieldLabel>
            <Select items={currencies} value={currency} onValueChange={(value) => {
              setCurrency(value as string | null)
              clear("budgetCurrency")
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.budgetCurrency && <FieldError match>{errors.budgetCurrency}</FieldError>}
          </Field>
        </div>
      </Section>

      <Section title="Anything else?">
        <LongTextField name="description" label="Description" error={errors.description} onEdit={clear} />
        <LongTextField name="instructions" label="Instructions" error={errors.instructions} onEdit={clear}
          description="For example: no gift cards, wrap it in newspaper." />
        <LongTextField name="notes" label="Notes" error={errors.notes} onEdit={clear} />
      </Section>

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-4 font-display text-xl text-ink">{title}</legend>
      {children}
    </fieldset>
  )
}

type TextFieldProps = {
  name: string
  label: string
  error?: string
  description?: string
  maxLength?: number
  onEdit: (name: string) => void
}

function TextField({ name, label, error, description, maxLength, onEdit }: TextFieldProps) {
  return (
    <Field name={name} invalid={error ? true : undefined}>
      <FieldLabel>{label}</FieldLabel>
      <Input maxLength={maxLength} onValueChange={() => onEdit(name)} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError match>{error}</FieldError>}
    </Field>
  )
}

function LongTextField({ name, label, error, description, onEdit }: Omit<TextFieldProps, "maxLength">) {
  return (
    <Field name={name} invalid={error ? true : undefined}>
      <FieldLabel>
        {label} <span className="font-normal text-muted-ink">(optional)</span>
      </FieldLabel>
      <Textarea maxLength={LIMITS.longText} onValueChange={() => onEdit(name)} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError match>{error}</FieldError>}
    </Field>
  )
}
