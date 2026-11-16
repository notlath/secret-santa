"use client"

import { Button } from "@ui-sdk/react/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import { useState, type FormEvent } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import { DISPLAY_NAME_MAX, validateDisplayName } from "@/lib/display-name"
import { joinAction } from "../actions"
import { SavePersonalLink } from "./save-personal-link"

export function JoinForm({ accessCode }: { accessCode: string }) {
  const hydrated = useHydrated()
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [personalToken, setPersonalToken] = useState<string | null>(null)

  if (personalToken) return <SavePersonalLink personalToken={personalToken} />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const displayName = String(new FormData(event.currentTarget).get("displayName") ?? "")
    const checked = validateDisplayName(displayName)
    if (!checked.ok) {
      setError(checked.error)
      return
    }
    setPending(true)
    setMessage("")
    try {
      const result = await joinAction(accessCode, displayName)
      if (result.ok) setPersonalToken(result.personalToken)
      else {
        setError(result.fields.displayName ?? "")
        setMessage(result.message ?? "")
      }
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <Field name="displayName" invalid={error ? true : undefined}>
        <FieldLabel>Display name</FieldLabel>
        <Input disabled={!hydrated} maxLength={DISPLAY_NAME_MAX} autoComplete="nickname" onValueChange={() => setError("")} />
        <FieldDescription>How the others will see you. You can add your Wishlist after joining.</FieldDescription>
        {error && <FieldError match>{error}</FieldError>}
      </Field>
      {message && (
        <p role="alert" className="rounded-lg bg-cranberry/10 px-4 py-3 text-cranberry">
          {message}
        </p>
      )}
      <Button type="submit" data-variant="solid" disabled={!hydrated || pending} focusableWhenDisabled={hydrated} className="self-start">
        {pending ? "Joining…" : "Join"}
      </Button>
    </form>
  )
}
