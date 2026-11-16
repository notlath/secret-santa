import "server-only"
import { eq } from "drizzle-orm"
import { formatAccessCode, generateAccessCode } from "@/lib/access-code"
import { validateExchangeDetails, type ExchangeDetailsInput } from "@/lib/exchange-details"
import { generateLinkToken, hashLinkToken } from "@/server/credentials"
import { db } from "@/server/db"
import { exchange } from "@/server/db/schema"
import { fail, ok, type Result } from "./errors"

export type { ExchangeError, Result } from "./errors"
export type { ExchangeDetailsInput } from "@/lib/exchange-details"

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
  })
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
