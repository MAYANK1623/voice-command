import { describe, it, expect } from 'vitest'
import { resolveRemoval, combineQuantities, resolveImpliedUnit, normalizeAmount, convertQuantity } from './unitConversion'

describe('resolveRemoval — count units (pcs/dozen)', () => {
  it('"1 dozen eggs, remove 6" leaves 6 pcs, not 0.5 dozen', () => {
    expect(resolveRemoval({ quantity: 1, unit: 'dozen' }, { quantity: 6, unit: 'pcs' })).toEqual({
      quantity: 6,
      unit: 'pcs',
    })
  })

  it('removing everything (or more) returns remove-all', () => {
    expect(resolveRemoval({ quantity: 8, unit: 'pcs' }, { quantity: 8, unit: 'pcs' })).toBe('remove-all')
    expect(resolveRemoval({ quantity: 1, unit: 'dozen' }, { quantity: 12, unit: 'pcs' })).toBe('remove-all')
  })

  it('an ordinary same-unit decrement still just subtracts', () => {
    expect(resolveRemoval({ quantity: 8, unit: 'pcs' }, { quantity: 3, unit: 'pcs' })).toEqual({
      quantity: 5,
      unit: 'pcs',
    })
  })
})

describe('resolveRemoval — measured units (kg/g, l/ml)', () => {
  it('"2 l, remove 500 ml" leaves 1.5 l, not 1500 ml', () => {
    expect(resolveRemoval({ quantity: 2, unit: 'l' }, { quantity: 500, unit: 'ml' })).toEqual({
      quantity: 1.5,
      unit: 'l',
    })
  })

  it('a whole-number result stays in the coarser unit', () => {
    expect(resolveRemoval({ quantity: 2, unit: 'kg' }, { quantity: 1000, unit: 'g' })).toEqual({
      quantity: 1,
      unit: 'kg',
    })
  })

  it('removing it all returns remove-all', () => {
    expect(resolveRemoval({ quantity: 2, unit: 'kg' }, { quantity: 2000, unit: 'g' })).toBe('remove-all')
  })
})

describe('resolveRemoval — atomic units (pack/bottle) fall back to literal subtraction', () => {
  it('no conversion attempted; same-unit numbers just subtract', () => {
    expect(resolveRemoval({ quantity: 3, unit: 'pack' }, { quantity: 1, unit: 'pack' })).toEqual({
      quantity: 2,
      unit: 'pack',
    })
  })
})

describe('combineQuantities (merge-on-add)', () => {
  it('"1 dozen" + "6 pcs" -> 18 pcs', () => {
    expect(combineQuantities({ quantity: 1, unit: 'dozen' }, { quantity: 6, unit: 'pcs' })).toEqual({
      quantity: 18,
      unit: 'pcs',
    })
  })

  it('"1 dozen" + "12 pcs" -> 2 dozen (stays coarse when it divides evenly)', () => {
    expect(combineQuantities({ quantity: 1, unit: 'dozen' }, { quantity: 12, unit: 'pcs' })).toEqual({
      quantity: 2,
      unit: 'dozen',
    })
  })

  it('"2 l" + "500 ml" -> 2.5 l', () => {
    expect(combineQuantities({ quantity: 2, unit: 'l' }, { quantity: 500, unit: 'ml' })).toEqual({
      quantity: 2.5,
      unit: 'l',
    })
  })

  it('same-unit pcs adds are unaffected', () => {
    expect(combineQuantities({ quantity: 6, unit: 'pcs' }, { quantity: 2, unit: 'pcs' })).toEqual({
      quantity: 8,
      unit: 'pcs',
    })
  })
})

describe('resolveImpliedUnit', () => {
  it('a bare count against "dozen" means individual items (pcs)', () => {
    expect(resolveImpliedUnit('dozen')).toBe('pcs')
  })

  it('every other unit implies more of itself', () => {
    expect(resolveImpliedUnit('l')).toBe('l')
    expect(resolveImpliedUnit('kg')).toBe('kg')
    expect(resolveImpliedUnit('pcs')).toBe('pcs')
  })
})

describe('normalizeAmount (fresh, not-yet-merged amounts)', () => {
  it('"half a dozen" (0.5 dozen) normalizes to 6 pcs even with nothing to merge into', () => {
    expect(normalizeAmount({ quantity: 0.5, unit: 'dozen' })).toEqual({ quantity: 6, unit: 'pcs' })
  })

  it('measured fractional amounts are left as-is — 0.5 kg is normal grocery-speak', () => {
    expect(normalizeAmount({ quantity: 0.5, unit: 'kg' })).toEqual({ quantity: 0.5, unit: 'kg' })
  })

  it('whole numbers are never touched', () => {
    expect(normalizeAmount({ quantity: 3, unit: 'dozen' })).toEqual({ quantity: 3, unit: 'dozen' })
  })
})

describe('convertQuantity (Step 24: cart pricing)', () => {
  it('converts measured units both ways', () => {
    expect(convertQuantity({ quantity: 500, unit: 'g' }, 'kg')).toEqual({ quantity: 0.5, unit: 'kg' })
    expect(convertQuantity({ quantity: 1.5, unit: 'kg' }, 'g')).toEqual({ quantity: 1500, unit: 'g' })
  })

  it('converts count units both ways', () => {
    expect(convertQuantity({ quantity: 6, unit: 'pcs' }, 'dozen')).toEqual({ quantity: 0.5, unit: 'dozen' })
    expect(convertQuantity({ quantity: 1, unit: 'dozen' }, 'pcs')).toEqual({ quantity: 12, unit: 'pcs' })
  })

  it('returns the amount unchanged when the unit already matches', () => {
    expect(convertQuantity({ quantity: 2, unit: 'l' }, 'l')).toEqual({ quantity: 2, unit: 'l' })
  })

  it('refuses to convert across unrelated units rather than guessing', () => {
    expect(convertQuantity({ quantity: 2, unit: 'l' }, 'pcs')).toBeUndefined()
    expect(convertQuantity({ quantity: 1, unit: 'pack' }, 'kg')).toBeUndefined()
  })
})
