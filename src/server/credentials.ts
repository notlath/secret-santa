import "server-only"
import { createHash, randomBytes } from "node:crypto"
import type { DeviceCredential } from "@/server/exchange"

export function generateLinkToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashLinkToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function hostCookieName(exchangeId: string): string {
  return `gx_host_${exchangeId}`
}

export const linkCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
} as const

export function personalCookieName(exchangeId: string): string {
  return `gx_p_${exchangeId}`
}

const linkCookiePattern = /^gx_(host|p)_(.+)$/

export function deviceCredentials(cookies: { name: string; value: string }[]): DeviceCredential[] {
  return cookies.flatMap(({ name, value }): DeviceCredential[] => {
    const match = linkCookiePattern.exec(name)
    if (!match || !value) return []
    return [{ role: match[1] === "host" ? "host" : "participant", exchangeId: match[2], token: value }]
  })
}
