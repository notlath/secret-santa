import { expect } from "vitest"
import { eq, sql } from "drizzle-orm"
import { db } from "@/server/db"
import { exchange } from "@/server/db/schema"
import { closeRegistration, createExchange, draw, join, updateParticipant, type ExchangeDetailsInput, type ExchangeStatus } from "."

// Until the Host operations that change Status exist, tests set it directly.
export async function setStatus(exchangeId: string, status: ExchangeStatus) {
  await db.update(exchange).set({ status }).where(eq(exchange.id, exchangeId))
}

export function details(overrides: Partial<ExchangeDetailsInput> = {}): ExchangeDetailsInput {
  return {
    name: "Office Secret Santa",
    maxParticipants: 10,
    eventDate: "2026-12-18",
    eventTime: "19:30",
    location: "Mia's flat",
    budgetAmount: "25.50",
    budgetCurrency: "EUR",
    description: "Bring something cosy",
    instructions: "No gift cards",
    notes: "Ugly sweaters welcome",
    ...overrides,
  }
}

export async function created(overrides: Partial<ExchangeDetailsInput> = {}) {
  const result = await createExchange(details(overrides))
  if (!result.ok) throw new Error(`createExchange failed: ${JSON.stringify(result.error)}`)
  return result.value
}

export async function joined(accessCode: string, displayName: string) {
  const result = await join(accessCode, displayName)
  if (!result.ok) throw new Error(`join failed: ${JSON.stringify(result.error)}`)
  return result.value
}

// Fault injection at the database boundary exercises rollback after an Assignment was inserted.
export async function failSecondAssignmentInsert(exchangeId: string) {
  await db.execute(sql`create function reject_second_assignment() returns trigger language plpgsql as $$
    begin
      if exists (select 1 from assignment where exchange_id = NEW.exchange_id) then
        raise exception 'Injected Assignment insert failure';
      end if;
      return NEW;
    end;
  $$`)
  await db.execute(sql.raw(`create trigger reject_second_assignment before insert on assignment
    for each row when (NEW.exchange_id = '${exchangeId}') execute function reject_second_assignment()`))
  return async () => {
    await db.execute(sql`drop trigger reject_second_assignment on assignment`)
    await db.execute(sql`drop function reject_second_assignment()`)
  }
}

// A closed-then-drawn Exchange whose Participants each have a full Wishlist.
export async function drawnExchange(names: string[]) {
  const exchange = await created()
  const people = []
  for (const name of names) {
    const person = await joined(exchange.accessCode, name)
    await updateParticipant(person.personalToken, { wishlist: [{ name: `${name}'s book` }, { name: `${name}'s mug` }, { name: `${name}'s scarf` }] })
    people.push(person)
  }
  await closeRegistration(exchange.hostToken)
  expect((await draw(exchange.hostToken)).ok).toBe(true)
  return { ...exchange, people }
}
