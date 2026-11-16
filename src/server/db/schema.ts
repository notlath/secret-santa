import { sql } from "drizzle-orm"
import {
  check,
  date,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
  boolean,
} from "drizzle-orm/pg-core"

export const exchange = pgTable(
  "exchange",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    accessCode: text("access_code").notNull().unique(),
    status: text("status", { enum: ["open", "closed", "assigned", "completed"] })
      .notNull()
      .default("open"),
    maxParticipants: integer("max_participants").notNull(),
    eventDate: date("event_date", { mode: "string" }).notNull(),
    eventTime: time("event_time").notNull(),
    location: text("location").notNull(),
    description: text("description"),
    instructions: text("instructions"),
    notes: text("notes"),
    budgetAmount: numeric("budget_amount", { precision: 12, scale: 2 }),
    budgetCurrency: text("budget_currency"),
    hostTokenHash: text("host_token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("exchange_status_check", sql`${t.status} in ('open', 'closed', 'assigned', 'completed')`),
    check("exchange_max_participants_check", sql`${t.maxParticipants} between 3 and 50`),
    check(
      "exchange_budget_check",
      sql`${t.budgetAmount} is null or (${t.budgetAmount} > 0 and ${t.budgetCurrency} is not null)`,
    ),
  ],
)

export const participant = pgTable(
  "participant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    exchangeId: uuid("exchange_id")
      .notNull()
      .references(() => exchange.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    normalizedDisplayName: text("normalized_display_name").notNull(),
    personalTokenHash: text("personal_token_hash").notNull().unique(),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    recipientChanged: boolean("recipient_changed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("participant_exchange_name_unique").on(t.exchangeId, t.normalizedDisplayName)],
)

export const wishlistItem = pgTable(
  "wishlist_item",
  {
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participant.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    productLink: text("product_link"),
  },
  (t) => [
    unique("wishlist_item_participant_position_unique").on(t.participantId, t.position),
    check("wishlist_item_position_check", sql`${t.position} between 1 and 3`),
  ],
)

export const assignment = pgTable(
  "assignment",
  {
    exchangeId: uuid("exchange_id").notNull().references(() => exchange.id, { onDelete: "cascade" }),
    giverId: uuid("giver_id").notNull().references(() => participant.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id").notNull().references(() => participant.id, { onDelete: "cascade" }),
  },
  (t) => [
    unique("assignment_exchange_giver_unique").on(t.exchangeId, t.giverId),
    unique("assignment_exchange_recipient_unique").on(t.exchangeId, t.recipientId),
    check("assignment_not_self_check", sql`${t.giverId} <> ${t.recipientId}`),
  ],
)
