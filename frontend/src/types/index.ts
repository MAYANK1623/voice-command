// Mirrors backend/src/types/index.ts by hand — there's no shared package
// between the two workspaces (kept simple on purpose for a 7-day/22-step
// build). Any change to this shape must be mirrored there too; see
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

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

// Day 4, Step 11/12: mirrors backend/src/types/index.ts's Product (see the
// doc comment there for why this is separate from ShoppingItem).
export interface Product {
  id: string
  name: string
  brand: string
  category: ItemCategory
  unit: ItemUnit
  price: number // USD
  tags: string[]
  seasonMonths?: number[] // 1-12; see backend Product doc comment
  salePercent?: number
}

// Day 8, Step 23: mirrors backend/src/types/index.ts's SeasonalRecommendation
// — a computed "why buy this now" prompt (in season and/or on sale),
// recomputed server-side on every request, same as Suggestion below.
export interface SeasonalRecommendation extends Product {
  inSeason: boolean
  onSale: boolean
  salePrice?: number
}

export interface CategoryMeta {
  label: string
  color: string // tailwind class suffix, see CATEGORY_META
  emoji: string
}

// Day 6, Step 13: mirrors backend/src/types/index.ts's Suggestion — a
// computed "you're probably low on X" prompt, not stored data the
// frontend owns (see the backend doc comment for why it's recomputed
// server-side on every request rather than cached).
export interface Suggestion {
  itemName: string
  category: ItemCategory
  unit: ItemUnit
  lastPurchasedAt: string
  daysSinceLastPurchase: number
  averageIntervalDays: number
}
