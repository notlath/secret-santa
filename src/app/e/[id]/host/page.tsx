import { cookies } from "next/headers"
import { CopyButton } from "@/components/copy-button"
import { Explanation } from "@/components/explanation"
import { formatEventDate, formatEventTime, formatMoney } from "@/lib/format"
import { hostCookieName } from "@/server/credentials"
import { hostView, type ExchangeStatus } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"

export const metadata = { title: "Host dashboard · Gift Exchange" }

const STATUS_LABEL: Record<ExchangeStatus, string> = {
  open: "Open for joining",
  closed: "Registration closed",
  assigned: "Draw done",
  completed: "Completed",
}

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
  const details = exchange.eventDetails
  const locale = await requestLocale()
  const joinPath = `/join/${exchange.accessCode}`

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">Host dashboard</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{exchange.name}</h1>
        <p className="self-start rounded-full bg-pine px-3 py-1 text-sm font-semibold text-paper">
          {STATUS_LABEL[exchange.status]}
        </p>
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

      <section aria-labelledby="event" className="flex flex-col gap-4">
        <h2 id="event" className="font-display text-xl text-ink">
          Event Details
        </h2>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[auto_1fr]">
          <Detail term="Date">{formatEventDate(details.eventDate, locale)}</Detail>
          <Detail term="Time">{formatEventTime(details.eventTime, locale)}</Detail>
          <Detail term="Location">{details.location}</Detail>
          {details.budgetAmount && details.budgetCurrency && (
            <Detail term="Budget">{formatMoney(details.budgetAmount, details.budgetCurrency, locale)}</Detail>
          )}
          {details.description && <Detail term="Description">{details.description}</Detail>}
          {details.instructions && <Detail term="Instructions">{details.instructions}</Detail>}
          {details.notes && <Detail term="Notes">{details.notes}</Detail>}
        </dl>
      </section>
    </main>
  )
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-sm font-semibold text-muted-ink sm:pt-0.5">{term}</dt>
      <dd className="-mt-3 whitespace-pre-line text-ink sm:mt-0">{children}</dd>
    </div>
  )
}
