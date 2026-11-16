import "server-only"
import { headers } from "next/headers"

export async function requestLocale(): Promise<string> {
  const first = (await headers()).get("accept-language")?.split(",")[0]?.split(";")[0]?.trim()
  try {
    return first ? Intl.getCanonicalLocales(first)[0] : "en-US"
  } catch {
    return "en-US"
  }
}
