import { cookies } from "next/headers"
import { CopyButton } from "@/components/copy-button"
import { EventDetailsList } from "@/components/event-details-list"
import { Explanation } from "@/components/explanation"
import { ReadyBadge } from "@/components/ready-badge"
import { ReadyMeter } from "@/components/ready-meter"
import { StatusBadge } from "@/components/status-badge"
import { hostCookieName } from "@/server/credentials"
import { hostView } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"

export const metadata = { title: "Host dashboard · Gift Exchange" }

export default async function HostDashboardPage({ params }: PageProps<"/e/[id]/host">) {
  const { id } = await params
  const token = (await cookies()).get(hostCookieName(id))?.value
  const view = await hostView(token)
  if (!view.ok || view.value.id !== id) {
    return (
      <Explanation title="You need the Host Link">
        <p>Only the Host can open this dashboard. Open your Host Link on this device to manage the Exchange.</p>
      </Explanation>
    )
  }

  const exchange = view.value
  const locale = await requestLocale()
  const joinPath = `/join/${exchange.accessCode}`
  const readyCount = exchange.participants.filter((participant) => participant.ready).length

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">Host dashboard</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{exchange.name}</h1>
        <StatusBadge status={exchange.status} />
      </header>

      <section aria-labelledby="invite" className="flex flex-col gap-4 rounded-2xl border-2 border-gold bg-paper p-5 sm:p-6">
        <h2 id="invite" className="font-display text-xl text-ink">
          Invite your friends
        </h2>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-ink">Access Code</p>
          <p data-testid="access-code" className="font-mono text-3xl font-semibold tracking-[0.12em] text-cranberry sm:text-4xl">
            {exchange.accessCode}
          </p>
        </div>
        <p className="text-muted-ink">
          Up to {exchange.maxParticipants} Participants. Paste the join link in your group chat so friends skip typing
          the code.
        </p>
        <CopyButton path={joinPath}>Copy join link</CopyButton>
      </section>

      <section aria-labelledby="participants" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="participants" className="font-display text-xl text-ink">
            Participants
          </h2>
          <p className="text-sm tabular-nums text-muted-ink">
            {exchange.participants.length} of {exchange.maxParticipants}
          </p>
        </div>
        {exchange.participants.length > 0 && (
          <ReadyMeter ready={readyCount} total={exchange.participants.length} />
        )}
        {exchange.participants.length === 0 ? (
          <p className="text-muted-ink">Nobody has joined yet.</p>
        ) : (
          <ul aria-labelledby="participants" className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-paper">
            {exchange.participants.map((participant) => (
              <li key={participant.id} className="flex items-center justify-between gap-3 px-4 py-3 text-ink">
                <span className="min-w-0 break-words">{participant.displayName}</span>
                <ReadyBadge ready={participant.ready} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="event" className="flex flex-col gap-4">
        <h2 id="event" className="font-display text-xl text-ink">
          Event Details
        </h2>
        <EventDetailsList details={exchange.eventDetails} locale={locale} />
      </section>
    </main>
  )
}
