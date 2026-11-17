"use client"

import { DateInput } from "@ui-sdk/react/date-input"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import { NumberInput, NumberInputControl, NumberInputGroup } from "@ui-sdk/react/number-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-sdk/react/select"
import { Textarea } from "@ui-sdk/react/textarea"
import { TimeInput } from "@ui-sdk/react/time-input"
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react"
import { currencyForLocale, currencyOptions } from "@/lib/currency"
import { LIMITS, type EventDetailsInput, type EventDetailsValues } from "@/lib/exchange-details"

const noSubscription = () => () => {}

type Props = {
  errors: Record<string, string>
  onEdit: (field: string) => void
  defaults?: EventDetailsValues
}

export function EventDetailsFields({ errors, onEdit, defaults }: Props) {
  const [chosenCurrency, setCurrency] = useState<string | null>(defaults?.budgetCurrency ?? null)
  const localeCurrency = useSyncExternalStore(noSubscription, () => currencyForLocale(navigator.language), () => "USD")
  const currency = chosenCurrency ?? localeCurrency
  const currencies = useMemo(() => currencyOptions("en"), [])
  const budget = defaults?.budgetAmount ? Number(defaults.budgetAmount) : undefined

  return (
    <>
      <FormSection title="The meetup">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="eventDate" invalid={errors.eventDate ? true : undefined}>
            <FieldLabel>Date</FieldLabel>
            <DateInput defaultValue={defaults?.eventDate} onValueChange={() => onEdit("eventDate")} />
            {errors.eventDate && <FieldError match>{errors.eventDate}</FieldError>}
          </Field>
          <Field name="eventTime" invalid={errors.eventTime ? true : undefined}>
            <FieldLabel>Time</FieldLabel>
            <TimeInput defaultValue={defaults?.eventTime} onValueChange={() => onEdit("eventTime")} />
            {errors.eventTime && <FieldError match>{errors.eventTime}</FieldError>}
          </Field>
        </div>
        <TextField name="location" label="Location" maxLength={LIMITS.location} error={errors.location} onEdit={onEdit}
          defaultValue={defaults?.location} description="Where the gifts are handed over." />
        <div className="grid grid-cols-[1fr_minmax(0,1.3fr)] gap-4">
          <Field name="budgetAmount" invalid={errors.budgetAmount ? true : undefined}>
            <NumberInput defaultValue={budget} min={0} step={0.01} onValueChange={() => onEdit("budgetAmount")}>
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
              onEdit("budgetCurrency")
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
      </FormSection>

      <FormSection title="Anything else?">
        <LongTextField name="description" label="Description" error={errors.description} onEdit={onEdit}
          defaultValue={defaults?.description} />
        <LongTextField name="instructions" label="Instructions" error={errors.instructions} onEdit={onEdit}
          defaultValue={defaults?.instructions} description="For example: no gift cards, wrap it in newspaper." />
        <LongTextField name="notes" label="Notes" error={errors.notes} onEdit={onEdit} defaultValue={defaults?.notes} />
      </FormSection>
    </>
  )
}

export function readEventDetails(data: FormData): EventDetailsInput {
  const text = (key: string) => String(data.get(key) ?? "")
  return {
    eventDate: text("eventDate"),
    eventTime: text("eventTime"),
    location: text("location"),
    budgetAmount: text("budgetAmount"),
    budgetCurrency: text("budgetCurrency"),
    description: text("description"),
    instructions: text("instructions"),
    notes: text("notes"),
  }
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
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
  defaultValue?: string | null
  onEdit: (name: string) => void
}

export function TextField({ name, label, error, description, maxLength, defaultValue, onEdit }: TextFieldProps) {
  return (
    <Field name={name} invalid={error ? true : undefined}>
      <FieldLabel>{label}</FieldLabel>
      <Input maxLength={maxLength} defaultValue={defaultValue ?? undefined} onValueChange={() => onEdit(name)} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError match>{error}</FieldError>}
    </Field>
  )
}

function LongTextField({ name, label, error, description, defaultValue, onEdit }: Omit<TextFieldProps, "maxLength">) {
  return (
    <Field name={name} invalid={error ? true : undefined}>
      <FieldLabel>
        {label} <span className="font-normal text-muted-ink">(optional)</span>
      </FieldLabel>
      <Textarea maxLength={LIMITS.longText} defaultValue={defaultValue ?? undefined} onValueChange={() => onEdit(name)} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError match>{error}</FieldError>}
    </Field>
  )
}
