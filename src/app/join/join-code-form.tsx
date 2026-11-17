import { Button } from "@ui-sdk/react/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"

// A plain GET form, so finding an Exchange works before any JavaScript has loaded.
export function JoinCodeForm({ code, error }: { code?: string; error?: string }) {
  return (
    <form action="/join" method="get" className="flex flex-col gap-5">
      <Field name="code" invalid={error ? true : undefined}>
        <FieldLabel>Access Code</FieldLabel>
        <Input
          defaultValue={code}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="K7QM-3XRP"
          className="font-mono uppercase tracking-[0.12em] placeholder:normal-case placeholder:tracking-normal"
        />
        <FieldDescription>The 8-character code your Host shared. Dash optional.</FieldDescription>
        {error && <FieldError match>{error}</FieldError>}
      </Field>
      <Button type="submit" data-variant="solid" className="self-start">
        Find Exchange
      </Button>
    </form>
  )
}
