import type { ItemCategory, ItemUnit } from '@/types'
import { NUMBER_WORDS } from './numberWords'
import { UNIT_SYNONYMS } from './unitSynonyms'
import { inferCategory } from './categoryKeywords'
import { extractPriceRange } from './priceFilters'
import { normalizeAmount } from './unitConversion'

export type CommandAction = 'add' | 'remove' | 'check' | 'clear_checked' | 'search' | 'substitute' | 'unknown'

export interface ParsedCommand {
  action: CommandAction
  raw: string
  itemName?: string
  quantity?: number
  unit?: ItemUnit
  category?: ItemCategory
  // 'search' only (Step 12: voice-activated price filtering) — the price
  // range extracted from phrases like "find toothpaste under $5".
  minPrice?: number
  maxPrice?: number
}

// 'remove' target resolution needs the item's *current* quantity (from the
// live list), which parseCommand — a pure function with no store access —
// can't see. So a spoken quantity on a remove command is only ever a
// decrement amount, never validated here; useVoiceCommands.ts is what
// decides "5 left, so decrement" vs "that's all of it, delete the row".

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ')
}

// "delete the bread" should resolve to item name "bread", not "the bread".
// Only used for remove/check targets, which have no quantity to extract —
// the add path handles "a"/"an" itself (see extractQuantityAndUnit: both
// already resolve to quantity 1 via NUMBER_WORDS), so only "the" needs
// stripping there.
function stripLeadingArticle(phrase: string): string {
  return phrase.replace(/^(?:the|a|an) /, '')
}

// Pulls a leading quantity ("2", "two", "a", "a couple of") and unit
// ("bottles", "dozen", "kg") off the front of a noun phrase, e.g.
// "2 bottles of water" -> { quantity: 2, unit: 'bottle', itemName: 'water' }.
// Falls back to quantity 1 / no unit / the whole phrase as the name when no
// leading number is present — `quantitySpecified` tells callers which case
// happened, since "1 (implied)" and "1 (spoken)" need different handling
// for remove (see below: an unspoken quantity means "remove all of it").
//
// A leading "the" is dropped before any of that: it's a definite article,
// never a count ("remove the milk" isn't "remove 1 milk"). "a"/"an" are
// deliberately NOT dropped here — unlike "the", they DO mean a count of
// one ("remove an apple" out of 4 should leave 3), and NUMBER_WORDS
// already resolves them to quantity 1 below.
function extractQuantityAndUnit(
  phrase: string
): { quantity: number; unit?: ItemUnit; itemName: string; quantitySpecified: boolean } {
  const tokens = phrase.split(' ').filter(Boolean)
  if (tokens[0] === 'the') tokens.shift()
  let index = 0
  let quantity = 1
  let quantitySpecified = false

  if (tokens[0] === 'half') {
    // "half a litre" / "half litre" -> 0.5, with or without the "a" — both
    // are said in normal speech. Converted to a whole-number-friendly form
    // downstream by normalizeAmount (e.g. "half a dozen" -> 6 pcs, but
    // "half a kg" stays 0.5 kg since fractional weight is normal).
    quantity = 0.5
    quantitySpecified = true
    index = 1
    if (tokens[index] === 'a' || tokens[index] === 'an') index += 1
  } else if (tokens[0] === 'a' && (tokens[1] === 'couple' || tokens[1] === 'few')) {
    quantity = NUMBER_WORDS[tokens[1]]
    quantitySpecified = true
    index = 2
    if (tokens[index] === 'of') index += 1
  } else if (/^\d+$/.test(tokens[0] ?? '')) {
    quantity = parseInt(tokens[0], 10)
    quantitySpecified = true
    index = 1
  } else if (tokens[0] && tokens[0] in NUMBER_WORDS) {
    quantity = NUMBER_WORDS[tokens[0]]
    quantitySpecified = true
    index = 1
  }

  let unit: ItemUnit | undefined
  const unitToken = tokens[index]?.toLowerCase()
  if (unitToken && UNIT_SYNONYMS[unitToken]) {
    unit = UNIT_SYNONYMS[unitToken]
    index += 1
    if (tokens[index] === 'of') index += 1
  }

  return { quantity, unit, itemName: tokens.slice(index).join(' ').trim(), quantitySpecified }
}

// Checked most-specific-first so a narrower phrase never gets swallowed by
// a broader one (e.g. "clear checked items" must win before any add/remove
// pattern gets a chance at it).
const CLEAR_CHECKED_PATTERNS = [
  /^clear( my)?( the)? (checked|done|completed)( items)?$/,
  /^remove( all)? (checked|done|completed) items$/,
]

const CHECK_PATTERNS = [/^(?:mark|check off) (.+?)(?: as bought| off)?$/, /^i (?:bought|got|have) (.+)$/]

