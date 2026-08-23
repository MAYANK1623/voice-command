import type { ShoppingItem } from '@/types'

// Naive singularization (drop a trailing "s") so "banana" said aloud
// matches a list item stored as "Bananas" and vice versa. Not linguistically
// complete, but covers the common case for grocery nouns without pulling in
// a stemming library for one string compare.
//
// Exported (not just used internally) so the store's addItem can run the
// exact same normalization when deciding whether "add milk" should bump an
// existing "Milk" row instead of creating a second one — one definition of
// "same item name", reused everywhere that decision is made.
export function normalizeItemName(name: string): string {
  const lower = name.toLowerCase().trim()
  return lower.length > 3 && lower.endsWith('s') ? lower.slice(0, -1) : lower
}

// Resolves a spoken item name (e.g. "milk") to an existing list item for
// remove/check commands. Tries an exact (normalized) match first, then
// falls back to a substring match in either direction so "milk" also finds
// "whole milk" and "add the milk" style over-captures still resolve.
export function findMatchingItem(items: ShoppingItem[], spokenName: string): ShoppingItem | undefined {
  const target = normalizeItemName(spokenName)
  if (!target) return undefined

  const exact = items.find((item) => normalizeItemName(item.name) === target)
  if (exact) return exact

  return items.find((item) => {
    const normalizedName = normalizeItemName(item.name)
    return normalizedName.includes(target) || target.includes(normalizedName)
  })
}
