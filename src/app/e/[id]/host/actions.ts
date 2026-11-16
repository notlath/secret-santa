"use server"

import { cookies } from "next/headers"
import type { EventDetailsInput } from "@/lib/exchange-details"
import { hostCookieName } from "@/server/credentials"
import { closeRegistration, draw, reopenRegistration, updateEventDetails } from "@/server/exchange"

export type UpdateEventDetailsState = { ok: true } | { ok: false; fields: Record<string, string>; message?: string }

export async function updateEventDetailsAction(
  exchangeId: string,
  input: EventDetailsInput,
): Promise<UpdateEventDetailsState> {
  const token = (await cookies()).get(hostCookieName(exchangeId))?.value
  const result = await updateEventDetails(token, input)
  if (result.ok) return { ok: true }
  switch (result.error.code) {
    case "validation":
      return { ok: false, fields: result.error.fields }
    case "invalid_credential":
      return { ok: false, fields: {}, message: "This device no longer has the Host Link. Open it again to edit." }
    case "invalid_transition":
      return { ok: false, fields: {}, message: "The Exchange is completed, so its Event Details can't change." }
    default:
      return { ok: false, fields: {}, message: "Something went wrong. Please try again." }
  }
}

export async function changeRegistrationAction(
  exchangeId: string,
  operation: "close" | "reopen",
): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = (await cookies()).get(hostCookieName(exchangeId))?.value
  const result = await (operation === "close" ? closeRegistration(token) : reopenRegistration(token))
  if (result.ok) return { ok: true }
  if (result.error.code === "invalid_credential") {
    return { ok: false, message: "This device no longer has the Host Link. Open it again to manage registration." }
  }
  return { ok: false, message: "Registration has changed. Refresh the page to see its current Status." }
}

export async function drawAction(exchangeId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = (await cookies()).get(hostCookieName(exchangeId))?.value
  const result = await draw(token)
  if (result.ok) return { ok: true }
  switch (result.error.code) {
    case "invalid_credential": return { ok: false, message: "Open your Host Link again to run the Draw." }
    case "already_drawn": return { ok: false, message: "This Exchange has already drawn. Refresh to see the result." }
    case "too_few_participants": return { ok: false, message: "At least 3 Participants are needed for the Draw." }
    case "not_everyone_ready": return { ok: false, message: "Everyone must be Ready before the Draw. Refresh to see who is missing." }
    default: return { ok: false, message: "Close registration before starting the Draw." }
  }
}
