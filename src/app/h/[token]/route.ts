import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { hostCookieName, linkCookieOptions } from "@/server/credentials"
import { hostView } from "@/server/exchange"

export async function GET(request: NextRequest, { params }: RouteContext<"/h/[token]">) {
  const { token } = await params
  const view = await hostView(token)
  if (!view.ok) return NextResponse.redirect(new URL("/link-invalid", request.url), 303)

  ;(await cookies()).set(hostCookieName(view.value.id), token, linkCookieOptions)
  return NextResponse.redirect(new URL(`/e/${view.value.id}/host`, request.url), 303)
}
