import { cookies } from "next/headers"
import { EventDetailsList } from "@/components/event-details-list"
import { Explanation } from "@/components/explanation"
import { StatusBadge } from "@/components/status-badge"
import { hostCookieName, personalCookieName } from "@/server/credentials"
import { hostView, participantView } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"

export const metadata = { title: "Event Details · Gift Exchange" }

export default async function EventDetailsPage({ params }: PageProps<"/e/[id]/event">) {
  const { id } = await params
  const jar = await cookies()
  const asHost = await hostView(jar.get(hostCookieName(id))?.value)
  const asParticipant = asHost.ok ? undefined : await participantView(jar.get(personalCookieName(id))?.value)
  const view = asHost.ok ? asHost : asParticipant
  if (!view?.ok || view.value.id !== id) {
    if (jar.get(hostCookieName(id)) || jar.get(personalCookieName(id))) {
      return <Explanation title="This link no longer works"><p>Ask your Host for a new one.</p></Explanation>
    }
    return (
      <Explanation title="You need your link">
        <p>Open your Personal Link or Host Link on this device to see the Event Details.</p>
      </Explanation>
    )
  }

  const exchange = view.value
  const locale = await requestLocale()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">Event Details</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{exchange.name}</h1>
        <StatusBadge status={exchange.status} />
      </header>
      <EventDetailsList details={exchange.eventDetails} locale={locale} />
    </main>
  )
}
