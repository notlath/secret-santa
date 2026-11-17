import Link from "next/link"
import { cookies } from "next/headers"
import { deviceCredentials } from "@/server/credentials"
import { deviceExchanges, type DeviceRole } from "@/server/exchange"

export const ROLE_LINKS: { role: DeviceRole; label: string; path: (id: string) => string }[] = [
  { role: "host", label: "Host dashboard", path: (id) => `/e/${id}/host` },
  { role: "participant", label: "My exchange", path: (id) => `/e/${id}` },
]

export async function RoleSwitcher({ exchangeId, current }: { exchangeId: string; current: DeviceRole }) {
  const credentials = deviceCredentials((await cookies()).getAll()).filter((c) => c.exchangeId === exchangeId)
  const [entry] = await deviceExchanges(credentials)
  if (!entry || entry.roles.length < 2) return null

  return (
    <nav aria-label="Switch role" className="flex self-start rounded-full border border-line bg-paper p-1">
      {ROLE_LINKS.map(({ role, label, path }) => (
        <Link
          key={role}
          href={path(exchangeId)}
          aria-current={role === current ? "page" : undefined}
          className="rounded-full px-4 py-2 text-sm font-semibold text-muted-ink transition-[color,background-color] motion-safe:transition-[color,background-color,scale] duration-150 ease-out hover:text-ink motion-safe:active:scale-[0.97] aria-[current=page]:bg-pine aria-[current=page]:text-paper"
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
