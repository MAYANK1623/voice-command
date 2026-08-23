import { generateId } from '../utils/id.js'
import type { PurchaseHistoryEntry, ShoppingItem } from '../types/index.js'

// The user's shopping list starts empty on a fresh clone — no demo/mock
// items pre-populated. The app has a separate, much larger product
// catalog (see data/productCatalog.ts) for the user to browse/search and
// add from; this is the actual shopping *list*, which is the user's own
// data and shouldn't come pre-filled with someone else's groceries.
// Kept as a function (not a literal `items: []` in database.ts) so a
// future "reset my list to a demo" feature has one place to change.
export function buildSeedItems(): ShoppingItem[] {
  return []
}

// Step 15: unlike buildSeedItems, this IS pre-populated on a fresh clone —
// purchase history is background data Step 13's suggestions read from,
// not something the user typed themselves, so seeding a plausible history
// here is what makes suggestions demonstrable at all without first
// spending several real days checking items off. Deliberately covers
// items NOT in the (empty) starting cart, so the suggestions they produce
// show up immediately rather than being suppressed by "already on the
// list" (see suggestionsService.ts).
export function buildSeedHistory(): PurchaseHistoryEntry[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

  const seeds: Array<
    Pick<PurchaseHistoryEntry, 'itemName' | 'category' | 'unit' | 'quantity'> & { daysAgo: number }
  > = [
    // Bought roughly every 8 days, last one 13 days ago — clearly overdue
    // (well past the 100% "genuinely due" threshold; see suggestionsService.ts).
    { itemName: 'Orange Juice', category: 'beverages', unit: 'l', quantity: 1, daysAgo: 21 },
    { itemName: 'Orange Juice', category: 'beverages', unit: 'l', quantity: 1, daysAgo: 13 },
    // Bought every 9 days, last one right on schedule — exactly at the
    // 100% threshold, so it just barely qualifies.
    { itemName: 'Cheese', category: 'dairy', unit: 'pack', quantity: 1, daysAgo: 18 },
    { itemName: 'Cheese', category: 'dairy', unit: 'pack', quantity: 1, daysAgo: 9 },
    // Bought every 22 days, last one 18 days ago (82% of the usual gap) —
    // under the 100% "genuinely due" threshold, so this deliberately does
    // NOT produce a suggestion. Demonstrates "close, but not overdue yet".
    { itemName: 'Coffee', category: 'beverages', unit: 'pack', quantity: 1, daysAgo: 40 },
    { itemName: 'Coffee', category: 'beverages', unit: 'pack', quantity: 1, daysAgo: 18 },
    // Bought every 6 days, right on schedule — exactly at the 100%
    // threshold, so it just barely qualifies.
    { itemName: 'Bananas', category: 'produce', unit: 'pcs', quantity: 6, daysAgo: 12 },
    { itemName: 'Bananas', category: 'produce', unit: 'pcs', quantity: 6, daysAgo: 6 },
    // Bought every 5 days, right on schedule — exactly at the 100%
    // threshold, so it just barely qualifies.
    { itemName: 'Whole Wheat Bread', category: 'bakery', unit: 'pack', quantity: 1, daysAgo: 10 },
    { itemName: 'Whole Wheat Bread', category: 'bakery', unit: 'pack', quantity: 1, daysAgo: 5 },
    // Bought every 12 days, last one 10 days ago (83% of the usual gap) —
    // under the 100% threshold, so no suggestion. Another "close, not overdue".
    { itemName: 'Eggs', category: 'dairy', unit: 'dozen', quantity: 1, daysAgo: 22 },
    { itemName: 'Eggs', category: 'dairy', unit: 'dozen', quantity: 1, daysAgo: 10 },
    // Bought every 25 days, last one 22 days ago (88% of the usual gap) —
    // under the 100% threshold, so no suggestion.
    { itemName: 'Toilet Paper', category: 'household', unit: 'pack', quantity: 1, daysAgo: 47 },
    { itemName: 'Toilet Paper', category: 'household', unit: 'pack', quantity: 1, daysAgo: 22 },
    // Only one purchase on record — Step 13 requires at least two to
    // compute an interval at all, so this deliberately does NOT produce a
    // suggestion. Demonstrates "not enough data yet", not a false positive.
    { itemName: 'Paper Napkins', category: 'household', unit: 'pack', quantity: 1, daysAgo: 5 },
  ]

  return seeds.map((seed) => ({
    id: generateId(),
    itemName: seed.itemName,
    category: seed.category,
    unit: seed.unit,
    quantity: seed.quantity,
    purchasedAt: daysAgo(seed.daysAgo),
  }))
}
