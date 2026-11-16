import "server-only"
import { and, asc, eq, ne } from "drizzle-orm"
import { formatAccessCode, generateAccessCode, normalizeAccessCode } from "@/lib/access-code"
import { normalizeDisplayName, validateDisplayName } from "@/lib/display-name"
import {
  validateEventDetails,
  validateExchangeDetails,
  type EventDetailsInput,
  type ExchangeDetailsInput,
} from "@/lib/exchange-details"
import { generateLinkToken, hashLinkToken } from "@/server/credentials"
import { db } from "@/server/db"
import { exchange, participant } from "@/server/db/schema"
import { fail, ok, type Result } from "./errors"

export type { ExchangeError, Result } from "./errors"
export type { EventDetailsInput, ExchangeDetailsInput } from "@/lib/exchange-details"

export type ExchangeStatus = "open" | "closed" | "assigned" | "completed"

export type EventDetails = {
  eventDate: string
  eventTime: string
  location: string
  budgetAmount: string | null
  budgetCurrency: string | null
  description: string | null
  instructions: string | null
  notes: string | null
}

export type HostView = {
  id: string
  name: string
  status: ExchangeStatus
  accessCode: string
  maxParticipants: number
  eventDetails: EventDetails
  participants: { id: string; displayName: string }[]
}

export type ExchangePreview = {
  name: string
  accessCode: string
  status: ExchangeStatus
  full: boolean
  eventDetails: EventDetails
}

export type ParticipantView = {
  id: string
  name: string
  status: ExchangeStatus
  me: { id: string; displayName: string }
  eventDetails: EventDetails
}

type ExchangeRow = typeof exchange.$inferSelect

export async function createExchange(
  input: ExchangeDetailsInput,
): Promise<Result<{ exchange: { id: string }; accessCode: string; hostToken: string }>> {
  const validated = validateExchangeDetails(input)
  if (!validated.ok) return fail({ code: "validation", fields: validated.fields })
  const hostToken = generateLinkToken()
  for (;;) {
    const accessCode = generateAccessCode()
    try {
      const [row] = await db
        .insert(exchange)
        .values({
          ...validated.value,
          accessCode,
          hostTokenHash: hashLinkToken(hostToken),
        })
        .returning({ id: exchange.id })
      return ok({ exchange: { id: row.id }, accessCode: formatAccessCode(accessCode), hostToken })
    } catch (error) {
      if (!isUniqueViolation(error, "exchange_access_code_unique")) throw error
    }
  }
}

export async function hostView(hostToken: string | undefined): Promise<Result<HostView>> {
  const row = await findByHostToken(hostToken)
  if (!row) return fail({ code: "invalid_credential" })
  return ok({
    id: row.id,
    name: row.name,
    status: row.status,
    accessCode: formatAccessCode(row.accessCode),
    maxParticipants: row.maxParticipants,
    eventDetails: eventDetailsOf(row),
    participants: await db
      .select({ id: participant.id, displayName: participant.displayName })
      .from(participant)
      .where(eq(participant.exchangeId, row.id))
      .orderBy(asc(participant.createdAt), asc(participant.id)),
  })
}

// Event Details live on the Exchange row only, so an edit never touches Assignments.
export async function updateEventDetails(
  hostToken: string | undefined,
  input: EventDetailsInput,
): Promise<Result<{ eventDetails: EventDetails }>> {
  const current = await findByHostToken(hostToken)
  if (!current) return fail({ code: "invalid_credential" })
  const validated = validateEventDetails(input)
  if (!validated.ok) return fail({ code: "validation", fields: validated.fields })
  // The status check sits in the update itself, so a Completed mark that lands meanwhile still wins.
  const [row] = await db
    .update(exchange)
    .set({ ...validated.value, updatedAt: new Date() })
    .where(and(eq(exchange.id, current.id), ne(exchange.status, "completed")))
    .returning()
  if (!row) return fail({ code: "invalid_transition" })
  return ok({ eventDetails: eventDetailsOf(row) })
}

