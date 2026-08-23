import { describe, it, expect } from 'vitest'
import { normalizeItemName, findMatchingItem } from './matchItem'
import type { ShoppingItem } from '@/types'

function item(overrides: Partial<ShoppingItem>): ShoppingItem {
  return {
    id: 'itm_1',
    name: 'Milk',
    quantity: 1,
    unit: 'pcs',
    category: 'other',
    checked: false,
    addedVia: 'manual',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('normalizeItemName', () => {
  it('lowercases and trims', () => {
    expect(normalizeItemName('  Milk  ')).toBe('milk')
  })

  it('naively singularizes a trailing s', () => {
    expect(normalizeItemName('Bananas')).toBe('banana')
    expect(normalizeItemName('bananas')).toBe(normalizeItemName('banana'))
  })

  it('does not singularize short words (avoids mangling e.g. "gas")', () => {
    expect(normalizeItemName('gas')).toBe('gas')
  })
})

describe('findMatchingItem', () => {
  const items = [item({ id: '1', name: 'Milk' }), item({ id: '2', name: 'Whole Wheat Bread' })]

  it('matches exact (normalized) name first', () => {
    expect(findMatchingItem(items, 'milk')?.id).toBe('1')
  })

  it('falls back to a substring match in either direction', () => {
    expect(findMatchingItem(items, 'bread')?.id).toBe('2')
  })

  it('returns undefined for no match', () => {
    expect(findMatchingItem(items, 'eggs')).toBeUndefined()
  })

  it('returns undefined for an empty spoken name', () => {
    expect(findMatchingItem(items, '')).toBeUndefined()
  })
})
