import type { CategoryMeta, ItemCategory } from '@/types'

// Central source of truth for how each category is labelled, colored, and
// iconified across the app (list groups, item badges, add-item picker).
export const CATEGORY_META: Record<ItemCategory, CategoryMeta> = {
  produce: { label: 'Produce', color: 'green', emoji: '🥦' },
  dairy: { label: 'Dairy', color: 'blue', emoji: '🥛' },
  bakery: { label: 'Bakery', color: 'amber', emoji: '🍞' },
  snacks: { label: 'Snacks', color: 'orange', emoji: '🍿' },
  beverages: { label: 'Beverages', color: 'purple', emoji: '🧃' },
  household: { label: 'Household', color: 'slate', emoji: '🧻' },
  other: { label: 'Other', color: 'gray', emoji: '🛒' },
}

export const CATEGORY_ORDER: ItemCategory[] = [
  'produce',
  'dairy',
  'bakery',
  'snacks',
  'beverages',
  'household',
  'other',
]
