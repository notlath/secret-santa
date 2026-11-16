import { cookies } from "next/headers"
import { CopyButton } from "@/components/copy-button"
import { EventDetailsList } from "@/components/event-details-list"
import { Explanation } from "@/components/explanation"
import { StatusBadge } from "@/components/status-badge"
import { personalCookieName } from "@/server/credentials"
import { participantView } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"
import { WISHLIST_SIZE } from "@/lib/wishlist"
import { DisplayNameForm } from "./display-name-form"
import { WishlistEditor } from "./wishlist-editor"

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
  const editable = exchange.status === "open" || exchange.status === "closed"

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">You&apos;re in as {exchange.me.displayName}</p>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{exchange.name}</h1>
        <StatusBadge status={exchange.status} />
      </header>

      {editable && <ReadyState ready={exchange.me.ready} saved={exchange.me.wishlist.length} />}

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
  )
}

function ReadyState({ ready, saved }: { ready: boolean; saved: number }) {
  const missing = WISHLIST_SIZE - saved
  return ready ? (
    <section aria-labelledby="ready" className="flex flex-col gap-1 rounded-2xl border-2 border-pine bg-paper p-5">
      <h2 id="ready" className="font-display text-xl text-pine">
        You&apos;re Ready
      </h2>
      <p className="text-muted-ink">All three Wishlist Items are in. You can still change them until the Draw.</p>
    </section>
  ) : (
    <section aria-labelledby="ready" className="flex flex-col gap-1 rounded-2xl border-2 border-gold bg-paper p-5">
      <h2 id="ready" className="font-display text-xl text-gold-ink">
        Not Ready yet
      </h2>
      <p className="text-muted-ink">
        Add {missing} more Wishlist {missing === 1 ? "Item" : "Items"} so the Host can run the Draw.
      </p>
    </section>
  )
}
