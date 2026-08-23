import { describe, it, expect } from 'vitest'
import { estimateItemPrice } from './pricing'
import type { Product } from '@/types'

const catalog: Product[] = [
  { id: 'prd_1', name: 'Whole Milk', brand: 'Dairy Farmers', category: 'dairy', unit: 'l', price: 2.49, tags: [] },
  { id: 'prd_2', name: 'Large Eggs', brand: 'Happy Hen', category: 'dairy', unit: 'dozen', price: 3.99, tags: [] },
  { id: 'prd_3', name: 'Trash Bags', brand: 'Glad', category: 'household', unit: 'pack', price: 6.49, tags: [] },
  {
    id: 'prd_4',
    name: 'Orange Juice',
    brand: 'Tropicana',
    category: 'beverages',
    unit: 'l',
    price: 3.99,
    tags: [],
  },
]

describe('estimateItemPrice', () => {
  it('prices a same-unit exact match by quantity', () => {
    expect(estimateItemPrice({ name: 'Whole Milk', quantity: 2, unit: 'l' }, catalog)).toEqual({
      unitPrice: 2.49,
      lineTotal: 4.98,
      onSale: false,
    })
  })

  it('resolves a substring match (voice-added lowercase name)', () => {
    expect(estimateItemPrice({ name: 'milk', quantity: 1, unit: 'l' }, catalog)).toEqual({
      unitPrice: 2.49,
      lineTotal: 2.49,
      onSale: false,
    })
  })

  it('converts a compatible mismatched unit before pricing', () => {
    // Tracked as "6 pcs" of eggs, catalog prices eggs per dozen — half a
    // dozen at $3.99/dozen rounds to $2.00, not the raw $1.995.
    expect(estimateItemPrice({ name: 'Large Eggs', quantity: 6, unit: 'pcs' }, catalog)).toEqual({
      unitPrice: 3.99,
      lineTotal: 2,
      onSale: false,
    })
  })

  it('returns undefined for an item with no catalog match at all', () => {
    expect(estimateItemPrice({ name: 'Kiwi', quantity: 1, unit: 'pcs' }, catalog)).toBeUndefined()
  })

  it('returns undefined rather than guessing across an unconvertible unit mismatch', () => {
    // Trash Bags are priced per 'pack'; tracking them in 'kg' has no honest conversion.
    expect(estimateItemPrice({ name: 'Trash Bags', quantity: 1, unit: 'kg' }, catalog)).toBeUndefined()
  })

  it('prices a bare \'pcs\' count as N-of-the-product when no unit was ever stated', () => {
    // "Add milk" / "add trash bags" (no unit spoken) default to 'pcs' in
    // the store — the overwhelming majority of voice/quick-add items — and
    // 'pcs' isn't in the same convertible group as 'l' or 'pack'. Without
    // this fallback almost nothing typed/spoken into the cart would ever
    // price at all.
    expect(estimateItemPrice({ name: 'Whole Milk', quantity: 1, unit: 'pcs' }, catalog)).toEqual({
      unitPrice: 2.49,
      lineTotal: 2.49,
      onSale: false,
    })
    expect(estimateItemPrice({ name: 'Trash Bags', quantity: 2, unit: 'pcs' }, catalog)).toEqual({
      unitPrice: 6.49,
      lineTotal: 12.98,
      onSale: false,
    })
  })

  it('prices "2 bottles of X" against a product priced per liter/pack — the beverages gap', () => {
    // "bottle" is a real spoken unit (README's own "Add 2 bottles of
    // water" example), not just the pcs default, but it's still a
    // no-fixed-size packaging count like pcs/pack/dozen — so it gets the
    // same N-of-the-product fallback rather than being declined outright.
    expect(estimateItemPrice({ name: 'Orange Juice', quantity: 2, unit: 'bottle' }, catalog)).toEqual({
      unitPrice: 3.99,
      lineTotal: 7.98,
      onSale: false,
    })
    expect(estimateItemPrice({ name: 'Trash Bags', quantity: 1, unit: 'bottle' }, catalog)).toEqual({
      unitPrice: 6.49,
      lineTotal: 6.49,
      onSale: false,
    })
  })

  it('still declines a genuinely conflicting measured unit, even against a count-priced product', () => {
    // "1 l of trash bags" is a real, specific (and nonsensical) measured
    // claim — 'l' is never in COUNT_UNITS, so this must not silently price.
    expect(estimateItemPrice({ name: 'Trash Bags', quantity: 1, unit: 'l' }, catalog)).toBeUndefined()
  })

  it('resolves a brand-qualified add ("Colgate Toothpaste") — a Product\'s own name never includes its brand', () => {
    const toothpasteCatalog: Product[] = [
      { id: 'prd_a', name: 'Toothpaste', brand: 'Colgate', category: 'household', unit: 'pcs', price: 3.49, tags: [] },
      { id: 'prd_b', name: 'Toothpaste', brand: 'Sensodyne', category: 'household', unit: 'pcs', price: 6.99, tags: [] },
    ]
    // "Colgate Toothpaste" must resolve to the $3.49 Colgate row, not the
    // $6.99 Sensodyne one — matching has to check brand, not just name.
    expect(estimateItemPrice({ name: 'Colgate Toothpaste', quantity: 1, unit: 'pcs' }, toothpasteCatalog)).toEqual({
      unitPrice: 3.49,
      lineTotal: 3.49,
      onSale: false,
    })
  })

  it('resolves "orange juice bottle" — a trailing packaging word baked into the name, not parsed out as a unit', () => {
    // "2 bottles of water" gets 'bottle' stripped into a real unit by
    // parseCommand's leading-quantity extraction (see the earlier test),
    // but "add orange juice bottle" doesn't lead with a quantity, so
    // 'bottle' stays part of the stored item name. No catalog product's
    // name/brand/tags contain the word "bottle" at all, so requiring it
    // as a match token would mean this never resolves — even though
    // "orange juice" alone clearly should match.
    expect(estimateItemPrice({ name: 'orange juice bottle', quantity: 1, unit: 'pcs' }, catalog)).toEqual({
      unitPrice: 3.99,
      lineTotal: 3.99,
      onSale: false,
    })
  })

  it('prices a discounted item at its sale price, not its original price', () => {
    // The real bug: cart pricing used to read product.price directly
    // everywhere, ignoring salePercent entirely — so an item added
    // straight from the Seasonal panel (which correctly shows the
    // discount) still charged full price the moment it became a cart row.
    const saleCatalog: Product[] = [
      {
        id: 'prd_9',
        name: 'Ground Coffee',
        brand: "Peet's",
        category: 'beverages',
        unit: 'pack',
        price: 8.99,
        tags: [],
        salePercent: 25,
      },
    ]
    expect(estimateItemPrice({ name: 'Ground Coffee', quantity: 2, unit: 'pack' }, saleCatalog)).toEqual({
      unitPrice: 6.74, // 8.99 * 0.75, rounded
      lineTotal: 13.48,
      onSale: true,
      originalUnitPrice: 8.99,
    })
  })
})