const REMOVE_PATTERNS = [
  /^remove (.+?)(?: from (?:my|the) list)?$/,
  /^delete (.+?)(?: from (?:my|the) list)?$/,
  /^take (.+?) off(?: my| the)? list$/,
  /^i (?:don'?t|do not) need (.+?)(?: anymore)?$/,
]

// Step 14: "find a substitute for milk", "substitutes for milk",
// "alternative to milk", "what can i use instead of milk". Checked before
// SEARCH_PATTERNS — "find a substitute for X" starts with "find" too, and
// SEARCH's `find (.+)` would otherwise swallow the whole phrase
// (itemName "a substitute for milk") before this ever got a chance.
const SUBSTITUTE_PATTERNS = [
  /^find (?:a |an )?substitutes? for (.+)$/,
  /^substitutes? for (.+)$/,
  /^find (?:an )?alternatives? (?:for|to) (.+)$/,
  /^alternatives? (?:for|to) (.+)$/,
  /^what can i use instead of (.+)$/,
]

// Step 11/12: "find me organic apples", "search for toothpaste under $5",
// "look for toothpaste", "show me apples under $3". Checked before ADD so
// "find" is never mistaken for an add verb (it isn't one of ADD_PATTERNS's,
// but keeping the ordering explicit documents the intent).
const SEARCH_PATTERNS = [
  /^find (?:me )?(.+)$/,
  /^search(?: for)? (.+)$/,
  /^look for (.+)$/,
  /^show me (.+)$/,
]

const ADD_PATTERNS = [
  /^add (.+?)(?: to (?:my|the) list)?$/,
  /^i need (.+)$/,
  /^i want(?: to buy| to get)? (.+)$/,
  /^buy (.+)$/,
  /^get (?:me )?(.+)$/,
  /^put (.+?) on (?:my|the) list$/,
  /^i(?: am|'?m) (?:out of|low on) (.+)$/,
]

function firstMatch(patterns: RegExp[], text: string): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return undefined
}

// Rule-based NLP: no external API, no API key, works offline once the
// transcript exists — see workdone.md Day 3 for why this approach was
// chosen over a hosted LLM/NLU service for this project.
export function parseCommand(transcript: string): ParsedCommand {
  const raw = transcript
  const normalized = normalize(transcript)
  if (!normalized) return { action: 'unknown', raw }

  if (CLEAR_CHECKED_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { action: 'clear_checked', raw }
  }

  const checkTarget = firstMatch(CHECK_PATTERNS, normalized)
  if (checkTarget) {
    return { action: 'check', raw, itemName: stripLeadingArticle(checkTarget) }
  }

  const removeTarget = firstMatch(REMOVE_PATTERNS, normalized)
  if (removeTarget) {
    // "Remove 3 bananas" -> decrement by 3; "remove an apple" -> decrement
    // by 1 ("a"/"an" is a count here, see extractQuantityAndUnit); "remove
    // bananas" (no leading number at all, quantitySpecified false) -> the
    // existing full-delete behavior, not "remove 1 (implied) banana". Uses
    // extractQuantityAndUnit directly rather than stripLeadingArticle,
    // which would eat a genuine "a"/"an" count before it could be read.
    const { quantity, unit, itemName, quantitySpecified } = extractQuantityAndUnit(removeTarget)
    // "Half a dozen" -> 6 pcs before this ever reaches a store action, so
    // a fresh "remove half a dozen eggs" with no existing item to merge
    // against still resolves to a sane whole-number amount.
    const amount = quantitySpecified && unit ? normalizeAmount({ quantity, unit }) : { quantity, unit }
    return {
      action: 'remove',
      raw,
      itemName,
      quantity: quantitySpecified ? amount.quantity : undefined,
      unit: amount.unit,
    }
  }

  const substituteTarget = firstMatch(SUBSTITUTE_PATTERNS, normalized)
  if (substituteTarget) {
    return { action: 'substitute', raw, itemName: stripLeadingArticle(substituteTarget) }
  }

  const searchPhrase = firstMatch(SEARCH_PATTERNS, normalized)
  if (searchPhrase) {
    const { minPrice, maxPrice, rest } = extractPriceRange(searchPhrase)
    return { action: 'search', raw, itemName: stripLeadingArticle(rest), minPrice, maxPrice }
  }

  const addPhrase = firstMatch(ADD_PATTERNS, normalized)
  if (addPhrase) {
    const { quantity, unit, itemName } = extractQuantityAndUnit(addPhrase.replace(/^the /, ''))
    if (itemName) {
      const amount = unit ? normalizeAmount({ quantity, unit }) : { quantity, unit }
      return {
        action: 'add',
        raw,
        itemName,
        quantity: amount.quantity,
        unit: amount.unit,
        category: inferCategory(itemName),
      }
    }
  }

  // Fallback: a bare "1 kg eggs" with no verb at all. English almost always
  // supplies one ("add 1 kg eggs"), but Hinglish/Hindi very often doesn't
  // ("1 kilo ande" — quantity, unit, item, no verb) — that's a natural
  // utterance, not a malformed one, so it shouldn't dead-end at "unknown."
  // Only fires when a real quantity was actually spoken (quantitySpecified)
  // so arbitrary unmatched text ("asdkjfh nonsense command") still falls
  // through to 'unknown' rather than becoming a false-positive add.
  const bare = extractQuantityAndUnit(normalized)
  if (bare.quantitySpecified && bare.itemName) {
    const amount = bare.unit ? normalizeAmount({ quantity: bare.quantity, unit: bare.unit }) : bare
    return {
      action: 'add',
      raw,
      itemName: bare.itemName,
      quantity: amount.quantity,
      unit: amount.unit,
      category: inferCategory(bare.itemName),
    }
  }

  return { action: 'unknown', raw }
}
