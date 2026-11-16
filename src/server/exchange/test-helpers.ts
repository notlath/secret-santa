import { eq } from "drizzle-orm"
import { db } from "@/server/db"
import { exchange } from "@/server/db/schema"
import { createExchange, join, type ExchangeDetailsInput, type ExchangeStatus } from "."

// Until the Host operations that change Status exist, tests set it directly.
export async function setStatus(exchangeId: string, status: ExchangeStatus) {
  await db.update(exchange).set({ status }).where(eq(exchange.id, exchangeId))
}

export function details(overrides: Partial<ExchangeDetailsInput> = {}): ExchangeDetailsInput {
  return {
    name: "Office Secret Santa",
    maxParticipants: 10,
    eventDate: "2026-12-18",
    eventTime: "19:30",
    location: "Mia's flat",
    budgetAmount: "25.50",
    budgetCurrency: "EUR",
    description: "Bring something cosy",
    instructions: "No gift cards",
    notes: "Ugly sweaters welcome",
    ...overrides,
  }
}

export async function created(overrides: Partial<ExchangeDetailsInput> = {}) {
  const result = await createExchange(details(overrides))
  if (!result.ok) throw new Error(`createExchange failed: ${JSON.stringify(result.error)}`)
  return result.value
}

export async function joined(accessCode: string, displayName: string) {
  const result = await join(accessCode, displayName)
  if (!result.ok) throw new Error(`join failed: ${JSON.stringify(result.error)}`)
  return result.value
}
