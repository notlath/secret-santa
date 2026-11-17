import { Button } from "@ui-sdk/react/button"
import { cookies } from "next/headers"
import Link from "next/link"
import { Snowfall } from "@/components/snowfall"
import { ROLE_LINKS } from "@/components/role-switcher"
import { deviceCredentials } from "@/server/credentials"
import { deviceExchanges } from "@/server/exchange"

export default async function Home({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams
  const remembered = await deviceExchanges(deviceCredentials((await cookies()).getAll()))

  return (
    <>
    <Snowfall />
    <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-8 px-4 pbs-12 pbe-24">
      {deleted === "1" && (
        <p role="status" className="rounded-lg bg-cream-deep px-4 py-3 text-ink">
          The Exchange was deleted, along with everything in it.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">Secret Santa, sorted</p>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">Gift Exchange</h1>
        <p className="text-lg text-muted-ink">
          Set up a Secret Santa, share a code with your friends, and let the Draw keep the secret. No accounts needed.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button data-variant="solid" render={<Link href="/new" />}>
          Create an Exchange
        </Button>
        <Button render={<Link href="/join" />}>Join an Exchange</Button>
      </div>

      {remembered.length > 0 && (
        <section aria-labelledby="remembered" className="flex flex-col gap-4">
          <h2 id="remembered" className="font-display text-xl text-ink">
            Your exchanges on this device
          </h2>
          <ul aria-labelledby="remembered" className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-paper">
            {remembered.map((exchange) => (
              <li key={exchange.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-ink">{exchange.name}</span>
                  <span className="text-sm text-muted-ink">{exchange.roles.map((role) => (role === "host" ? "Host" : "Participant")).join(" and ")}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {ROLE_LINKS.filter(({ role }) => exchange.roles.includes(role)).map(({ role, label, path }) => (
                    <Link
                      key={role}
                      href={path(exchange.id)}
                      className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
    </>
  )
}
