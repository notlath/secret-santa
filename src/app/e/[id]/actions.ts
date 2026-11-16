"use server"

import { cookies } from "next/headers"
import { personalCookieName } from "@/server/credentials"
import { updateParticipant, type WishlistItemInput } from "@/server/exchange"

export type UpdateState = { ok: true } | { ok: false; fields: Record<string, string>; message?: string }

export async function updateParticipantAction(
  exchangeId: string,
  changes: { displayName?: string; wishlist?: WishlistItemInput[] },
): Promise<UpdateState> {
  const token = (await cookies()).get(personalCookieName(exchangeId))?.value
  const result = await updateParticipant(token, changes)
  if (result.ok) return { ok: true }
  switch (result.error.code) {
    case "validation":
      return { ok: false, fields: result.error.fields }
    case "display_name_taken":
      return { ok: false, fields: { displayName: "Someone already has that name. Pick another one." } }
    case "invalid_transition":
      return { ok: false, fields: {}, message: "The Draw has happened, so your Wishlist and name are locked." }
    case "invalid_credential":
      return { ok: false, fields: {}, message: "This link no longer works. Ask your Host for a new one." }
    default:
      return { ok: false, fields: {}, message: "Something went wrong. Please try again." }
  }
}
