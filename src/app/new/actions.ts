"use server"

import type { ExchangeDetailsInput } from "@/lib/exchange-details"
import { createExchange } from "@/server/exchange"

export type CreateExchangeState =
  | { ok: true; accessCode: string; hostToken: string }
  | { ok: false; fields: Record<string, string>; message?: string }

export async function createExchangeAction(input: ExchangeDetailsInput): Promise<CreateExchangeState> {
  const result = await createExchange(input)
  if (result.ok) return { ok: true, accessCode: result.value.accessCode, hostToken: result.value.hostToken }
  if (result.error.code === "validation") return { ok: false, fields: result.error.fields }
  return { ok: false, fields: {}, message: "Something went wrong. Please try again." }
}
