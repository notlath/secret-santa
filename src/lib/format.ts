// Event dates and times have no time zone: format them as UTC so every viewer
// sees exactly what the Host entered, in their own locale's style.

export function formatEventDate(isoDate: string, locale: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
}

export function formatEventTime(time: string, locale: string): string {
  const [h, min] = time.split(":").map(Number)
  return new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, 0, 1, h, min)),
  )
}

export function formatMoney(amount: string, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(amount))
}
