import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSONFilePreset } from 'lowdb/node'
import type { PurchaseHistoryEntry, ShoppingItem } from '../types/index.js'
import { buildSeedItems, buildSeedHistory } from './seed.js'

export interface DbSchema {
  items: ShoppingItem[]
  // Step 15: purchase history is independent of the active list — items
  // get deleted (clear-checked, manual delete) but the record that they
  // were once bought shouldn't disappear with them, since Step 13's
  // suggestions read from this, not from `items`.
  history: PurchaseHistoryEntry[]
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Lives in backend/data/db.json — gitignored (see root .gitignore), but the
// directory itself is kept via backend/data/.gitkeep so a fresh clone
// always has somewhere to write to.
const DB_FILE = path.join(__dirname, '../../data/db.json')

type Db = Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>>

let dbPromise: Promise<Db> | null = null

// Pure-JS file-based store (no native compilation step, unlike
// better-sqlite3) — see workdone.md Day 1 for why this was chosen over a
// native or hosted database for a single-user shopping list. Lazily
// initialized and cached, so every caller gets the same instance without
// needing a top-level await anywhere.
export function getDb(): Promise<Db> {
  if (!dbPromise) {
    // JSONFilePreset reads the file if it exists, or creates it with this
    // default (and writes it) the very first time — that's what makes this
    // double as our seeding step.
    dbPromise = JSONFilePreset<DbSchema>(DB_FILE, { items: buildSeedItems(), history: buildSeedHistory() })
  }
  return dbPromise
}
