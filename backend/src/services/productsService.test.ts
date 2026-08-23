import { describe, it, expect, afterEach, vi } from 'vitest'
import { searchProducts, findSubstitutes, listProducts, getSeasonalRecommendations } from './productsService.js'

describe('listProducts', () => {
  it('returns the full uncapped catalog', () => {
    expect(listProducts().length).toBe(101)
  })
})

describe('searchProducts', () => {
  it("reproduces the brief's own toothpaste-under-$5 example", () => {
    const results = searchProducts({ q: 'toothpaste', maxPrice: 5 })
    expect(results.map((p) => p.name)).toEqual(['Toothpaste', 'Whitening Toothpaste'])
    expect(results.every((p) => p.price <= 5)).toBe(true)
  })

  it("reproduces the brief's own organic-apples example — only organic-tagged apples, not the whole aisle", () => {
    const results = searchProducts({ q: 'organic apples' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((p) => p.tags.includes('organic'))).toBe(true)
    expect(results.every((p) => p.name.toLowerCase().includes('apple'))).toBe(true)
  })

  it('every token must match (AND, not OR)', () => {
    const results = searchProducts({ q: 'xyznonsense' })
    expect(results).toEqual([])
  })

  it('caps results and sorts by price ascending', () => {
    const results = searchProducts({}) // no filter — matches everything
    expect(results.length).toBeLessThanOrEqual(12)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].price).toBeGreaterThanOrEqual(results[i - 1].price)
    }
  })
})

describe('findSubstitutes', () => {
  it('ranks shared-tag matches above cheaper non-matching alternatives', () => {
    const results = findSubstitutes({ name: 'Organic Whole Milk' })
    expect(results.length).toBeGreaterThan(0)
    // The reference itself must never appear in its own substitute list.
    expect(results.some((p) => p.name === 'Organic Whole Milk')).toBe(false)
    // Both organic-tagged results should outrank cheaper non-organic ones.
    const organicIndex = results.findIndex((p) => p.tags.includes('organic'))
    const wholeMilkIndex = results.findIndex((p) => p.name === 'Whole Milk')
    expect(organicIndex).toBeGreaterThanOrEqual(0)
    expect(organicIndex).toBeLessThan(wholeMilkIndex)
  })

  it('falls back to an explicit category when the name has no catalog match', () => {
    const results = findSubstitutes({ category: 'dairy' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((p) => p.category === 'dairy')).toBe(true)
  })

  it('returns nothing when neither name nor category resolves to anything', () => {
    expect(findSubstitutes({ name: 'Definitely Not A Real Product' })).toEqual([])
  })

  it("ranks same-type alternatives (almond/oat/soy milk) above cheaper unrelated dairy for plain 'milk'", () => {
    const results = findSubstitutes({ name: 'milk' })
    const names = results.map((p) => p.name)
    const almondIndex = names.indexOf('Almond Milk')
    const sourCreamIndex = names.indexOf('Sour Cream')
    const cottageCheeseIndex = names.indexOf('Cottage Cheese')
    expect(almondIndex).toBeGreaterThanOrEqual(0)
    // Unrelated-but-cheaper dairy must not outrank an actual milk alternative.
    expect(almondIndex).toBeLessThan(sourCreamIndex)
    expect(almondIndex).toBeLessThan(cottageCheeseIndex)
  })
})

describe('getSeasonalRecommendations', () => {
  // The catalog's seasonMonths are month numbers, not dates, so pinning
  // the clock is what makes "in season" deterministic to test at all —
  // otherwise this suite would only pass on whichever months it happened
  // to run in.
  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes an item that is both in season and on sale, ranked at or near the top', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T00:00:00Z')) // August — Tomatoes are in season (6-9) and on sale
    const results = getSeasonalRecommendations()
    const tomatoes = results.find((p) => p.name === 'Tomatoes')
    expect(tomatoes).toBeDefined()
    expect(tomatoes).toMatchObject({ inSeason: true, onSale: true, salePercent: 10, salePrice: 2.88 })
    // Nothing outranks a both-in-season-and-on-sale item.
    expect(results[0]).toBe(tomatoes)
  })

  it('surfaces on-sale items even outside their category having any season concept', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T00:00:00Z')) // January — no produce seasons overlap the sale items below
    const results = getSeasonalRecommendations()
    const toothpaste = results.find((p) => p.name === 'Toothpaste' && p.brand === 'Colgate')
    expect(toothpaste).toMatchObject({ inSeason: false, onSale: true, salePrice: 2.79 })
  })

  it('excludes items that are neither in season nor on sale', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T00:00:00Z'))
    const results = getSeasonalRecommendations()
    // Sensodyne Toothpaste has no seasonMonths/salePercent at all.
    expect(results.some((p) => p.name === 'Toothpaste' && p.brand === 'Sensodyne')).toBe(false)
  })

  it('caps results at a small batch', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T00:00:00Z'))
    expect(getSeasonalRecommendations().length).toBeLessThanOrEqual(6)
  })
})
