import { randomBytes } from "node:crypto"
import { config } from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

// Every test run (Vitest or Playwright, in any worktree) gets its own Postgres
// schema on the shared test branch, migrated at start and dropped at the end.
export function testDatabaseEnv() {
  config({ path: ".env.local", quiet: true })
  const url = process.env.TEST_DATABASE_URL
  if (!url) throw new Error("TEST_DATABASE_URL is not set in .env.local")
  process.env.TEST_DB_SCHEMA ??= `test_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`
  return { DATABASE_URL: url, DB_SCHEMA: process.env.TEST_DB_SCHEMA }
}

export async function createTestSchema() {
  const { DATABASE_URL, DB_SCHEMA } = testDatabaseEnv()
  const sql = postgres(DATABASE_URL, {
    prepare: false,
    onnotice: () => {},
    connection: { options: `-c search_path=${DB_SCHEMA}` },
  })
  const dropTestSchema = async () => {
    const sql = postgres(DATABASE_URL, { prepare: false, onnotice: () => {} })
    try {
      await sql`drop schema if exists ${sql(DB_SCHEMA)} cascade`
    } finally {
      await sql.end()
    }
  }
  try {
    await sql`create schema ${sql(DB_SCHEMA)}`
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle", migrationsSchema: DB_SCHEMA })
  } catch (error) {
    await dropTestSchema()
    throw error
  } finally {
    await sql.end()
  }
  return dropTestSchema
}
