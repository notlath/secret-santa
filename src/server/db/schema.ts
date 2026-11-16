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
  uuid,
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
