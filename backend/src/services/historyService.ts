import { getDb } from '../db/database.js'
import { generateId } from '../utils/id.js'
import type { PurchaseHistoryEntry, ShoppingItem } from '../types/index.js'

// Thin data-access layer, same shape as itemsService.ts — kept separate
// from it because history is append-only and never mutated/deleted the
// way items are (see the DbSchema doc comment in db/database.ts).

export async function listHistory(): Promise<PurchaseHistoryEntry[]> {
  const db = await getDb()
  return db.data.history
}

// Called from itemsService.updateItem the moment an item transitions to
// checked — i.e. "the user actually bought this" — never on create, since
// adding something to the list isn't the same as having purchased it.
export async function recordPurchase(
  item: Pick<ShoppingItem, 'name' | 'category' | 'unit' | 'quantity'>
): Promise<void> {
  const db = await getDb()
  const entry: PurchaseHistoryEntry = {
    id: generateId(),
    itemName: item.name,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    purchasedAt: new Date().toISOString(),
  }
  db.data.history.push(entry)
  await db.write()
}
