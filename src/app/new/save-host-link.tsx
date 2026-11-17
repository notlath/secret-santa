"use client"

import { Button } from "@ui-sdk/react/button"
import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox"
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import { useEffect, useRef, useState } from "react"
import { CopyButton } from "@/components/copy-button"
import { JoinForm } from "../join/[code]/join-form"

export function SaveHostLink({ accessCode, hostToken }: { accessCode: string; hostToken: string }) {
  // Only rendered after the create form submits, so browser globals are available.
  const hostLink = `${window.location.origin}/h/${hostToken}`
  const canShare = typeof navigator.share === "function"
  const [saved, setSaved] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">Your Exchange is ready</p>
        <p className="text-muted-ink">Friends join with this Access Code:</p>
        <p data-testid="access-code" className="font-mono text-4xl font-semibold tracking-[0.12em] text-cranberry">
          {accessCode}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border-2 border-gold bg-paper p-5 sm:p-6">
        <h2 ref={heading} tabIndex={-1} className="font-display text-2xl text-ink outline-none">
          Save your Host Link
        </h2>
        <p className="text-muted-ink">
          This link is the only way to manage your Exchange. There are no accounts, so if you lose it, nobody can get
          it back for you. Keep it somewhere safe, like your notes or a message to yourself.
        </p>
        <Field>
          <FieldLabel>Host Link</FieldLabel>
          <Input readOnly value={hostLink} onFocus={(event) => event.currentTarget.select()} className="font-mono" />
          <FieldDescription>Don&apos;t share it with Participants: whoever holds it controls the Exchange.</FieldDescription>
        </Field>
        <div className="flex flex-wrap gap-3">
          <CopyButton text={hostLink}>Copy Host Link</CopyButton>
          {canShare && (
            <Button onClick={() => navigator.share({ title: "My Gift Exchange Host Link", url: hostLink }).catch(() => {})}>
              Share
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Field className="flex-row items-center gap-3">
          <Checkbox checked={saved} onCheckedChange={(checked) => setSaved(checked === true)}>
            <CheckboxIndicator />
          </Checkbox>
          <FieldLabel>I&apos;ve saved my Host Link</FieldLabel>
        </Field>
        <Button data-variant="solid" disabled={!saved} className="self-start" render={<a href={`/h/${hostToken}`} />}>
          Go to the dashboard
        </Button>
      </div>

      {saved && (
        <section aria-labelledby="join-too" className="flex flex-col gap-4 border-t border-line pt-8">
          <div className="flex flex-col gap-2">
            <h2 id="join-too" className="font-display text-2xl text-ink">
              Join as a Participant too
            </h2>
            <p className="text-muted-ink">
              Giving and getting a gift yourself? Join like everyone else. You&apos;ll get your own Personal Link, kept
              separate from your Host Link.
            </p>
          </div>
          <JoinForm accessCode={accessCode} />
        </section>
      )}
    </section>
  )
}
