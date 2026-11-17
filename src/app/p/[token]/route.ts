import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { linkCookieOptions, personalCookieName } from "@/server/credentials"
import { participantView } from "@/server/exchange"

export async function GET(request: NextRequest, { params }: RouteContext<"/p/[token]">) {
  const { token } = await params
  const view = await participantView(token)
  if (!view.ok) return NextResponse.redirect(new URL("/link-invalid", request.url), 303)

  ;(await cookies()).set(personalCookieName(view.value.id), token, linkCookieOptions)
  const arrival = request.nextUrl.searchParams.get("joined") === "1" ? "?joined=1" : ""
  return NextResponse.redirect(new URL(`/e/${view.value.id}${arrival}`, request.url), 303)
}
