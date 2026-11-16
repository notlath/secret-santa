import "server-only"
import { and, asc, eq, ne, sql } from "drizzle-orm"
import { formatAccessCode, generateAccessCode, normalizeAccessCode } from "@/lib/access-code"
import { normalizeDisplayName, validateDisplayName } from "@/lib/display-name"
import { validateExchangeDetails, type ExchangeDetailsInput } from "@/lib/exchange-details"
import { isReady, validateWishlist, WISHLIST_SIZE, type WishlistItem, type WishlistItemInput } from "@/lib/wishlist"
import { generateLinkToken, hashLinkToken } from "@/server/credentials"
import { db } from "@/server/db"
import { exchange, participant, wishlistItem } from "@/server/db/schema"
import { fail, ok, type Result } from "./errors"

export type { ExchangeError, Result } from "./errors"
export type { ExchangeDetailsInput } from "@/lib/exchange-details"
export type { WishlistItem, WishlistItemInput } from "@/lib/wishlist"

export type ExchangeStatus = "open" | "closed" | "assigned" | "completed"

export type EventDetails = {
  eventDate: string
  eventTime: string
  location: string
  budgetAmount: string | null
  budgetCurrency: string | null
  description: string | null
  instructions: string | null
  notes: string | null
}

export type HostView = {
  id: string
  name: string
  status: ExchangeStatus
  accessCode: string
  maxParticipants: number
  eventDetails: EventDetails
  participants: { id: string; displayName: string; ready: boolean }[]
}

export type ExchangePreview = {
  name: string
  accessCode: string
  status: ExchangeStatus
  full: boolean
  eventDetails: EventDetails
}

export type ParticipantView = {
  id: string
  name: string
  status: ExchangeStatus
  me: Me
  eventDetails: EventDetails
}

export type Me = { id: string; displayName: string; ready: boolean; wishlist: WishlistItem[] }

type ExchangeRow = typeof exchange.$inferSelect

export async function createExchange(
  input: ExchangeDetailsInput,
): Promise<Result<{ exchange: { id: string }; accessCode: string; hostToken: string }>> {
  const validated = validateExchangeDetails(input)
  if (!validated.ok) return fail({ code: "validation", fields: validated.fields })
  const hostToken = generateLinkToken()
  for (;;) {
    const accessCode = generateAccessCode()
    try {
      const [row] = await db
        .insert(exchange)
        .values({
          ...validated.value,
          accessCode,
          hostTokenHash: hashLinkToken(hostToken),
        })
        .returning({ id: exchange.id })
      return ok({ exchange: { id: row.id }, accessCode: formatAccessCode(accessCode), hostToken })
    } catch (error) {
      if (!isUniqueViolation(error, "exchange_access_code_unique")) throw error
    }
  }
}

export async function hostView(hostToken: string | undefined): Promise<Result<HostView>> {
  const row = await findByHostToken(hostToken)
  if (!row) return fail({ code: "invalid_credential" })
  return ok({
    id: row.id,
    name: row.name,
    status: row.status,
    accessCode: formatAccessCode(row.accessCode),
    maxParticipants: row.maxParticipants,
    eventDetails: eventDetailsOf(row),
    participants: await db
      .select({ id: participant.id, displayName: participant.displayName, ready: readySql })
      .from(participant)
      .where(eq(participant.exchangeId, row.id))
      .orderBy(asc(participant.createdAt), asc(participant.id)),
  })
}

export async function join(
  accessCode: string,
  displayName: string,
): Promise<Result<{ exchangeId: string; participant: { id: string; displayName: string }; personalToken: string }>> {
  const name = validateDisplayName(displayName)
  if (!name.ok) return fail({ code: "validation", fields: { displayName: name.error } })
  const personalToken = generateLinkToken()
  return db.transaction(async (tx) => {
    // Locking the Exchange row serialises joins, so the count below can't go stale before the insert.
    const [row] = await tx
      .select({ id: exchange.id, status: exchange.status, maxParticipants: exchange.maxParticipants })
      .from(exchange)
      .where(eq(exchange.accessCode, normalizeAccessCode(accessCode)))
      .for("update")
    if (!row) return fail({ code: "not_found" })
    if (row.status !== "open") return fail({ code: "invalid_transition" })
    if ((await countParticipants(tx, row.id)) >= row.maxParticipants) return fail({ code: "exchange_full" })
    const [inserted] = await tx
      .insert(participant)
      .values({
        exchangeId: row.id,
        displayName: name.value,
        normalizedDisplayName: normalizeDisplayName(name.value),
        personalTokenHash: hashLinkToken(personalToken),
      })
      .onConflictDoNothing({ target: [participant.exchangeId, participant.normalizedDisplayName] })
      .returning({ id: participant.id, displayName: participant.displayName })
    if (!inserted) return fail({ code: "display_name_taken" })
    return ok({ exchangeId: row.id, participant: inserted, personalToken })
  })
}

export async function lookupByAccessCode(accessCode: string): Promise<Result<ExchangePreview>> {
  const [row] = await db
    .select()
    .from(exchange)
    .where(eq(exchange.accessCode, normalizeAccessCode(accessCode)))
  if (!row) return fail({ code: "not_found" })
  return ok({
    name: row.name,
    accessCode: formatAccessCode(row.accessCode),
    status: row.status,
    full: (await countParticipants(db, row.id)) >= row.maxParticipants,
    eventDetails: eventDetailsOf(row),
  })
}

