// Shared by the Exchange module (the authority) and the Wishlist editor (instant feedback).

export const WISHLIST_SIZE = 3
export const ITEM_NAME_MAX = 80
export const ITEM_DESCRIPTION_MAX = 300
export const PRODUCT_LINK_MAX = 2000

export type WishlistItemInput = { name: string; description?: string; productLink?: string }

export type WishlistItem = {
  position: number
  name: string
  description: string | null
  productLink: string | null
}

// Error keys look like `wishlist.<position>.<field>`, e.g. `wishlist.2.productLink`.
export function wishlistFieldKey(position: number, field: keyof WishlistItemInput): string {
  return `wishlist.${position}.${field}`
}

/**
 * Blank slots are dropped, so a partial Wishlist saves. An item with any content needs a name.
 * Readiness is derived from the result: Ready means all three slots hold a named item.
 */
export function validateWishlist(
  items: WishlistItemInput[],
): { ok: true; value: WishlistItem[] } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {}
  const value: WishlistItem[] = []
  items.slice(0, WISHLIST_SIZE).forEach((item, index) => {
    const position = index + 1
    const name = item.name.trim()
    const description = item.description?.trim() ?? ""
    const productLink = item.productLink?.trim() ?? ""
    if (!name && !description && !productLink) return

    if (!name) fields[wishlistFieldKey(position, "name")] = "Give this item a name."
    else if (name.length > ITEM_NAME_MAX) fields[wishlistFieldKey(position, "name")] = `Use ${ITEM_NAME_MAX} characters or fewer.`
    if (description.length > ITEM_DESCRIPTION_MAX) {
      fields[wishlistFieldKey(position, "description")] = `Use ${ITEM_DESCRIPTION_MAX} characters or fewer.`
    }
    const linkError = productLink ? productLinkError(productLink) : undefined
    if (linkError) fields[wishlistFieldKey(position, "productLink")] = linkError

    value.push({ position, name, description: description || null, productLink: productLink || null })
  })
  if (Object.keys(fields).length > 0) return { ok: false, fields }
  return { ok: true, value }
}

function productLinkError(link: string): string | undefined {
  if (link.length > PRODUCT_LINK_MAX) return `Use a link of ${PRODUCT_LINK_MAX} characters or fewer.`
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return "Enter a web address starting with https:// or http://."
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "Enter a web address starting with https:// or http://."
  }
  return undefined
}

export function isReady(wishlist: WishlistItem[]): boolean {
  return wishlist.filter((item) => item.name.trim()).length === WISHLIST_SIZE
}
