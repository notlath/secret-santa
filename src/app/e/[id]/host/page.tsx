import { cookies } from "next/headers"
import { CopyButton } from "@/components/copy-button"
import { EventDetailsList } from "@/components/event-details-list"
import { Explanation } from "@/components/explanation"
import { LiveRefresh } from "@/components/live-refresh"
import { RoleSwitcher } from "@/components/role-switcher"
import { ReadyBadge } from "@/components/ready-badge"
import { ReadyMeter } from "@/components/ready-meter"
import { StatusBadge } from "@/components/status-badge"
import { hostCookieName } from "@/server/credentials"
import { hostView } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"
import { RegistrationControls } from "./registration-controls"
import { EventDetailsEditor } from "./event-details-editor"
import { FinishControls } from "./finish-controls"
import { ParticipantControls } from "./participant-controls"

export const metadata = { title: "Host dashboard · Gift Exchange" }

export default async function HostDashboardPage({ params }: PageProps<"/e/[id]/host">) {
  const { id } = await params
  const token = (await cookies()).get(hostCookieName(id))?.value
  const view = await hostView(token)
  if (token && (!view.ok || view.value.id !== id)) {
    return <Explanation title="This link no longer works"><p>Ask your Host for a new one.</p></Explanation>
  }
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
      <LiveRefresh exchangeId={id} role="host" snapshot={JSON.stringify(exchange)} />
      <RoleSwitcher exchangeId={id} current="host" />
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
              <li key={participant.id} className="flex flex-col gap-3 px-4 py-3 text-ink">
                <div className="flex items-center justify-between gap-3"><span className="min-w-0 break-words">{participant.displayName}</span><ReadyBadge ready={participant.ready} /></div>
                {exchange.status !== "completed" && (exchange.status !== "assigned" || exchange.participants.length > 2) && <ParticipantControls exchangeId={id} participantId={participant.id} name={participant.displayName} drawn={exchange.status === "assigned"} remaining={exchange.participants.length} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {(exchange.status === "assigned" || exchange.status === "completed") && (
        <section aria-labelledby="reveals" className="flex flex-col gap-4 rounded-2xl border-2 border-pine bg-paper p-5">
          <h2 id="reveals" className="font-display text-xl text-pine">Reveals</h2>
          <p>The Draw is complete. Ask everyone to open their reveal.</p>
          <p className="font-semibold tabular-nums">{exchange.participants.filter((person) => person.revealedAt).length} of {exchange.participants.length} have seen their Recipient</p>
          <ul className="flex flex-col gap-3">
            {exchange.participants.map((person) => (
              <li key={person.id} className="flex flex-wrap justify-between gap-2 [overflow-wrap:anywhere]">
                <span>{person.displayName}</span>
                <span className="text-muted-ink">{person.revealedAt ? "Seen" : "Not seen yet"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RegistrationControls exchangeId={exchange.id} status={exchange.status} participants={exchange.participants} />

      <section aria-labelledby="event" className="flex flex-col gap-4">
        <h2 id="event" className="font-display text-xl text-ink">
          Event Details
        </h2>
        <EventDetailsEditor
          exchangeId={exchange.id}
          details={exchange.eventDetails}
          editable={exchange.status !== "completed"}
        >
          <EventDetailsList details={exchange.eventDetails} locale={locale} />
        </EventDetailsEditor>
      </section>

      <FinishControls exchangeId={exchange.id} status={exchange.status} />
    </main>
  )
}
