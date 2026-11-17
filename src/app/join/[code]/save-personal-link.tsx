"use client"

import { Button } from "@ui-sdk/react/button"
import { Field, FieldDescription, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import { useEffect, useRef } from "react"
import { CopyButton } from "@/components/copy-button"

export function SavePersonalLink({ personalToken }: { personalToken: string }) {
  // Only rendered after the join form submits, so browser globals are available.
  const personalLink = `${window.location.origin}/p/${personalToken}`
  const canShare = typeof navigator.share === "function"
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [])

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-gold bg-paper p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-pine">You&apos;re in</p>
        <h2 ref={heading} tabIndex={-1} className="font-display text-2xl text-ink outline-none">
          Save your Personal Link
        </h2>
        <p className="text-muted-ink">
          This device will remember you. To come back on another phone or computer, open this link there. Keep it
          somewhere safe, like your notes or a message to yourself.
        </p>
        <Field>
          <FieldLabel>Personal Link</FieldLabel>
          <Input readOnly value={personalLink} onFocus={(event) => event.currentTarget.select()} className="font-mono" />
          <FieldDescription>Keep it to yourself: whoever has it can act as you.</FieldDescription>
        </Field>
        <div className="flex flex-wrap gap-3">
          <CopyButton text={personalLink}>Copy Personal Link</CopyButton>
          {canShare && (
            <Button onClick={() => navigator.share({ title: "My Gift Exchange Personal Link", url: personalLink }).catch(() => {})}>
              Share
            </Button>
          )}
        </div>
      </div>
      <Button data-variant="solid" className="self-start" render={<a href={`/p/${personalToken}?joined=1`} />}>
        Go to my page
      </Button>
    </section>
  )
}