export async function join(
  accessCode: string,
  displayName: string,
): Promise<Result<{ exchangeId: string; participant: { id: string; displayName: string }; personalToken: string }>> {
  const name = validateDisplayName(displayName)
  if (!name.ok) return fail({ code: "validation", fields: { displayName: name.error } })
  const personalToken = generateLinkToken()
  return db.transaction(async (tx) => {
    // Locking the Exchange row serialises joins, so the count below can't go stale before the insert.
    const [row] = await tx
      .select({ id: exchange.id, status: exchange.status, maxParticipants: exchange.maxParticipants })
      .from(exchange)
      .where(eq(exchange.accessCode, normalizeAccessCode(accessCode)))
      .for("update")
    if (!row) return fail({ code: "not_found" })
    if (row.status !== "open") return fail({ code: "invalid_transition" })
    if ((await countParticipants(tx, row.id)) >= row.maxParticipants) return fail({ code: "exchange_full" })
    const [inserted] = await tx
      .insert(participant)
      .values({
        exchangeId: row.id,
        displayName: name.value,
        normalizedDisplayName: normalizeDisplayName(name.value),
        personalTokenHash: hashLinkToken(personalToken),
      })
      .onConflictDoNothing({ target: [participant.exchangeId, participant.normalizedDisplayName] })
      .returning({ id: participant.id, displayName: participant.displayName })
    if (!inserted) return fail({ code: "display_name_taken" })
    return ok({ exchangeId: row.id, participant: inserted, personalToken })
  })
}

export async function lookupByAccessCode(accessCode: string): Promise<Result<ExchangePreview>> {
  const [row] = await db
    .select()
    .from(exchange)
    .where(eq(exchange.accessCode, normalizeAccessCode(accessCode)))
  if (!row) return fail({ code: "not_found" })
  return ok({
    name: row.name,
    accessCode: formatAccessCode(row.accessCode),
    status: row.status,
    full: (await countParticipants(db, row.id)) >= row.maxParticipants,
    eventDetails: eventDetailsOf(row),
  })
}

export async function participantView(personalToken: string | undefined): Promise<Result<ParticipantView>> {
  if (!personalToken) return fail({ code: "invalid_credential" })
  const [row] = await db
    .select({ exchange, me: { id: participant.id, displayName: participant.displayName } })
    .from(participant)
    .innerJoin(exchange, eq(exchange.id, participant.exchangeId))
    .where(eq(participant.personalTokenHash, hashLinkToken(personalToken)))
  if (!row) return fail({ code: "invalid_credential" })
  return ok({
    id: row.exchange.id,
    name: row.exchange.name,
    status: row.exchange.status,
    me: row.me,
    eventDetails: eventDetailsOf(row.exchange),
  })
}

async function countParticipants(executor: Pick<typeof db, "$count">, exchangeId: string): Promise<number> {
  return executor.$count(participant, eq(participant.exchangeId, exchangeId))
}

async function findByHostToken(hostToken: string | undefined): Promise<ExchangeRow | undefined> {
  if (!hostToken) return undefined
  const [row] = await db
    .select()
    .from(exchange)
    .where(eq(exchange.hostTokenHash, hashLinkToken(hostToken)))
  return row
}

function eventDetailsOf(row: ExchangeRow): EventDetails {
  return {
    eventDate: row.eventDate,
    eventTime: row.eventTime.slice(0, 5),
    location: row.location,
    budgetAmount: row.budgetAmount,
    budgetCurrency: row.budgetCurrency,
    description: row.description,
    instructions: row.instructions,
    notes: row.notes,
  }
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const pgError = (error as { cause?: unknown })?.cause ?? error
  const { code, constraint_name } = (pgError ?? {}) as { code?: string; constraint_name?: string }
  return code === "23505" && constraint_name === constraint
}
