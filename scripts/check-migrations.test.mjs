import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { test } from "node:test"
import { checkMigrations } from "./check-migrations.mjs"

test("generated public-qualified foreign keys fail before reaching the database", (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "gx-migrations-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  writeFileSync(path.join(directory, "bad.sql"), 'ALTER TABLE "assignment" ADD FOREIGN KEY ("giver_id") REFERENCES "public"."participant"("id");')
  assert.throws(() => checkMigrations(directory), /bad\.sql.*public/)
})

test("unqualified SQL and public mentions in comments or values are accepted", (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "gx-migrations-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  writeFileSync(path.join(directory, "good.sql"), `
    -- REFERENCES public.participant
    /* public.exchange */
    ALTER TABLE assignment ADD FOREIGN KEY (giver_id) REFERENCES participant(id);
    INSERT INTO example VALUES ('public.example', 'an escaped ''public.example'' value');
  `)
  assert.doesNotThrow(() => checkMigrations(directory))
})

test("unquoted public references are also rejected", (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "gx-migrations-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  writeFileSync(path.join(directory, "bad.sql"), "CREATE TABLE public.example (id int);")
  assert.throws(() => checkMigrations(directory), /bad\.sql.*public/)
})

test("repository migrations preserve schema isolation", () => {
  checkMigrations(path.resolve(import.meta.dirname, "../drizzle"))
})
