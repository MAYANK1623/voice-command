import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useShoppingListStore } from './useShoppingListStore'

// Step 16: addItem/removeItem/toggleChecked/updateQuantity/clearChecked
// used to always resolve void — a failed, rolled-back write looked
// identical to a successful one to any caller, which is exactly how
// useVoiceCommands.ts ended up announcing "Added milk" for an add that
// had actually failed. These lock in the fix: each action now resolves a
// success boolean the caller can act on.

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

beforeEach(() => {
  useShoppingListStore.setState({ items: [], error: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('addItem success/failure signal', () => {
  it('resolves true and clears a stale error on a successful create', async () => {
    useShoppingListStore.setState({ error: 'stale error from something else' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          item: {
            id: 'itm_1',
            name: 'Milk',
            quantity: 1,
            unit: 'pcs',
            category: 'dairy',
            checked: false,
            addedVia: 'manual',
            createdAt: '',
            updatedAt: '',
          },
        })
      )
    )

    const succeeded = await useShoppingListStore.getState().addItem({ name: 'Milk' })

    expect(succeeded).toBe(true)
    expect(useShoppingListStore.getState().error).toBeNull()
    expect(useShoppingListStore.getState().items).toHaveLength(1)
  })

  it('resolves false, sets error, and rolls back the optimistic item on a failed create', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'Server exploded' } }, { status: 500 })))

    const succeeded = await useShoppingListStore.getState().addItem({ name: 'Milk' })

    expect(succeeded).toBe(false)
    expect(useShoppingListStore.getState().error).toBeTruthy()
    expect(useShoppingListStore.getState().items).toHaveLength(0) // optimistic item rolled back
  })

  it('resolves false on a network failure (fetch rejects)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')))

    const succeeded = await useShoppingListStore.getState().addItem({ name: 'Milk' })

    expect(succeeded).toBe(false)
    expect(useShoppingListStore.getState().items).toHaveLength(0)
  })
})

describe('removeItem success/failure signal', () => {
  it('resolves false and restores the item on failure', async () => {
    useShoppingListStore.setState({
      items: [
        {
          id: 'itm_1',
          name: 'Milk',
          quantity: 1,
          unit: 'pcs',
          category: 'dairy',
          checked: false,
          addedVia: 'manual',
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')))

    const succeeded = await useShoppingListStore.getState().removeItem('itm_1')

    expect(succeeded).toBe(false)
    expect(useShoppingListStore.getState().items).toHaveLength(1) // rolled back
  })
})

// Step 14 "unavailable" gap: a catalog search that matches nothing used to
// be a dead end ("no results"). searchProducts now falls back to the same
// substitutes lookup a manual "find a substitute" would use.
describe('searchProducts "unavailable" fallback', () => {
  beforeEach(() => {
    useShoppingListStore.setState({ searchResults: [], searchQuery: null, searchKind: 'search', searchFallback: false })
  })

  it('falls back to substitutes when the search itself returns nothing', async () => {
    const substitute = {
      id: 'prd_13',
      name: 'Almond Milk',
      brand: 'Silk',
      category: 'dairy',
      unit: 'l',
      price: 3.99,
      tags: ['plant-based', 'dairy-free'],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/products/search')) return Promise.resolve(jsonResponse({ products: [] }))
        if (url.includes('/products/substitutes')) return Promise.resolve(jsonResponse({ products: [substitute] }))
        throw new Error(`unexpected fetch: ${url}`)
      })
    )

    await useShoppingListStore.getState().searchProducts({ query: 'kiwi' })

    const state = useShoppingListStore.getState()
    expect(state.searchFallback).toBe(true)
    expect(state.searchResults).toEqual([substitute])
  })

  it('does not fall back when the search itself finds something', async () => {
    const match = {
      id: 'prd_1',
      name: 'Toothpaste',
      brand: 'Colgate',
      category: 'household',
      unit: 'pcs',
      price: 3.49,
      tags: ['dental', 'mint'],
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ products: [match] })))

    await useShoppingListStore.getState().searchProducts({ query: 'toothpaste' })

    const state = useShoppingListStore.getState()
    expect(state.searchFallback).toBe(false)
    expect(state.searchResults).toEqual([match])
  })
})
