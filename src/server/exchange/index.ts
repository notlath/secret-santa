import "server-only"
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm"
import { formatAccessCode, generateAccessCode, normalizeAccessCode } from "@/lib/access-code"
import { normalizeDisplayName, validateDisplayName } from "@/lib/display-name"
import {
  validateEventDetails,
  validateExchangeDetails,
  type EventDetailsInput,
  type ExchangeDetailsInput,
} from "@/lib/exchange-details"
import { draw as drawCircle, isDerangement } from "@/lib/draw/draw"
import { isReady, validateWishlist, WISHLIST_SIZE, type WishlistItem, type WishlistItemInput } from "@/lib/wishlist"
import { generateLinkToken, hashLinkToken } from "@/server/credentials"
import { db } from "@/server/db"
import { assignment, exchange, participant, wishlistItem } from "@/server/db/schema"
import { fail, ok, type Result } from "./errors"

export type { ExchangeError, Result } from "./errors"
export type { EventDetailsInput, ExchangeDetailsInput } from "@/lib/exchange-details"
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
  participants: { id: string; displayName: string; ready: boolean; revealedAt: Date | null }[]
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
  participants: { id: string; displayName: string; ready: boolean }[]
  eventDetails: EventDetails
}

export type DeviceRole = "host" | "participant"

export type DeviceCredential = { exchangeId: string; role: DeviceRole; token: string }

export type DeviceExchange = { id: string; name: string; roles: DeviceRole[] }

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

// Turns the link cookies held by a device into the Exchanges it can open. A credential counts only when
// its token is valid for that role and belongs to the Exchange it was stored under.
export async function deviceExchanges(credentials: DeviceCredential[]): Promise<DeviceExchange[]> {
  const hashesFor = (role: DeviceRole) =>
    credentials.filter((credential) => credential.role === role).map((credential) => hashLinkToken(credential.token))
  const hostHashes = hashesFor("host")
  const personalHashes = hashesFor("participant")
  const [hosts, participants] = await Promise.all([
    hostHashes.length === 0
      ? []
      : db
          .select({ id: exchange.id, name: exchange.name, createdAt: exchange.createdAt, hash: exchange.hostTokenHash })
          .from(exchange)
          .where(inArray(exchange.hostTokenHash, hostHashes)),
    personalHashes.length === 0
      ? []
      : db
          .select({ id: exchange.id, name: exchange.name, createdAt: exchange.createdAt, hash: participant.personalTokenHash })
          .from(participant)
          .innerJoin(exchange, eq(exchange.id, participant.exchangeId))
          .where(inArray(participant.personalTokenHash, personalHashes)),
  ])
  const found = new Map<string, DeviceExchange & { createdAt: Date }>()
  for (const [role, rows] of [["host", hosts], ["participant", participants]] as const) {
    for (const row of rows) {
      const storedUnder = credentials.some(
        (credential) =>
          credential.role === role && credential.exchangeId === row.id && hashLinkToken(credential.token) === row.hash,
      )
      if (!storedUnder) continue
      const entry = found.get(row.id) ?? { id: row.id, name: row.name, roles: [], createdAt: row.createdAt }
      if (!entry.roles.includes(role)) entry.roles.push(role)
      found.set(row.id, entry)
    }
  }
  return [...found.values()]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(({ id, name, roles }) => ({ id, name, roles }))
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
      .select({ id: participant.id, displayName: participant.displayName, ready: readySql, revealedAt: participant.revealedAt })
      .from(participant)
      .where(eq(participant.exchangeId, row.id))
      .orderBy(asc(participant.createdAt), asc(participant.id)),
  })
}

// Event Details live on the Exchange row only, so an edit never touches Assignments.
export async function updateEventDetails(
  hostToken: string | undefined,
  input: EventDetailsInput,
): Promise<Result<{ eventDetails: EventDetails }>> {
  const current = await findByHostToken(hostToken)
  if (!current) return fail({ code: "invalid_credential" })
  const validated = validateEventDetails(input)
  if (!validated.ok) return fail({ code: "validation", fields: validated.fields })
  // The status check sits in the update itself, so a Completed mark that lands meanwhile still wins.
  const [row] = await db
    .update(exchange)
    .set({ ...validated.value, updatedAt: new Date() })
    .where(and(eq(exchange.id, current.id), ne(exchange.status, "completed")))
    .returning()
  if (!row) return fail({ code: "invalid_transition" })
  return ok({ eventDetails: eventDetailsOf(row) })
}

