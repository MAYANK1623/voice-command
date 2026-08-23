// Mirrors frontend/src/types/index.ts by hand — there's no shared package
// between the two workspaces (kept simple on purpose for an 7-day/22-step
// build), so any change to this shape must be mirrored there too. See
// workdone.md Day 2 for the rationale.

export const ITEM_CATEGORIES = [
  'produce',
  'dairy',
  'bakery',
  'snacks',
  'beverages',
  'household',
  'other',
] as const
export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

export const ITEM_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'pack', 'dozen', 'bottle'] as const
export type ItemUnit = (typeof ITEM_UNITS)[number]

export const ADDED_VIA = ['voice', 'manual', 'suggestion'] as const
export type AddedVia = (typeof ADDED_VIA)[number]

export interface ShoppingItem {
  id: string
  name: string
  quantity: number
  unit: ItemUnit
  category: ItemCategory
  checked: boolean
  addedVia: AddedVia
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

// Day 4, Step 11/12: a small static product catalog (not user data, so it
// doesn't live in the lowdb store) that voice-activated search filters
// against — separate from ShoppingItem because a searchable catalog entry
// (brand, price, tags) and a list entry (quantity, checked, addedVia) are
// different concepts that only meet at "user adds a search result to their
// list", same as any grocery app's catalog-vs-cart split.
export interface Product {
  id: string
  name: string
  brand: string
  category: ItemCategory
  unit: ItemUnit
  price: number // USD
  tags: string[] // descriptors search can match, e.g. ['organic']
  // Peak-season calendar months (1 = January … 12 = December), for produce
  // where "in season" is a real, meaningful signal. Omitted for anything
  // that isn't a seasonal item at all — pantry staples, imports, cultivated
  // goods (mushrooms), household/health/pet products — which are always
  // equally "in season", not merely out of season year-round.
  seasonMonths?: number[]
  // Percent off (e.g. 20 = 20% off) if this item is currently discounted.
  // Omitted when not on sale. Static demo data, same trade-off as price
  // itself — a real deployment would source this from a live pricing feed.
  salePercent?: number
}

// Step 23: a computed (not stored) "why buy this now" prompt, derived
// purely from the static catalog — see productsService.getSeasonalRecommendations.
// Extends Product rather than duplicating its fields, since a seasonal
// recommendation IS a catalog product plus two computed flags.
export interface SeasonalRecommendation extends Product {
  inSeason: boolean
  onSale: boolean
  salePrice?: number // price after salePercent, only present when onSale
}

// Day 6, Step 15: a purchase record created whenever an item is checked
// off (see itemsService.updateItem) — never on create, since adding
// something to the list isn't the same as having bought it. This is the
// data Step 13's suggestions read from instead of static hand-tuned
// rules, and it's kept as its own append-only log rather than derived
// from ShoppingItem history, since items get deleted (clear-checked) but
// the fact that they were once bought shouldn't disappear with them.
export interface PurchaseHistoryEntry {
  id: string
  itemName: string
  category: ItemCategory
  unit: ItemUnit
  quantity: number
  purchasedAt: string // ISO timestamp
}

// Step 13: a computed (not stored) "you're probably low on X" prompt —
// derived from PurchaseHistoryEntry averages and recomputed on every
// GET /api/suggestions rather than cached, since the input (history) is
// small and this keeps suggestions always current with the latest
// checkoff.
export interface Suggestion {
  itemName: string
  category: ItemCategory
  unit: ItemUnit
  lastPurchasedAt: string
  daysSinceLastPurchase: number
  averageIntervalDays: number
}
