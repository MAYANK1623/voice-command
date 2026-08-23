import { describe, it, expect } from 'vitest'
import { inferCategory } from './categoryKeywords'

describe('inferCategory', () => {
  it('matches common grocery nouns to their category', () => {
    expect(inferCategory('milk')).toBe('dairy')
    expect(inferCategory('bananas')).toBe('produce')
    expect(inferCategory('bread')).toBe('bakery')
    expect(inferCategory('chocolate')).toBe('snacks')
    expect(inferCategory('water')).toBe('beverages')
    expect(inferCategory('paper towels')).toBe('household')
  })

  it('matches the Hindi/Hinglish vocabulary additions', () => {
    expect(inferCategory('onion')).toBe('produce')
    expect(inferCategory('cauliflower')).toBe('produce')
    expect(inferCategory('pumpkin')).toBe('produce')
  })

  it('is a substring match, so "bell pepper" catches on "pepper"', () => {
    expect(inferCategory('bell pepper')).toBe('produce')
  })

  it('falls back to "other" for anything unrecognized', () => {
    expect(inferCategory('flux capacitor')).toBe('other')
  })
})
