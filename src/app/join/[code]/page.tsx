import Link from "next/link"
import { EventDetailsList } from "@/components/event-details-list"
import { lookupByAccessCode } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"
import { JoinCodeForm } from "../join-code-form"
import { JoinForm } from "./join-form"

export const metadata = { title: "Join an Exchange · Gift Exchange" }

export default async function JoinExchangePage({ params }: PageProps<"/join/[code]">) {
  const code = decode((await params).code)
  const preview = await lookupByAccessCode(code)

  if (!preview.ok) {
    return (
      <Page>
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Join an Exchange</h1>
          <p className="text-muted-ink">Enter the Access Code from your Host to see the Exchange before you join.</p>
        </header>
        <JoinCodeForm code={code} error="There's no Exchange with that code. Check it with your Host." />
      </Page>
    )
  }

  const exchange = preview.value
  const locale = await requestLocale()
  const refusal =
    exchange.status !== "open"
      ? "Registration for this Exchange is closed. Talk to your Host if you should be in it."
      : exchange.full
        ? "This Exchange is full. Talk to your Host if you should be in it."
        : null

  return (
    <Page>
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">You&apos;re invited to</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{exchange.name}</h1>
        <p className="font-mono text-sm tracking-[0.12em] text-muted-ink">{exchange.accessCode}</p>
      </header>
      <section aria-labelledby="event" className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 id="event" className="font-display text-xl text-ink">
          Event Details
        </h2>
        <EventDetailsList details={exchange.eventDetails} locale={locale} />
      </section>
      {refusal ? (
        <p className="rounded-lg bg-cranberry/10 px-4 py-3 text-cranberry">{refusal}</p>
      ) : (
        <JoinForm accessCode={exchange.accessCode} />
      )}
    </Page>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-8 sm:py-12">
      <Link href="/" className="text-sm font-semibold text-pine underline-offset-4 hover:underline">
        ← Gift Exchange
      </Link>
      {children}
    </main>
  )
}

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
