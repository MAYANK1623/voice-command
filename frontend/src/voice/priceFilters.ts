// Pulls a price-range clause ("under $5", "over 3 dollars", "between $2 and
// $5") off a search phrase, leaving the rest as the product query — e.g.
// "toothpaste under $5" -> { maxPrice: 5, rest: "toothpaste" }. Shared by
// the voice "search" intent (parseCommand.ts) and the manual SearchBar so
// typing the same phrase behaves identically to saying it.
export interface PriceRange {
  minPrice?: number
  maxPrice?: number
}

const NUMBER = String.raw`\$?\s?(\d+(?:\.\d+)?)\s?(?:dollars?)?`

// Checked most-specific first: "between" must win before "over"/"under"
// (which don't otherwise appear in a "between X and Y" phrase, but keeping
// the order explicit avoids relying on that).
const BETWEEN_PATTERN = new RegExp(String.raw`\bbetween\s+${NUMBER}\s+and\s+${NUMBER}\b`, 'i')
const MAX_PATTERNS = [
  new RegExp(String.raw`\bunder\s+${NUMBER}\b`, 'i'),
  new RegExp(String.raw`\bbelow\s+${NUMBER}\b`, 'i'),
  new RegExp(String.raw`\bless than\s+${NUMBER}\b`, 'i'),
  new RegExp(String.raw`\b${NUMBER}\s+or less\b`, 'i'),
  // "5 dollars under" — the qualifier-after-number order Hindi's "5 डॉलर
  // से कम" (literally "5 dollars from-less") translates into, since Hindi
  // postpositions follow the number instead of leading it like English.
  // See translations.ts's Hindi word list for the "से"/"कम" mapping.
  new RegExp(String.raw`\b${NUMBER}\s+under\b`, 'i'),
]
const MIN_PATTERNS = [
  new RegExp(String.raw`\bover\s+${NUMBER}\b`, 'i'),
  new RegExp(String.raw`\babove\s+${NUMBER}\b`, 'i'),
  new RegExp(String.raw`\bmore than\s+${NUMBER}\b`, 'i'),
  new RegExp(String.raw`\b${NUMBER}\s+or more\b`, 'i'),
  new RegExp(String.raw`\b${NUMBER}\s+over\b`, 'i'), // same reasoning as above, for "ज़्यादा"/"अधिक"
]

// Leftover connectors once the price clause is removed, e.g. "toothpaste
// that costs under $5" -> "toothpaste" rather than "toothpaste that costs".
const TRAILING_CONNECTORS = /\s*\b(?:that|which|costs?|costing|priced at|for)\s*$/i

export function extractPriceRange(phrase: string): PriceRange & { rest: string } {
  const between = phrase.match(BETWEEN_PATTERN)
  if (between) {
    const a = parseFloat(between[1])
    const b = parseFloat(between[2])
    return {
      minPrice: Math.min(a, b),
      maxPrice: Math.max(a, b),
      rest: cleanRest(phrase.replace(BETWEEN_PATTERN, ' ')),
    }
  }

  let maxPrice: number | undefined
  let rest = phrase
  for (const pattern of MAX_PATTERNS) {
    const match = phrase.match(pattern)
    if (match) {
      maxPrice = parseFloat(match[1])
      rest = phrase.replace(pattern, ' ')
      break
    }
  }

  let minPrice: number | undefined
  for (const pattern of MIN_PATTERNS) {
    const match = rest.match(pattern)
    if (match) {
      minPrice = parseFloat(match[1])
      rest = rest.replace(pattern, ' ')
      break
    }
  }

  return { minPrice, maxPrice, rest: cleanRest(rest) }
}

function cleanRest(text: string): string {
  return text.replace(TRAILING_CONNECTORS, '').replace(/\s+/g, ' ').trim()
}