export async function participantView(personalToken: string | undefined): Promise<Result<ParticipantView>> {
  if (!personalToken) return fail({ code: "invalid_credential" })
  const [row] = await db
    .select({ exchange, me: { id: participant.id, displayName: participant.displayName } })
    .from(participant)
    .innerJoin(exchange, eq(exchange.id, participant.exchangeId))
    .where(eq(participant.personalTokenHash, hashLinkToken(personalToken)))
  if (!row) return fail({ code: "invalid_credential" })
  return ok({
    id: row.exchange.id,
    name: row.exchange.name,
    status: row.exchange.status,
    me: await meOf(db, row.me),
    eventDetails: eventDetailsOf(row.exchange),
  })
}

export async function updateParticipant(
  personalToken: string | undefined,
  changes: { displayName?: string; wishlist?: WishlistItemInput[] },
): Promise<Result<Me>> {
  const fields: Record<string, string> = {}
  const name = changes.displayName === undefined ? undefined : validateDisplayName(changes.displayName)
  if (name && !name.ok) fields.displayName = name.error
  const wishlist = changes.wishlist === undefined ? undefined : validateWishlist(changes.wishlist)
  if (wishlist && !wishlist.ok) Object.assign(fields, wishlist.fields)
  if (Object.keys(fields).length > 0) return fail({ code: "validation", fields })
  if (!personalToken) return fail({ code: "invalid_credential" })

  return db.transaction(async (tx) => {
    const [found] = await tx
      .select({ id: participant.id, exchangeId: participant.exchangeId })
      .from(participant)
      .where(eq(participant.personalTokenHash, hashLinkToken(personalToken)))
    if (!found) return fail({ code: "invalid_credential" })
    // Locking the Exchange row serialises edits against joins (name uniqueness) and the Draw (status).
    const [row] = await tx
      .select({ status: exchange.status })
      .from(exchange)
      .where(eq(exchange.id, found.exchangeId))
      .for("update")
    if (row.status !== "open" && row.status !== "closed") return fail({ code: "invalid_transition" })

    if (name?.ok) {
      const normalized = normalizeDisplayName(name.value)
      const [taken] = await tx
        .select({ id: participant.id })
        .from(participant)
        .where(
          and(
            eq(participant.exchangeId, found.exchangeId),
            eq(participant.normalizedDisplayName, normalized),
            ne(participant.id, found.id),
          ),
        )
      if (taken) return fail({ code: "display_name_taken" })
      await tx
        .update(participant)
        .set({ displayName: name.value, normalizedDisplayName: normalized })
        .where(eq(participant.id, found.id))
    }
    if (wishlist?.ok) {
      await tx.delete(wishlistItem).where(eq(wishlistItem.participantId, found.id))
      if (wishlist.value.length > 0) {
        await tx.insert(wishlistItem).values(wishlist.value.map((item) => ({ ...item, participantId: found.id })))
      }
    }
    const [me] = await tx
      .select({ id: participant.id, displayName: participant.displayName })
      .from(participant)
      .where(eq(participant.id, found.id))
    return ok(await meOf(tx, me))
  })
}

// Ready is derived, never stored: all three Wishlist slots hold a named item.
const readySql = sql<boolean>`(select count(*) from ${wishlistItem} where ${wishlistItem.participantId} = ${participant.id} and ${wishlistItem.name} <> '') = ${WISHLIST_SIZE}`

async function meOf(executor: Pick<typeof db, "select">, me: { id: string; displayName: string }): Promise<Me> {
  const wishlist = await executor
    .select({
      position: wishlistItem.position,
      name: wishlistItem.name,
      description: wishlistItem.description,
      productLink: wishlistItem.productLink,
    })
    .from(wishlistItem)
    .where(eq(wishlistItem.participantId, me.id))
    .orderBy(asc(wishlistItem.position))
  return { ...me, ready: isReady(wishlist), wishlist }
}

async function countParticipants(executor: Pick<typeof db, "$count">, exchangeId: string): Promise<number> {
  return executor.$count(participant, eq(participant.exchangeId, exchangeId))
}

async function findByHostToken(hostToken: string | undefined): Promise<ExchangeRow | undefined> {
  if (!hostToken) return undefined
  const [row] = await db
    .select()
    .from(exchange)
    .where(eq(exchange.hostTokenHash, hashLinkToken(hostToken)))
  return row
}

function eventDetailsOf(row: ExchangeRow): EventDetails {
  return {
    eventDate: row.eventDate,
    eventTime: row.eventTime.slice(0, 5),
    location: row.location,
    budgetAmount: row.budgetAmount,
    budgetCurrency: row.budgetCurrency,
    description: row.description,
    instructions: row.instructions,
    notes: row.notes,
  }
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const pgError = (error as { cause?: unknown })?.cause ?? error
  const { code, constraint_name } = (pgError ?? {}) as { code?: string; constraint_name?: string }
  return code === "23505" && constraint_name === constraint
}
