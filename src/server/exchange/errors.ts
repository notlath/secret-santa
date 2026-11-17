export type ExchangeError =
  | { code: "not_found" }
  | { code: "invalid_credential" }
  | { code: "forbidden" }
  | { code: "invalid_transition" }
  | { code: "exchange_full" }
  | { code: "display_name_taken" }
  | { code: "not_everyone_ready" }
  | { code: "too_few_participants" }
  | { code: "already_drawn" }
  | { code: "validation"; fields: Record<string, string> }

export type Result<T> = { ok: true; value: T } | { ok: false; error: ExchangeError }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function fail<T = never>(error: ExchangeError): Result<T> {
  return { ok: false, error }
}
