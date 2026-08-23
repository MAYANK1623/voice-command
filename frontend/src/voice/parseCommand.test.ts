import { describe, it, expect } from 'vitest'
import { parseCommand } from './parseCommand'

// Ports the esbuild-bundled smoke scripts used throughout Days 3-7 into a
// permanent, repeatable suite — every case here was actually verified
// live against the running app at least once before landing here.

describe('add', () => {
  it('parses a plain add', () => {
    expect(parseCommand('add milk')).toMatchObject({ action: 'add', itemName: 'milk', quantity: 1 })
  })

  it("parses the brief's own bottled-water example exactly", () => {
    expect(parseCommand('add 2 bottles of water')).toMatchObject({
      action: 'add',
      itemName: 'water',
      quantity: 2,
      unit: 'bottle',
      category: 'beverages',
    })
  })

  it("parses the brief's own oranges example exactly", () => {
    expect(parseCommand('buy 5 oranges')).toMatchObject({
      action: 'add',
      itemName: 'oranges',
      quantity: 5,
      category: 'produce',
    })
  })

  it('recognizes every add phrasing variant', () => {
    for (const phrase of ['i need apples', 'i want to buy bananas', 'get me rice', "i'm out of paper towels"]) {
      expect(parseCommand(phrase).action).toBe('add')
    }
  })

  it('treats "a dozen" as quantity 1, unit dozen (matches the data model\'s "1 dozen" convention)', () => {
    expect(parseCommand('add a dozen eggs')).toMatchObject({ quantity: 1, unit: 'dozen', itemName: 'eggs' })
  })

  it('resolves "a couple of" / "a few" to 2 / 3', () => {
    expect(parseCommand('add a couple of apples').quantity).toBe(2)
    expect(parseCommand('add a few bananas').quantity).toBe(3)
  })

  it('the "to"/"too" homophone resolves to quantity 2, not a literal item named "to bananas"', () => {
    expect(parseCommand('add to bananas')).toMatchObject({ itemName: 'bananas', quantity: 2 })
    expect(parseCommand('add too bananas')).toMatchObject({ itemName: 'bananas', quantity: 2 })
  })

  it('"half a litre" resolves to 0.5 l (measured units stay decimal)', () => {
    expect(parseCommand('add half a litre of milk')).toMatchObject({ itemName: 'milk', quantity: 0.5, unit: 'l' })
  })

  it('"half a dozen" normalizes to 6 pcs (count units never go fractional)', () => {
    expect(parseCommand('add half a dozen eggs')).toMatchObject({ itemName: 'eggs', quantity: 6, unit: 'pcs' })
  })

  it('a bare "quantity unit item" with no verb still resolves to add (the "1 kilo ande" fix)', () => {
    expect(parseCommand('1 kg eggs')).toMatchObject({ action: 'add', itemName: 'eggs', quantity: 1, unit: 'kg' })
  })

  it('unmatched junk with no quantity stays unknown, never a false-positive add', () => {
    expect(parseCommand('asdkjfh nonsense command').action).toBe('unknown')
  })
})

describe('remove', () => {
  it("parses the brief's own remove examples exactly", () => {
    expect(parseCommand('remove milk from my list')).toMatchObject({ action: 'remove', itemName: 'milk' })
    expect(parseCommand('remove milk')).toMatchObject({ action: 'remove', itemName: 'milk' })
  })

  it('strips a leading article without eating a real quantity', () => {
    expect(parseCommand('delete the bread')).toMatchObject({ itemName: 'bread', quantity: undefined })
    expect(parseCommand('remove a kg of rice')).toMatchObject({ itemName: 'rice', quantity: 1, unit: 'kg' })
    expect(parseCommand('remove an apple')).toMatchObject({ itemName: 'apple', quantity: 1 })
  })

  it('extracts a decrement quantity+unit, leaving quantity undefined when none was spoken', () => {
    expect(parseCommand('remove 3 bananas')).toMatchObject({ itemName: 'bananas', quantity: 3 })
    expect(parseCommand('remove bananas').quantity).toBeUndefined()
    expect(parseCommand('remove 500 grams of milk')).toMatchObject({ itemName: 'milk', quantity: 500, unit: 'g' })
  })

  it('"remove 6 eggs" resolves as 6 pcs even with no unit word spoken', () => {
    expect(parseCommand('remove 6 eggs')).toMatchObject({ itemName: 'eggs', quantity: 6 })
  })
})

describe('check / clear_checked', () => {
  it('recognizes "bought" phrasing', () => {
    expect(parseCommand('i bought milk')).toMatchObject({ action: 'check', itemName: 'milk' })
    expect(parseCommand('mark bananas as bought')).toMatchObject({ action: 'check', itemName: 'bananas' })
  })

  it('recognizes clear-checked phrasing', () => {
    expect(parseCommand('clear checked items').action).toBe('clear_checked')
  })
})

describe('search', () => {
  it("parses the brief's own search examples exactly", () => {
    expect(parseCommand('find toothpaste under $5')).toMatchObject({
      action: 'search',
      itemName: 'toothpaste',
      maxPrice: 5,
    })
    expect(parseCommand('find me organic apples')).toMatchObject({ action: 'search', itemName: 'organic apples' })
  })
})

describe('substitute', () => {
  it('recognizes every substitute phrasing, and never gets swallowed by plain search', () => {
    expect(parseCommand('find a substitute for milk')).toMatchObject({ action: 'substitute', itemName: 'milk' })
    expect(parseCommand('substitutes for toothpaste')).toMatchObject({ action: 'substitute', itemName: 'toothpaste' })
    expect(parseCommand('what can i use instead of milk')).toMatchObject({ action: 'substitute', itemName: 'milk' })
    // regression: plain "find X" must still be search, not substitute
    expect(parseCommand('find toothpaste under $5').action).toBe('search')
    expect(parseCommand('find me organic apples').action).toBe('search')
  })
})
