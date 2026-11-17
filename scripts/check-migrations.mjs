import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"

export function checkMigrations(directory) {
  for (const name of readdirSync(directory).filter((name) => name.endsWith(".sql"))) {
    const source = readFileSync(path.join(directory, name), "utf8")
    const sql = source.replace(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'/g, " ")
    if (/(?:"public"|\bpublic)\s*\./i.test(sql)) {
      throw new Error(`${name}: public-qualified references bypass the isolated test schema. Use unqualified application table names.`)
    }
  }
}
