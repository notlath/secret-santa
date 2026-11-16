import { cookies } from "next/headers"
import { hostCookieName, personalCookieName } from "@/server/credentials"
import { hostView, participantView } from "@/server/exchange"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; role: string }> }) {
  const { id, role } = await params
  const jar = await cookies()
  const view = role === "host"
    ? await hostView(jar.get(hostCookieName(id))?.value)
    : role === "participant"
      ? await participantView(jar.get(personalCookieName(id))?.value)
      : null
  if (!view?.ok || view.value.id !== id) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } })
  return Response.json(view.value, { headers: { "Cache-Control": "no-store" } })
}
