import type { ItemUnit } from '@/types'

// Two different "shapes" of convertible unit pair, because they read
// naturally in opposite ways once a conversion produces a non-round number:
//   - 'count' (pcs/dozen): people count individual items, never fractional
//     dozens — "0.5 dozen eggs" is not something anyone says, "6 eggs" is.
//     So a result that doesn't divide evenly back into the coarser unit
//     drops to the finer one (pcs) instead of going fractional.
//   - 'measured' (g/kg, ml/l): the opposite is true — "1.5 kg" or "2.5 l"
//     is completely normal grocery-speak, while blowing a small weight up
//     into its base unit ("2500 g" instead of "2.5 kg") is not, and would
//     also risk tripping the app's own 999 max-quantity validation for
//     perfectly ordinary amounts. So these always stay in the item's
//     existing unit and go decimal instead of switching units.
interface UnitGroup {
  units: ItemUnit[]
  factor: Partial<Record<ItemUnit, number>> // how many of the group's finest unit one of each unit is worth
  style: 'count' | 'measured'
}

const UNIT_GROUPS: UnitGroup[] = [
  { units: ['pcs', 'dozen'], factor: { pcs: 1, dozen: 12 }, style: 'count' },
  { units: ['g', 'kg'], factor: { g: 1, kg: 1000 }, style: 'measured' },
  { units: ['ml', 'l'], factor: { ml: 1, l: 1000 }, style: 'measured' },
]
// 'pack' and 'bottle' are deliberately absent: a "pack" has no fixed size
// (a pack of gum isn't a pack of paper towels), so there's nothing to
// convert to/from — those fall back to a literal same-unit
// subtraction/addition, same as before this feature existed.

function groupOf(unit: ItemUnit): UnitGroup | undefined {
  return UNIT_GROUPS.find((group) => group.units.includes(unit))
}

// A spoken quantity with no unit of its own ("add 6 eggs", "remove 6
// eggs") reads differently depending on how the item is already tracked:
// against 'dozen' a bare count means individual items (see the 'count'
// style note above), but against every other tracked unit a bare count
// means "more/less of that same unit" (against "2 l" of milk, a bare "1"
// means 1 more liter).
export function resolveImpliedUnit(trackedUnit: ItemUnit): ItemUnit {
  return trackedUnit === 'dozen' ? 'pcs' : trackedUnit
}

export interface QuantityAmount {
  quantity: number
  unit: ItemUnit
}

// A fresh (not-yet-merged) spoken amount like "half a dozen eggs" needs the
// same count-vs-measured display rule combineInGroup applies during a
// merge, even though there's nothing to merge into yet — otherwise a
// brand-new item would be created showing "0.5 dozen" instead of "6 pcs".
// 'measured' amounts (0.5 kg, 0.5 l) are left as-is: a decimal weight/
// volume is completely normal grocery-speak, unlike a fractional dozen.
export function normalizeAmount(amount: QuantityAmount): QuantityAmount {
  if (Number.isInteger(amount.quantity)) return amount
  const group = groupOf(amount.unit)
  if (!group || group.style !== 'count') return amount
  const baseUnit = group.units.find((u) => (group.factor[u] ?? 1) === 1) ?? amount.unit
  return { quantity: amount.quantity * (group.factor[amount.unit] ?? 1), unit: baseUnit }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Shared by combineQuantities/resolveRemoval: apply `combine` to the two
// amounts (already known to be in the same convertible group) and
// re-express the result per that group's display style — see UnitGroup's
// doc comment above for why 'count' and 'measured' land differently.
function combineInGroup(
  group: UnitGroup,
  existing: QuantityAmount,
  other: QuantityAmount,
  combine: (a: number, b: number) => number
): QuantityAmount {
  if (group.style === 'measured') {
    const existingFactor = group.factor[existing.unit] ?? 1
    const otherInExistingUnit = (other.quantity * (group.factor[other.unit] ?? 1)) / existingFactor
    return { quantity: round2(combine(existing.quantity, otherInExistingUnit)), unit: existing.unit }
  }

  const existingBase = existing.quantity * (group.factor[existing.unit] ?? 1)
  const otherBase = other.quantity * (group.factor[other.unit] ?? 1)
  const resultBase = combine(existingBase, otherBase)

  const originalFactor = group.factor[existing.unit] ?? 1
  if (originalFactor > 1 && resultBase % originalFactor === 0) {
    return { quantity: resultBase / originalFactor, unit: existing.unit }
  }
  const baseUnit = group.units.find((u) => (group.factor[u] ?? 1) === 1) ?? existing.unit
  return { quantity: resultBase, unit: baseUnit }
}

// Step 24 (cart pricing): converts `amount` into `toUnit` when both belong
// to the same convertible group (see UNIT_GROUPS) — e.g. 500 g -> 0.5 kg,
// so a cart row tracked in grams can still be priced against a catalog
// product listed per kg. Returns the amount unchanged when the units
// already match, and undefined when there's no honest conversion at all
// (different groups entirely, e.g. l -> pcs, or an atomic unit like
// pack/bottle with no fixed size) — same "don't guess" reasoning as
// combineQuantities/resolveRemoval falling back to a literal same-unit op.
export function convertQuantity(amount: QuantityAmount, toUnit: ItemUnit): QuantityAmount | undefined {
  if (amount.unit === toUnit) return amount
  const group = groupOf(amount.unit)
  if (!group || group !== groupOf(toUnit)) return undefined
  const amountBase = amount.quantity * (group.factor[amount.unit] ?? 1)
  const toFactor = group.factor[toUnit] ?? 1
  return { quantity: round2(amountBase / toFactor), unit: toUnit }
}

// "Add 6 eggs" onto "1 dozen eggs" -> 18 pcs. "Add 500 ml" onto "2 l" ->
// 2.5 l. Falls back to a literal add of the raw numbers, keeping the
// existing unit, when the two units aren't in the same convertible group
// (same-unit adds — by far the common case — and mismatched atomic units
// like pack/bottle).
export function combineQuantities(existing: QuantityAmount, addition: QuantityAmount): QuantityAmount {
  const group = groupOf(existing.unit)
  if (!group || group !== groupOf(addition.unit)) {
    return { quantity: existing.quantity + addition.quantity, unit: existing.unit }
  }
  return combineInGroup(group, existing, addition, (a, b) => a + b)
}

export type RemovalOutcome = 'remove-all' | QuantityAmount

// "Remove 6 eggs" out of "1 dozen eggs" -> 6 pcs. "Remove 500 ml" out of
// "2 l" -> 1.5 l. Returns 'remove-all' once the removal amount reaches or
// exceeds what's there (compared via each group's finest unit, so units
// don't need to match to compare correctly), so the caller deletes the row
// instead of leaving a zero/negative quantity behind. Falls back to a
// literal same-unit subtraction, same as combineQuantities, when the units
// aren't convertible against each other.
export function resolveRemoval(existing: QuantityAmount, remove: QuantityAmount): RemovalOutcome {
  const group = groupOf(existing.unit)
  const sharedGroup = group && group === groupOf(remove.unit) ? group : undefined

  if (!sharedGroup) {
    if (remove.quantity >= existing.quantity) return 'remove-all'
    return { quantity: existing.quantity - remove.quantity, unit: existing.unit }
  }

  const existingBase = existing.quantity * (sharedGroup.factor[existing.unit] ?? 1)
  const removeBase = remove.quantity * (sharedGroup.factor[remove.unit] ?? 1)
  if (removeBase >= existingBase) return 'remove-all'

  return combineInGroup(sharedGroup, existing, remove, (a, b) => a - b)
}
