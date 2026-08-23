import { describe, it, expect } from 'vitest'
import { translateTranscript, applyGroceryVocabulary, translateGroceryNoun } from './translate'
import { parseCommand } from '../parseCommand'

describe('translateTranscript — Hindi (Devanagari)', () => {
  it("parses the brief's own example command", () => {
    expect(parseCommand(translateTranscript('दूध जोड़ो', 'hi-IN'))).toMatchObject({ action: 'add', itemName: 'milk' })
  })

  it('handles quantity+unit inside a Hindi sentence', () => {
    expect(parseCommand(translateTranscript('मुझे दो बोतल पानी चाहिए', 'hi-IN'))).toMatchObject({
      action: 'add',
      itemName: 'water',
      quantity: 2,
      unit: 'bottle',
    })
  })

  it('clear-checked and search phrasing', () => {
    expect(parseCommand(translateTranscript('चेक किए हुए हटाओ', 'hi-IN')).action).toBe('clear_checked')
    expect(parseCommand(translateTranscript('टूथपेस्ट ढूंढो', 'hi-IN')).action).toBe('search')
  })
})

describe('translateTranscript — Hinglish (Latin script)', () => {
  it('the exact reported failure: "1 kilo ande" resolves via translation + the bare-phrase fallback', () => {
    expect(parseCommand(translateTranscript('1 kilo ande', 'hi-IN'))).toMatchObject({
      action: 'add',
      itemName: 'eggs',
      quantity: 1,
      unit: 'kg',
    })
  })

  it('recognizes romanized verbs alongside Devanagari ones', () => {
    expect(parseCommand(translateTranscript('1 kilo seb jodo', 'hi-IN'))).toMatchObject({
      action: 'add',
      itemName: 'apples',
      quantity: 1,
      unit: 'kg',
    })
    expect(parseCommand(translateTranscript('check kiye hue hatao', 'hi-IN')).action).toBe('clear_checked')
  })

  it('strips the subject marker "maine" so it doesn\'t leak into the item name', () => {
    expect(parseCommand(translateTranscript('maine doodh khareed liya', 'hi-IN'))).toMatchObject({
      action: 'check',
      itemName: 'milk',
    })
  })

  it('half-a-dozen normalizes correctly through the romanized "aadha" path too', () => {
    expect(parseCommand(translateTranscript('aadha dozan ande jodo', 'hi-IN'))).toMatchObject({
      itemName: 'eggs',
      quantity: 6,
      unit: 'pcs',
    })
  })
})

describe('translateTranscript — Hindi price-filtered search (qualifier-after-number order)', () => {
  it('"5 dollars under" order translates and parses correctly', () => {
    expect(parseCommand(translateTranscript('5 डॉलर से कम टूथपेस्ट ढूंढो', 'hi-IN'))).toMatchObject({
      action: 'search',
      maxPrice: 5,
    })
  })
})

describe('translateTranscript — Spanish/French keep item names in their own language', () => {
  it('grocery nouns are NOT translated to English (by design, per user request)', () => {
    expect(parseCommand(translateTranscript('añade leche', 'es-ES'))).toMatchObject({ action: 'add', itemName: 'leche' })
    expect(parseCommand(translateTranscript('ajoute du lait', 'fr-FR'))).toMatchObject({ action: 'add', itemName: 'lait' })
  })

  it('command structure (verbs, quantity, unit) still translates correctly around the native noun', () => {
    expect(parseCommand(translateTranscript('añade 2 kilos de leche', 'es-ES'))).toMatchObject({
      action: 'add',
      itemName: 'leche',
      quantity: 2,
      unit: 'kg',
    })
  })

  it('remove/find phrasing still works', () => {
    expect(parseCommand(translateTranscript('quita el queso de mi lista', 'es-ES'))).toMatchObject({
      action: 'remove',
      itemName: 'queso',
    })
  })
})

describe('applyGroceryVocabulary — recognizes Hindi/Hinglish nouns regardless of selected language', () => {
  it('"add pyaz" with English selected still resolves to onion', () => {
    const command = applyGroceryVocabulary(parseCommand(translateTranscript('add pyaz', 'en-US')))
    expect(command).toMatchObject({ action: 'add', itemName: 'onion', category: 'produce' })
  })

  it('"add pani" with English selected still resolves to water', () => {
    const command = applyGroceryVocabulary(parseCommand(translateTranscript('add pani', 'en-US')))
    expect(command).toMatchObject({ action: 'add', itemName: 'water', category: 'beverages' })
  })

  it('SAFETY: does not corrupt "do not need" via the Hindi do=two collision', () => {
    const command = applyGroceryVocabulary(parseCommand(translateTranscript('i do not need bananas anymore', 'en-US')))
    expect(command).toMatchObject({ action: 'remove', itemName: 'bananas' })
  })
})

describe('translateGroceryNoun — used directly by QuickAddForm for bare (no-quantity) typed input', () => {
  it('translates a known Hindi/Hinglish word', () => {
    expect(translateGroceryNoun('pyaz')).toBe('onion')
    expect(translateGroceryNoun('PYAZ')).toBe('onion') // case-insensitive lookup
  })

  it('preserves original casing for anything not in the vocabulary', () => {
    expect(translateGroceryNoun('Paper Towels')).toBe('Paper Towels')
  })
})
