import type { ReactNode } from "react"
import { formatEventDate, formatEventTime, formatMoney } from "@/lib/format"
import type { EventDetails } from "@/server/exchange"

export function EventDetailsList({ details, locale }: { details: EventDetails; locale: string }) {
  return (
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
  )
}

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-sm font-semibold text-muted-ink sm:pt-0.5">{term}</dt>
      <dd className="-mt-3 whitespace-pre-line text-ink sm:mt-0">{children}</dd>
    </div>
  )
}
