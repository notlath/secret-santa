import { createTestSchema } from "./test-database"

export default async function setup() {
  return createTestSchema()
}
