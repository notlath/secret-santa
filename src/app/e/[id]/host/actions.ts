"use server"

import { cookies } from "next/headers"
import type { EventDetailsInput } from "@/lib/exchange-details"
import { hostCookieName } from "@/server/credentials"
import { closeRegistration, reopenRegistration, updateEventDetails } from "@/server/exchange"

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
