"use server"

import { cookies } from "next/headers"
import { linkCookieOptions, personalCookieName } from "@/server/credentials"
import { join } from "@/server/exchange"

export type JoinState =
  | { ok: true; personalToken: string }
  | { ok: false; fields: Record<string, string>; message?: string }

export async function joinAction(accessCode: string, displayName: string): Promise<JoinState> {
  const result = await join(accessCode, displayName)
  if (result.ok) {
    ;(await cookies()).set(personalCookieName(result.value.exchangeId), result.value.personalToken, linkCookieOptions)
    return { ok: true, personalToken: result.value.personalToken }
  }
  switch (result.error.code) {
    case "validation":
      return { ok: false, fields: result.error.fields }
    case "display_name_taken":
      return { ok: false, fields: { displayName: "Someone already has that name. Pick another one." } }
    case "exchange_full":
      return { ok: false, fields: {}, message: "This Exchange is full. Talk to your Host if you should be in it." }
    case "invalid_transition":
      return { ok: false, fields: {}, message: "Registration for this Exchange is closed. Talk to your Host." }
    case "not_found":
      return { ok: false, fields: {}, message: "This Exchange no longer exists. Check the code with your Host." }
    default:
      return { ok: false, fields: {}, message: "Something went wrong. Please try again." }
  }
}
