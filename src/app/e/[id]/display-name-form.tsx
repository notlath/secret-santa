"use client"

import { Button } from "@ui-sdk/react/button"
import { Field, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import { DISPLAY_NAME_MAX, validateDisplayName } from "@/lib/display-name"
import { updateParticipantAction } from "./actions"

export function DisplayNameForm({ exchangeId, displayName }: { exchangeId: string; displayName: string }) {
  const hydrated = useHydrated()
  const router = useRouter()
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [saved, setSaved] = useState("")
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get("displayName") ?? "")
    const checked = validateDisplayName(value)
    if (!checked.ok) {
      setError(checked.error)
      return
    }
    setPending(true)
    setMessage("")
    setSaved("")
    try {
      const result = await updateParticipantAction(exchangeId, { displayName: value })
      if (result.ok) {
        setSaved("Name saved.")
        router.refresh()
      } else {
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
    <form method="post" noValidate onSubmit={submit} className="flex flex-col gap-3">
      <fieldset disabled={!hydrated} className="contents">
        <Field name="displayName" invalid={error ? true : undefined}>
          <FieldLabel>Display name</FieldLabel>
          <Input
            defaultValue={displayName}
            maxLength={DISPLAY_NAME_MAX}
            autoComplete="nickname"
            onValueChange={() => {
              setError("")
              setSaved("")
            }}
          />
          {error && <FieldError match>{error}</FieldError>}
        </Field>
        {message && (
          <p role="alert" className="rounded-lg bg-cranberry/10 px-4 py-3 text-cranberry">
            {message}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!hydrated || pending} focusableWhenDisabled={hydrated}>
            {pending ? "Saving…" : "Save name"}
          </Button>
          <span role="status" className="text-sm text-pine">
            {saved}
          </span>
        </div>
      </fieldset>
    </form>
  )
}
