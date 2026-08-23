import type { ItemUnit, Product, ShoppingItem } from '@/types'
import { convertQuantity } from '@/voice/unitConversion'
import { UNIT_SYNONYMS } from '@/voice/unitSynonyms'

export interface ItemPrice {
  unitPrice: number // what's actually charged per unit — the sale price when the product is on sale, its listed price otherwise
  lineTotal: number // unitPrice * the item's quantity, in the product's unit
  onSale: boolean
  originalUnitPrice?: number // only present when onSale, for a "was $X" display
}

// 'pcs'/'dozen'/'pack'/'bottle' name a *count* of packaged units with no
// fixed absolute size ("a pack" isn't a fixed weight/volume) — so a count
// in one of these against a product priced in another honestly means "N of
// the product as it's sold," not a claim about its actual size. 'kg'/'g'/
// 'l'/'ml' are the opposite: a real, specific measured quantity, so a
// mismatch there (e.g. tracked in 'kg' against something priced per
// 'pack') is a genuine conflicting claim, not just a missing count unit.
const COUNT_UNITS: ReadonlySet<ItemUnit> = new Set(['pcs', 'dozen', 'pack', 'bottle'])

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function tokenize(text: string): string[] {
  return text.toLowerCase().trim().split(/\s+/).filter(Boolean)
}

function tryTokenMatch(tokens: string[], catalog: Product[]): Product | undefined {
  if (tokens.length === 0) return undefined
  return catalog.find((p) => {
    const haystack = `${p.name} ${p.brand} ${p.tags.join(' ')}`.toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}

// Best-effort match against the catalog by name. Tries an exact name match
// first (most precise), then the same AND-across-every-token match
// backend/src/services/productsService.ts's searchProducts uses against
// name + brand + tags — not just name — so a brand-qualified add ("Colgate
// Toothpaste") resolves to the actual Colgate row instead of failing
// outright, since a Product's own `name` field never includes its brand.
//
// If that still comes up empty, retries with packaging/unit words (any
// UNIT_SYNONYMS entry — "bottle", "pack", "box", ...) stripped out of the
// tokens. Those only get parsed OUT of a spoken item name into a real unit
// when they lead the phrase ("2 bottles of water" — see parseCommand.ts's
// extractQuantityAndUnit); said as a trailing/compound noun instead ("add
// water bottle") they stay literally baked into the item's stored name.
// No catalog product's name/brand/tags contain a word like "bottle" at
// all, so requiring it as a match token meant "water bottle" could never
// resolve to anything even though "water" alone clearly should. A cart row
// was never required to come from the catalog (voice/typed adds are free
// text), so this can still legitimately come up empty.
function matchCatalogProduct(name: string, catalog: Product[]): Product | undefined {
  const needle = name.toLowerCase().trim()
  const exact = catalog.find((p) => p.name.toLowerCase() === needle)
  if (exact) return exact

  const tokens = tokenize(needle)
  const strictMatch = tryTokenMatch(tokens, catalog)
  if (strictMatch) return strictMatch

  const withoutUnitWords = tokens.filter((token) => !(token in UNIT_SYNONYMS))
  if (withoutUnitWords.length === tokens.length) return undefined // nothing was stripped, no point retrying
  return tryTokenMatch(withoutUnitWords, catalog)
}

// The price actually charged per unit — product.price discounted by
// salePercent when the catalog has it on sale (see productCatalog.ts /
// Step 23's seasonal recommendations, which compute this same way
// server-side for its own salePrice field), product.price unchanged
// otherwise. Pulling this into one helper is what fixed a real bug: cart
// pricing used to read product.price directly everywhere, so an item on
// sale still charged its full original price the moment it left the
// Seasonal panel and became a cart row.
function effectiveUnitPrice(product: Product): number {
  if (product.salePercent === undefined) return product.price
  return round2(product.price * (1 - product.salePercent / 100))
}

function priceAt(product: Product, quantity: number): ItemPrice {
  const unitPrice = effectiveUnitPrice(product)
  const onSale = product.salePercent !== undefined
  return {
    unitPrice,
    lineTotal: round2(unitPrice * quantity),
    onSale,
    ...(onSale ? { originalUnitPrice: product.price } : {}),
  }
}

// Step 24: estimates what a cart row costs by matching it to a catalog
// product and pricing at what's actually charged for it (its sale price
// when on sale, its listed price otherwise — see effectiveUnitPrice) — the
// same "no external pricing feed" trade-off as the rest of this app's
// catalog features, not a live price lookup. Returns undefined (never a
// guess) only when the item doesn't resolve to any catalog product at all,
// or names a *real, specific* unit that genuinely can't convert into the
// product's own (e.g. explicitly tracked in 'kg' against something priced
// per 'pack') — CartTotal/ItemCard both treat undefined as "price unknown"
// and exclude it rather than showing a wrong number.
//
// A COUNT_UNITS unit is a special case, not a real *measured* stated unit:
// "add milk" (no unit spoken) defaults to 'pcs' in the store, and "2
// bottles of water"/"a pack of soda" name 'bottle'/'pack' explicitly —
// none of these are in the same convertible group as most catalog units
// (l/kg most beverages/produce are actually priced per). Refusing to price
// any of them would mean most beverages, and most voice/quick-add items in
// general, never priced at all except when added straight from a
// ProductRow (search/catalog/seasonal), which happens to pass the
// catalog's own exact unit. So once same-unit and group-conversion both
// come up empty, a COUNT_UNITS unit falls back to "N of the product as
// it's normally sold" — $2.49 for "milk" against $2.49/l Whole Milk, or
// $3.99 for "2 bottles of water" against a $3.99/l product, same as if
// you'd said "2 milks"/"2 waters" to a person, not a literal 2-liter claim.
export function estimateItemPrice(
  item: Pick<ShoppingItem, 'name' | 'quantity' | 'unit'>,
  catalog: Product[]
): ItemPrice | undefined {
  const product = matchCatalogProduct(item.name, catalog)
  if (!product) return undefined

  if (item.unit === product.unit) {
    return priceAt(product, item.quantity)
  }

  const converted = convertQuantity(item, product.unit)
  if (converted) {
    return priceAt(product, converted.quantity)
  }

  if (COUNT_UNITS.has(item.unit)) {
    return priceAt(product, item.quantity)
  }

  return undefined
}
