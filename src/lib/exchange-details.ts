// Shared by the Exchange module (the authority) and the create form (instant feedback).

// Event Details are the part of an Exchange the Host can edit after creating it.
export type EventDetailsInput = {
  eventDate: string
  eventTime: string
  location: string
  budgetAmount?: string | null
  budgetCurrency?: string | null
  description?: string | null
  instructions?: string | null
  notes?: string | null
}

export type ExchangeDetailsInput = EventDetailsInput & {
  name: string
  maxParticipants: number
}

export type EventDetailsValues = {
  eventDate: string
  eventTime: string
  location: string
  budgetAmount: string | null
  budgetCurrency: string | null
  description: string | null
  instructions: string | null
  notes: string | null
}

export type ExchangeDetails = EventDetailsValues & {
  name: string
  maxParticipants: number
}

export type FieldErrors = Record<string, string>

export const LIMITS = {
  name: 60,
  location: 120,
  longText: 1000,
  minParticipants: 3,
  maxParticipants: 50,
} as const

export function validateExchangeDetails(
  input: ExchangeDetailsInput,
): { ok: true; value: ExchangeDetails } | { ok: false; fields: FieldErrors } {
  const fields: FieldErrors = {}
  const name = input.name.trim()
  if (!name) fields.name = "Give the Exchange a name."
  else if (name.length > LIMITS.name) fields.name = `Keep the name to ${LIMITS.name} characters.`

  const max = input.maxParticipants
  if (!Number.isInteger(max) || max < LIMITS.minParticipants || max > LIMITS.maxParticipants)
    fields.maxParticipants = `Choose between ${LIMITS.minParticipants} and ${LIMITS.maxParticipants} Participants.`

  const event = validateEventDetails(input)
  if (!event.ok) Object.assign(fields, event.fields)
  if (!event.ok || Object.keys(fields).length > 0) return { ok: false, fields }
  return { ok: true, value: { name, maxParticipants: max, ...event.value } }
}

export function validateEventDetails(
  input: EventDetailsInput,
): { ok: true; value: EventDetailsValues } | { ok: false; fields: FieldErrors } {
  const fields: FieldErrors = {}
  const location = input.location.trim()
  const description = optionalText(input.description)
  const instructions = optionalText(input.instructions)
  const notes = optionalText(input.notes)
  const budgetAmount = optionalText(input.budgetAmount)
  const currency = optionalText(input.budgetCurrency)?.toUpperCase() ?? null

  if (!location) fields.location = "Say where the gifts are handed over."
  else if (location.length > LIMITS.location)
    fields.location = `Keep the location to ${LIMITS.location} characters.`

  if (!isCalendarDate(input.eventDate)) fields.eventDate = "Pick the date of the meetup."
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.eventTime)) fields.eventTime = "Pick the time of the meetup."

  if (budgetAmount !== null) {
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(budgetAmount) || Number(budgetAmount) <= 0)
      fields.budgetAmount = "Enter a positive amount with at most 2 decimals."
    if (!currency) fields.budgetCurrency = "Choose a currency for the budget."
  }
  if (currency !== null && !isCurrencyCode(currency)) fields.budgetCurrency = "Choose a valid currency."

  for (const [key, value] of [
    ["description", description],
    ["instructions", instructions],
    ["notes", notes],
  ] as const) {
    if (value && value.length > LIMITS.longText) fields[key] = `Keep this to ${LIMITS.longText} characters.`
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields }
  return {
    ok: true,
    value: {
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      location,
      budgetAmount,
      budgetCurrency: budgetAmount === null ? null : currency,
      description,
      instructions,
      notes,
    },
  }
}

function optionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export function isCurrencyCode(code: string): boolean {
  return Intl.supportedValuesOf("currency").includes(code)
}
