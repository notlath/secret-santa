"use server"

import { cookies } from "next/headers"
import { personalCookieName } from "@/server/credentials"
import { markRevealed } from "@/server/exchange"

export async function openRevealAction(exchangeId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = (await cookies()).get(personalCookieName(exchangeId))?.value
  const result = await markRevealed(token)
  if (result.ok) return { ok: true }
  return { ok: false, message: result.error.code === "invalid_credential"
    ? "Open your Personal Link again to see your Recipient."
    : "Your reveal isn't available yet. Refresh and try again." }
}
