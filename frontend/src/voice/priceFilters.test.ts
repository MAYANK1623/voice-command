import { describe, it, expect } from 'vitest'
import { extractPriceRange } from './priceFilters'

describe('extractPriceRange', () => {
  it("parses the brief's own example exactly", () => {
    expect(extractPriceRange('toothpaste under $5')).toMatchObject({ maxPrice: 5, rest: 'toothpaste' })
  })

  it('recognizes every max-price phrasing', () => {
    expect(extractPriceRange('rice below $10').maxPrice).toBe(10)
    expect(extractPriceRange('rice less than $10').maxPrice).toBe(10)
    expect(extractPriceRange('rice $10 or less').maxPrice).toBe(10)
  })

  it('recognizes every min-price phrasing', () => {
    expect(extractPriceRange('rice over $10').minPrice).toBe(10)
    expect(extractPriceRange('rice above $10').minPrice).toBe(10)
    expect(extractPriceRange('rice more than $10').minPrice).toBe(10)
    expect(extractPriceRange('rice $10 or more').minPrice).toBe(10)
  })

  it('recognizes a between range, min/max ordered regardless of speech order', () => {
    expect(extractPriceRange('rice between $2 and $5')).toMatchObject({ minPrice: 2, maxPrice: 5, rest: 'rice' })
    expect(extractPriceRange('rice between $5 and $2')).toMatchObject({ minPrice: 2, maxPrice: 5 })
  })

  it('the qualifier-after-number order (Hindi translation output) also matches', () => {
    expect(extractPriceRange('5 dollars under toothpaste').maxPrice).toBe(5)
    expect(extractPriceRange('5 dollars over toothpaste').minPrice).toBe(5)
  })

  it('cleans up a trailing connector word left behind', () => {
    expect(extractPriceRange('toothpaste costs under $5').rest).toBe('toothpaste')
  })

  it('a phrase with no price clause returns only the rest', () => {
    expect(extractPriceRange('organic apples')).toEqual({ minPrice: undefined, maxPrice: undefined, rest: 'organic apples' })
  })
})
