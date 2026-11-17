const EURO_REGIONS = "AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK".split(" ")

const REGION_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", JP: "JPY", CN: "CNY", HK: "HKD",
  SG: "SGD", IN: "INR", PH: "PHP", MY: "MYR", ID: "IDR", TH: "THB", VN: "VND", KR: "KRW",
  TW: "TWD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF",
  RO: "RON", MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", ZA: "ZAR", NG: "NGN",
  KE: "KES", AE: "AED", SA: "SAR", IL: "ILS", TR: "TRY",
  ...Object.fromEntries(EURO_REGIONS.map((region) => [region, "EUR"])),
}

export function currencyForLocale(locale: string): string {
  try {
    const region = new Intl.Locale(locale).maximize().region
    return (region && REGION_CURRENCY[region]) || "USD"
  } catch {
    return "USD"
  }
}

export function currencyOptions(locale: string): { value: string; label: string }[] {
  const names = new Intl.DisplayNames([locale], { type: "currency" })
  return Intl.supportedValuesOf("currency").map((code) => ({
    value: code,
    label: `${code} · ${names.of(code) ?? code}`,
  }))
}