export async function draw(hostToken: string | undefined): Promise<Result<{ status: ExchangeStatus }>> {
  const current = await findByHostToken(hostToken)
  if (!current) return fail({ code: "invalid_credential" })
  return db.transaction(async (tx) => {
    const [row] = await tx.select({ status: exchange.status }).from(exchange)
      .where(eq(exchange.id, current.id)).for("update")
    if (row.status === "assigned" || row.status === "completed") return fail({ code: "already_drawn" })
    if (row.status !== "closed") return fail({ code: "invalid_transition" })
    const people = await tx.select({ id: participant.id, ready: readySql }).from(participant)
      .where(eq(participant.exchangeId, current.id))
    if (people.length < 3) return fail({ code: "too_few_participants" })
    if (people.some((person) => !person.ready)) return fail({ code: "not_everyone_ready" })
    const [updated] = await tx.update(exchange).set({ status: "assigned", updatedAt: new Date() })
      .where(and(eq(exchange.id, current.id), eq(exchange.status, "closed"))).returning({ status: exchange.status })
    if (!updated) return fail({ code: "already_drawn" })
    const ids = people.map((person) => person.id)
    const assignments = drawCircle(ids)
    if (!isDerangement(ids, assignments)) throw new Error("The Draw did not produce valid Assignments")
    await tx.insert(assignment).values(assignments.map((pair) => ({ ...pair, exchangeId: current.id })))
    return ok(updated)
  })
}

export type RevealView = {
  id: string
  name: string
  status: ExchangeStatus
  revealedAt: Date | null
  recipient: { id: string; displayName: string; wishlist: WishlistItem[] }
  eventDetails: EventDetails
}

export async function revealView(personalToken: string | undefined): Promise<Result<RevealView>> {
  if (!personalToken) return fail({ code: "invalid_credential" })
  const [caller] = await db.select({ exchange, id: participant.id, revealedAt: participant.revealedAt })
    .from(participant).innerJoin(exchange, eq(exchange.id, participant.exchangeId))
    .where(eq(participant.personalTokenHash, hashLinkToken(personalToken)))
  if (!caller) return fail({ code: "invalid_credential" })
  if (caller.exchange.status !== "assigned" && caller.exchange.status !== "completed") return fail({ code: "invalid_transition" })
  const [recipient] = await db.select({ id: participant.id, displayName: participant.displayName })
    .from(assignment).innerJoin(participant, eq(participant.id, assignment.recipientId))
    .where(and(eq(assignment.exchangeId, caller.exchange.id), eq(assignment.giverId, caller.id)))
  if (!recipient) return fail({ code: "not_found" })
  const { wishlist } = await meOf(db, recipient)
  return ok({
    id: caller.exchange.id, name: caller.exchange.name, status: caller.exchange.status,
    revealedAt: caller.revealedAt, recipient: { ...recipient, wishlist }, eventDetails: eventDetailsOf(caller.exchange),
  })
}

export async function markRevealed(personalToken: string | undefined): Promise<Result<{ revealedAt: Date | null }>> {
  const view = await revealView(personalToken)
  if (!view.ok) return view
  if (view.value.status === "completed") return ok({ revealedAt: view.value.revealedAt })
  const [row] = await db.update(participant)
    .set({ revealedAt: sql`coalesce(${participant.revealedAt}, now())` })
    .where(eq(participant.personalTokenHash, hashLinkToken(personalToken!)))
    .returning({ revealedAt: participant.revealedAt })
  return row ? ok(row) : fail({ code: "invalid_credential" })
}

export async function closeRegistration(hostToken: string | undefined): Promise<Result<{ status: ExchangeStatus }>> {
  return changeRegistration(hostToken, "open", "closed")
}

export async function reopenRegistration(hostToken: string | undefined): Promise<Result<{ status: ExchangeStatus }>> {
  return changeRegistration(hostToken, "closed", "open")
}

async function changeRegistration(
  hostToken: string | undefined,
  from: "open" | "closed",
  to: "open" | "closed",
): Promise<Result<{ status: ExchangeStatus }>> {
  const current = await findByHostToken(hostToken)
  if (!current) return fail({ code: "invalid_credential" })
  // The conditional UPDATE locks the same Exchange row as joins and checks its current Status atomically.
  const [row] = await db
    .update(exchange)
    .set({ status: to, updatedAt: new Date() })
    .where(and(eq(exchange.id, current.id), eq(exchange.status, from)))
    .returning({ status: exchange.status })
  return row ? ok(row) : fail({ code: "invalid_transition" })
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
    participants: await db.select({ id: participant.id, displayName: participant.displayName, ready: readySql })
      .from(participant).where(eq(participant.exchangeId, row.exchange.id))
      .orderBy(asc(participant.createdAt), asc(participant.id)),
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
