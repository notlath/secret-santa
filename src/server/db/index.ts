import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const url = process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL is not set")

// DB_SCHEMA is set only by the test harness, so each test run gets its own schema.
const searchPath = process.env.DB_SCHEMA

const client = postgres(url, {
  prepare: false,
  ...(searchPath ? { connection: { options: `-c search_path=${searchPath}` } } : {}),
})

export const db = drizzle(client, { schema })
