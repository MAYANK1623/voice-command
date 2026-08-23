import type { ItemCategory } from '@/types'

// Keyword substrings checked against the spoken item name to guess its
// category (e.g. "milk" -> dairy) so voice-added items land in the right
// group without asking the user to say a category out loud. Deliberately
// simple substring matching rather than a real classifier — good enough
// for common grocery nouns, and easy to extend by just adding words.
export const CATEGORY_KEYWORDS: Record<Exclude<ItemCategory, 'other'>, string[]> = {
  produce: [
    'apple', 'banana', 'orange', 'grape', 'tomato', 'potato', 'onion',
    'carrot', 'lettuce', 'spinach', 'broccoli', 'pepper', 'avocado',
    'lemon', 'lime', 'berry', 'berries', 'mango', 'pear', 'cucumber',
    'garlic', 'celery', 'mushroom',
    // Common in Hindi/Hinglish grocery vocabulary (see i18n/translations.ts)
    'cauliflower', 'cabbage', 'pea', 'bean', 'watermelon', 'papaya',
    'guava', 'pomegranate', 'pumpkin', 'eggplant', 'okra', 'ginger',
  ],
  dairy: ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg'],
  bakery: ['bread', 'bun', 'bagel', 'croissant', 'muffin', 'cake', 'baguette', 'roll', 'tortilla wrap'],
  snacks: ['chip', 'cookie', 'cracker', 'popcorn', 'nuts', 'candy', 'chocolate', 'biscuit', 'pretzel'],
  beverages: ['water', 'juice', 'soda', 'coffee', 'tea', 'cola', 'beer', 'wine', 'lemonade'],
  household: [
    'paper towel', 'tissue', 'soap', 'detergent', 'cleaner', 'trash bag',
    'toilet paper', 'shampoo', 'sponge', 'foil', 'battery',
  ],
}

export function inferCategory(itemName: string): ItemCategory {
  const normalized = itemName.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<
    [Exclude<ItemCategory, 'other'>, string[]]
  >) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category
    }
  }
  return 'other'
}
