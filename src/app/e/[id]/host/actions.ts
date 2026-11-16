"use server"

import { cookies } from "next/headers"
import type { EventDetailsInput } from "@/lib/exchange-details"
import { hostCookieName } from "@/server/credentials"
import { updateEventDetails } from "@/server/exchange"

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
