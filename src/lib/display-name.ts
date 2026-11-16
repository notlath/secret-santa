// Shared by the Exchange module (the authority) and the join form (instant feedback).

export const DISPLAY_NAME_MAX = 30

export function validateDisplayName(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = input.trim()
  if (!value) return { ok: false, error: "Enter a display name." }
  if (value.length > DISPLAY_NAME_MAX) return { ok: false, error: `Use ${DISPLAY_NAME_MAX} characters or fewer.` }
  return { ok: true, value }
}

export function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase()
}
