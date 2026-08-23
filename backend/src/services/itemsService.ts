import { getDb } from '../db/database.js'
import { generateId } from '../utils/id.js'
import { ApiError } from '../utils/ApiError.js'
import { recordPurchase } from './historyService.js'
import type { ShoppingItem } from '../types/index.js'
import type { CreateItemInput, UpdateItemInput } from '../validators/itemValidators.js'

// Thin business-logic layer between HTTP controllers and the lowdb store —
// controllers stay dumb (parse request, call this, shape response) and
// this is what Day 5's voice command processor will call directly too
// (e.g. "remove milk" resolves a name to an id, then calls removeItem here)
// instead of going back through HTTP.

export async function listItems(): Promise<ShoppingItem[]> {
  const db = await getDb()
  return db.data.items
}

export async function createItem(input: CreateItemInput): Promise<ShoppingItem> {
  const db = await getDb()
  const now = new Date().toISOString()
  const item: ShoppingItem = {
    id: generateId(),
    name: input.name.trim(),
    quantity: input.quantity ?? 1,
    unit: input.unit ?? 'pcs',
    category: input.category ?? 'other',
    checked: false,
    addedVia: input.addedVia ?? 'manual',
    createdAt: now,
    updatedAt: now,
  }
  db.data.items.push(item)
  await db.write()
  return item
}

export async function updateItem(id: string, patch: UpdateItemInput): Promise<ShoppingItem> {
  const db = await getDb()
  const item = db.data.items.find((existing) => existing.id === id)
  if (!item) {
    throw ApiError.notFound(`Item ${id} not found`)
  }
  // Captured before the patch is applied — this is "the user just bought
  // this", so Step 15's history should record what they actually checked
  // off (its own quantity/unit/category), not any values also arriving in
  // this same patch.
  const justChecked = patch.checked === true && !item.checked
  const purchased = { name: item.name, category: item.category, unit: item.unit, quantity: item.quantity }

  Object.assign(item, patch, { updatedAt: new Date().toISOString() })
  await db.write()

  if (justChecked) {
    // A history-recording failure shouldn't fail the checkbox toggle
    // itself — from the user's perspective that's a successful action —
    // so it's caught and logged rather than propagated as a 500.
    await recordPurchase(purchased).catch((err) => console.error('Failed to record purchase history:', err))
  }

  return item
}

export async function removeItem(id: string): Promise<void> {
  const db = await getDb()
  const index = db.data.items.findIndex((existing) => existing.id === id)
  if (index === -1) {
    throw ApiError.notFound(`Item ${id} not found`)
  }
  db.data.items.splice(index, 1)
  await db.write()
}

export async function clearCheckedItems(): Promise<number> {
  const db = await getDb()
  const before = db.data.items.length
  db.data.items = db.data.items.filter((item) => !item.checked)
  const removed = before - db.data.items.length
  if (removed > 0) {
    await db.write()
  }
  return removed
}
