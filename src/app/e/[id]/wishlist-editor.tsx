"use client"

import { Button } from "@ui-sdk/react/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import { Textarea } from "@ui-sdk/react/textarea"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import {
  ITEM_DESCRIPTION_MAX,
  ITEM_NAME_MAX,
  PRODUCT_LINK_MAX,
  validateWishlist,
  WISHLIST_SIZE,
  wishlistFieldKey,
  type WishlistItem,
  type WishlistItemInput,
} from "@/lib/wishlist"
import { updateParticipantAction } from "./actions"

const POSITIONS = Array.from({ length: WISHLIST_SIZE }, (_, index) => index + 1)

export function WishlistEditor({ exchangeId, wishlist }: { exchangeId: string; wishlist: WishlistItem[] }) {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const [saved, setSaved] = useState("")
  const [pending, setPending] = useState(false)

  function clear(key: string) {
    setSaved("")
    if (!errors[key]) return
    setErrors((previous) => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (position: number, field: keyof WishlistItemInput) =>
      String(data.get(wishlistFieldKey(position, field)) ?? "")
    const items: WishlistItemInput[] = POSITIONS.map((position) => ({
      name: text(position, "name"),
      description: text(position, "description"),
      productLink: text(position, "productLink"),
    }))
    const checked = validateWishlist(items)
    if (!checked.ok) {
      setErrors(checked.fields)
      return
    }
    setPending(true)
    setMessage("")
    setSaved("")
    try {
      const result = await updateParticipantAction(exchangeId, { wishlist: items })
      if (result.ok) {
        setSaved("Wishlist saved.")
        router.refresh()
      } else {
        setErrors(result.fields)
        setMessage(result.message ?? "")
      }
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <ol className="flex flex-col gap-4">
        {POSITIONS.map((position) => {
          const item = wishlist.find((saved) => saved.position === position)
          return (
            <li key={position}>
              <fieldset className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-5">
                <legend className="float-left font-display text-lg text-cranberry">Item {position}</legend>
                <ItemField
                  name={wishlistFieldKey(position, "name")}
                  label="Name"
                  defaultValue={item?.name}
                  maxLength={ITEM_NAME_MAX}
                  error={errors[wishlistFieldKey(position, "name")]}
                  onEdit={clear}
                />
                <ItemField
                  name={wishlistFieldKey(position, "description")}
                  label="Description"
                  optional
                  long
                  defaultValue={item?.description}
                  maxLength={ITEM_DESCRIPTION_MAX}
                  description="Size, colour, anything that helps."
                  error={errors[wishlistFieldKey(position, "description")]}
                  onEdit={clear}
                />
                <ItemField
                  name={wishlistFieldKey(position, "productLink")}
                  label="Product link"
                  optional
                  type="url"
                  defaultValue={item?.productLink}
                  maxLength={PRODUCT_LINK_MAX}
                  error={errors[wishlistFieldKey(position, "productLink")]}
                  onEdit={clear}
                />
              </fieldset>
            </li>
          )
        })}
      </ol>
      {message && (
        <p role="alert" className="rounded-lg bg-cranberry/10 px-4 py-3 text-cranberry">
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" data-variant="solid" disabled={pending} focusableWhenDisabled>
          {pending ? "Saving…" : "Save Wishlist"}
        </Button>
        <span role="status" className="text-sm text-pine">
          {saved}
        </span>
      </div>
    </form>
  )
}

type ItemFieldProps = {
  name: string
  label: string
  defaultValue?: string | null
  maxLength: number
  error?: string
  description?: string
  optional?: boolean
  long?: boolean
  type?: "url"
  onEdit: (name: string) => void
}

function ItemField({ name, label, defaultValue, maxLength, error, description, optional, long, type, onEdit }: ItemFieldProps) {
  return (
    <Field name={name} invalid={error ? true : undefined}>
      <FieldLabel>
        {label} {optional && <span className="font-normal text-muted-ink">(optional)</span>}
      </FieldLabel>
      {long ? (
        <Textarea defaultValue={defaultValue ?? ""} maxLength={maxLength} rows={2} onValueChange={() => onEdit(name)} />
      ) : (
        <Input
          defaultValue={defaultValue ?? ""}
          maxLength={maxLength}
          type={type}
          inputMode={type}
          placeholder={type === "url" ? "https://" : undefined}
          onValueChange={() => onEdit(name)}
        />
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError match>{error}</FieldError>}
    </Field>
  )
}
