// No 0, O, 1, I or L, so a code read aloud or typed can't be mistaken.
export const ACCESS_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
export const ACCESS_CODE_LENGTH = 8

export function generateAccessCode(): string {
  const n = ACCESS_CODE_ALPHABET.length
  const limit = 256 - (256 % n)
  let code = ""
  while (code.length < ACCESS_CODE_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(ACCESS_CODE_LENGTH))
    for (const byte of bytes) {
      if (byte < limit && code.length < ACCESS_CODE_LENGTH) code += ACCESS_CODE_ALPHABET[byte % n]
    }
  }
  return code
}

export function normalizeAccessCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "")
}

export function formatAccessCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
