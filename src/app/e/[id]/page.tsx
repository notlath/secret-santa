import { Button } from "@ui-sdk/react/button"
import Link from "next/link"
import { cookies } from "next/headers"
import { CatGuard } from "@/components/cat-guard"
import { CopyButton } from "@/components/copy-button"
import { EventDetailsList } from "@/components/event-details-list"
import { Explanation } from "@/components/explanation"
import { GiftBox } from "@/components/gift-box"
import { LiveRefresh } from "@/components/live-refresh"
import { ReadyBadge } from "@/components/ready-badge"
import { ReadyMoments, ReadyState } from "@/components/ready-moment"
import { RoleSwitcher } from "@/components/role-switcher"
import { StatusBadge } from "@/components/status-badge"
import { personalCookieName } from "@/server/credentials"
import { participantView } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"
import { DisplayNameForm } from "./display-name-form"
import { ArrivalHeading } from "./join-arrival"
import { WishlistEditor } from "./wishlist-editor"

export const metadata = { title: "My Exchange · Gift Exchange" }

export default async function ParticipantPage({ params, searchParams }: PageProps<"/e/[id]">) {
  const { id } = await params
  const arrived = (await searchParams).joined === "1"
  const token = (await cookies()).get(personalCookieName(id))?.value
  const view = await participantView(token)
  if (token && (!view.ok || view.value.id !== id)) {
    return <Explanation title="This link no longer works"><p>Ask your Host for a new one.</p></Explanation>
  }
  if (!token || !view.ok || view.value.id !== id) {
    return (
      <Explanation title="You need your Personal Link">
        <p>Open the Personal Link you saved when you joined, and this device will remember you.</p>
      </Explanation>
    )
  }

  const exchange = view.value
  const locale = await requestLocale()
  const editable = exchange.status === "open" || exchange.status === "closed"

  return (
    <ReadyMoments>
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <LiveRefresh exchangeId={id} role="participant" snapshot={JSON.stringify(exchange)} />
      <RoleSwitcher exchangeId={id} current="participant" />
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">You&apos;re in as {exchange.me.displayName}</p>
        <ArrivalHeading arrived={arrived}>{exchange.name}</ArrivalHeading>
        <StatusBadge status={exchange.status} />
      </header>

      <section data-gift-card aria-labelledby="gift-box" className="flex items-center gap-5 rounded-2xl border-2 border-pine bg-paper p-5">
        {editable ? <CatGuard /> : <GiftBox />}
        <div className="flex min-w-0 flex-col gap-3">
          {editable ? (
            <>
              <h2 id="gift-box" className="font-display text-xl text-pine">Your gift box</h2>
              <p className="text-muted-ink">Your gift box opens after the Draw.</p>
            </>
          ) : (
            <>
              <h2 id="gift-box" className="font-display text-xl text-pine">Your Recipient is waiting</h2>
              <p className="text-muted-ink">The Draw is complete. Open your gift box to find out who you&apos;re giving to.</p>
              <Button render={<Link href={`/e/${id}/reveal`} />} className="self-start">Reveal my Recipient</Button>
            </>
          )}
        </div>
      </section>

      {editable && <ReadyState ready={exchange.me.ready} saved={exchange.me.wishlist.length} />}

      <section aria-labelledby="participants" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="participants" className="font-display text-xl text-ink">Participants</h2>
          <p className="text-sm tabular-nums text-muted-ink">{exchange.participants.length} joined</p>
        </div>
        <ul aria-labelledby="participants" className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-paper">
          {exchange.participants.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3 px-4 py-3 text-ink">
              <span className="min-w-0 break-words">{person.displayName}</span>
              <ReadyBadge ready={person.ready} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="wishlist" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="wishlist" className="font-display text-xl text-ink">
            My Wishlist
          </h2>
          <p className="text-muted-ink">Only your Giver will ever see it, after the Draw.</p>
        </div>
        {editable ? (
          <WishlistEditor exchangeId={exchange.id} wishlist={exchange.me.wishlist} />
        ) : (
          <>
            <p className="rounded-lg bg-cream-deep px-4 py-3 text-ink">
              The Draw has happened, so your Wishlist is locked. Your Giver sees it as it is below.
            </p>
            <ol className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-paper">
              {exchange.me.wishlist.map((item) => (
                <li key={item.position} className="flex flex-col gap-1 px-4 py-3">
                  <span className="font-semibold text-ink">{item.name}</span>
                  {item.description && <span className="text-muted-ink">{item.description}</span>}
                  {item.productLink && <span className="break-all text-sm text-muted-ink">{item.productLink}</span>}
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      {editable && (
        <section aria-labelledby="name" className="flex flex-col gap-4">
          <h2 id="name" className="font-display text-xl text-ink">
            Your name
          </h2>
          <DisplayNameForm exchangeId={exchange.id} displayName={exchange.me.displayName} />
        </section>
      )}

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
    </ReadyMoments>
  )
}
