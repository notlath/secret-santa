import { cookies } from "next/headers"
import Link from "next/link"
import { Explanation } from "@/components/explanation"
import { Snowfall } from "@/components/snowfall"
import { EventDetailsList } from "@/components/event-details-list"
import { personalCookieName } from "@/server/credentials"
import { revealView } from "@/server/exchange"
import { requestLocale } from "@/server/request-locale"
import { GiftReveal } from "./gift-reveal"

export const metadata = { title: "Your Recipient · Gift Exchange" }

export default async function RevealPage({ params }: PageProps<"/e/[id]/reveal">) {
  const { id } = await params
  const token = (await cookies()).get(personalCookieName(id))?.value
  const view = await revealView(token)
  if (token && !view.ok && view.error.code === "invalid_credential") {
    return <Explanation title="This link no longer works"><p>Ask your Host for a new one.</p></Explanation>
  }
  if (!view.ok || view.value.id !== id) {
    const waiting = !view.ok && view.error.code === "invalid_transition"
    return (
      <Explanation title={waiting ? "The Draw hasn't happened yet" : "You need your Personal Link"}>
        <p>{waiting ? "Your Host will run the Draw when everyone is Ready." : "Open your Personal Link to see your own Recipient."}</p>
        <Link href={`/e/${id}`} className="underline">Back to my Exchange</Link>
      </Explanation>
    )
  }
  const exchange = view.value
  const locale = await requestLocale()
  return (
    <>
    <Snowfall />
    <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pbs-8 pbe-24 sm:pbs-12">
      <Link href={`/e/${id}`} className="self-start text-pine underline underline-offset-4">Back to my Exchange</Link>
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">A little secret, just for you</p>
        <h1 className="font-display text-3xl text-ink [overflow-wrap:anywhere] sm:text-4xl">{exchange.name}</h1>
      </header>
      {exchange.recipientChangedBecause && (
        <p role="status" className="rounded-xl border-2 border-gold bg-paper px-4 py-3 text-ink [overflow-wrap:anywhere]">
          Your Recipient changed because {exchange.recipientChangedBecause} left
        </p>
      )}
      <GiftReveal exchangeId={id} alreadyOpened={exchange.revealedAt !== null} recipient={exchange.recipient} />
      <section aria-labelledby="event" className="flex flex-col gap-4">
        <h2 id="event" className="font-display text-xl text-ink">Event Details</h2>
        <EventDetailsList details={exchange.eventDetails} locale={locale} />
      </section>
    </main>
    </>
  )
}
