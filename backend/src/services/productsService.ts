import { PRODUCT_CATALOG } from '../data/productCatalog.js'
import type { ItemCategory, Product, SeasonalRecommendation } from '../types/index.js'
import type { SearchProductsQuery, SubstituteQuery } from '../validators/productValidators.js'

const MAX_RESULTS = 12
// Same cap-a-small-batch reasoning as suggestionsService's MAX_SUGGESTIONS —
// a handful of genuinely timely picks, not the whole eligible pool dumped
// back at the user.
const MAX_SEASONAL = 6

// The full catalog, uncapped — for browsing (e.g. the empty-cart "here's
// what you can add" view), as opposed to searchProducts below, which is
// deliberately capped and query-filtered for voice/typed search results.
export function listProducts(): Product[] {
  return PRODUCT_CATALOG
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

// Every token in the query must appear somewhere in the product's searchable
// text (name + brand + tags) — so "organic apples" only matches products
// that are both, not everything that's merely fruit. This is what lets the
// brief's own example ("Find me organic apples") return the right subset of
// the catalog's several apple listings instead of all of them.
function matchesQuery(product: Product, tokens: string[]): boolean {
  if (tokens.length === 0) return true
  const haystack = `${product.name} ${product.brand} ${product.tags.join(' ')}`.toLowerCase()
  return tokens.every((token) => haystack.includes(token))
}

export function searchProducts(query: SearchProductsQuery): Product[] {
  const tokens = query.q ? tokenize(query.q) : []

  const matches = PRODUCT_CATALOG.filter((product) => {
    if (!matchesQuery(product, tokens)) return false
    if (query.minPrice !== undefined && product.price < query.minPrice) return false
    if (query.maxPrice !== undefined && product.price > query.maxPrice) return false
    return true
  })

  return matches.sort((a, b) => a.price - b.price).slice(0, MAX_RESULTS)
}

// Best-effort match against the catalog by name, to find the referenced
// product's own category/tags when the caller only gave a name (not a
// category) — e.g. "find a substitute for milk" resolves "milk" here.
function findReferenceProduct(name: string): Product | undefined {
  const needle = name.toLowerCase().trim()
  return (
    PRODUCT_CATALOG.find((product) => product.name.toLowerCase() === needle) ??
    PRODUCT_CATALOG.find((product) => product.name.toLowerCase().includes(needle))
  )
}

function nameTokens(name: string): Set<string> {
  return new Set(name.toLowerCase().split(/\s+/).filter(Boolean))
}

function sharedCount<T>(a: Iterable<T>, b: Set<T>): number {
  let count = 0
  for (const item of a) if (b.has(item)) count += 1
  return count
}

// Step 14: alternatives to an item — reuses the exact same catalog Step
// 11/12 built rather than a separate substitutes list, since "what else
// is in this aisle" and "what matches this search" are the same
// underlying data. Same category as the reference product (or the
// explicitly given category, if the name didn't resolve to a catalog
// entry), ranked by shared tags first — an 'organic' item prefers another
// 'organic' one over a conventional one — then by shared name words (e.g.
// "Whole Milk" -> "Almond Milk"/"Oat Milk" share "milk"), then price
// ascending. The name-word tier exists because a plain reference with no
// tags at all (most of the catalog) used to fall straight through to
// price, which could rank something unrelated-but-cheap (Sour Cream) above
// an actual same-type alternative (Almond Milk) for "substitute for milk"
// — exactly the brief's own example, so it's covered by a dedicated test.
export function findSubstitutes(query: SubstituteQuery): Product[] {
  const reference = query.name ? findReferenceProduct(query.name) : undefined
  const category: ItemCategory | undefined = reference?.category ?? query.category
  if (!category) return []

  const referenceTags = new Set(reference?.tags ?? [])
  const referenceNameTokens = nameTokens(reference?.name ?? query.name ?? '')
  const excludeName = (reference?.name ?? query.name ?? '').toLowerCase().trim()

  const candidates = PRODUCT_CATALOG.filter((product) => {
    if (product.category !== category) return false
    if (excludeName && product.name.toLowerCase() === excludeName) return false
    return true
  })

  return candidates
    .sort((a, b) => {
      const sharedTagsA = sharedCount(a.tags, referenceTags)
      const sharedTagsB = sharedCount(b.tags, referenceTags)
      if (sharedTagsA !== sharedTagsB) return sharedTagsB - sharedTagsA
      const sharedNameA = sharedCount(nameTokens(a.name), referenceNameTokens)
      const sharedNameB = sharedCount(nameTokens(b.name), referenceNameTokens)
      if (sharedNameA !== sharedNameB) return sharedNameB - sharedNameA
      return a.price - b.price
    })
    .slice(0, MAX_RESULTS)
}

function computeSalePrice(product: Product): number | undefined {
  if (product.salePercent === undefined) return undefined
  return Math.round(product.price * (1 - product.salePercent / 100) * 100) / 100
}

// Step 23: "why buy this now" prompts — same rule-based, no-external-API
// trade-off as suggestions/substitutes, this time driven by the catalog's
// own `seasonMonths`/`salePercent` fields (see productCatalog.ts) instead
// of purchase history. Recomputed against the real current month on every
// request rather than cached, so "in season" doesn't go stale mid-session
// if the calendar rolls over. An item needs to be in season, on sale, or
// both to appear at all — everything else is excluded outright, not just
// ranked lower.
export function getSeasonalRecommendations(): SeasonalRecommendation[] {
  const month = new Date().getMonth() + 1 // 1-12, matches seasonMonths
  const candidates: SeasonalRecommendation[] = []

  for (const product of PRODUCT_CATALOG) {
    const inSeason = product.seasonMonths?.includes(month) ?? false
    const onSale = product.salePercent !== undefined
    if (!inSeason && !onSale) continue
    candidates.push({ ...product, inSeason, onSale, salePrice: computeSalePrice(product) })
  }

  // Both in-season AND on sale is the strongest "buy this now" signal, so
  // it ranks above either alone; ties broken by the deepest discount, then
  // lowest price — never by catalog insertion order, which would just be
  // an accident of how PRODUCT_CATALOG happens to be laid out.
  return candidates
    .sort((a, b) => {
      const scoreA = Number(a.inSeason) + Number(a.onSale)
      const scoreB = Number(b.inSeason) + Number(b.onSale)
      if (scoreA !== scoreB) return scoreB - scoreA
      const discountA = a.salePercent ?? 0
      const discountB = b.salePercent ?? 0
      if (discountA !== discountB) return discountB - discountA
      return a.price - b.price
    })
    .slice(0, MAX_SEASONAL)
}
