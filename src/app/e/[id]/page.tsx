import { cookies } from "next/headers"
import { CopyButton } from "@/components/copy-button"
import { EventDetailsList } from "@/components/event-details-list"
import { Explanation } from "@/components/explanation"
import { RoleSwitcher } from "@/components/role-switcher"
import { StatusBadge } from "@/components/status-badge"
import { personalCookieName } from "@/server/credentials"
import { participantView } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"

export const metadata = { title: "My Exchange · Gift Exchange" }

export default async function ParticipantPage({ params }: PageProps<"/e/[id]">) {
  const { id } = await params
  const token = (await cookies()).get(personalCookieName(id))?.value
  const view = await participantView(token)
  if (!token || !view.ok || view.value.id !== id) {
    return (
      <Explanation title="You need your Personal Link">
        <p>Open the Personal Link you saved when you joined, and this device will remember you.</p>
      </Explanation>
    )
  }

  const exchange = view.value
  const locale = await requestLocale()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <RoleSwitcher exchangeId={id} current="participant" />
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">You&apos;re in as {exchange.me.displayName}</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{exchange.name}</h1>
        <StatusBadge status={exchange.status} />
      </header>

      <section aria-labelledby="event" className="flex flex-col gap-4">
        <h2 id="event" className="font-display text-xl text-ink">
          Event Details
        </h2>
        <EventDetailsList details={exchange.eventDetails} locale={locale} />
      </section>

      <section aria-labelledby="link" className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 sm:p-6">
        <h2 id="link" className="font-display text-xl text-ink">
          Your Personal Link
        </h2>
        <p className="text-muted-ink">
          Open it on another device to pick up where you left off. Keep it to yourself: whoever has it can act as you.
        </p>
        <CopyButton path={`/p/${token}`}>Copy my personal link</CopyButton>
      </section>
    </main>
  )
}
