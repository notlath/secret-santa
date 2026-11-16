import { createTestSchema } from "./test-database"

export default async function globalSetup() {
  return createTestSchema()
}
