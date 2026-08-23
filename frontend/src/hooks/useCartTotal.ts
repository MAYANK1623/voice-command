import { useMemo } from 'react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { estimateItemPrice } from '@/lib/pricing'

export interface CartTotal {
  total: number
  pricedCount: number
  unpricedCount: number
}

// Step 24: the single source of truth for "amount to be paid" — shared by
// CartTotal (the full summary card in the list) and MicButton's compact
// badge (always visible, since MicButton is fixed) so the two never drift
// out of sync with each other. Only unchecked items count (checked-off is
// already bought, not still owed); items that don't resolve to a catalog
// price (see lib/pricing.ts) are excluded from the sum but still counted
// in unpricedCount so callers can disclose the gap instead of hiding it.
export function useCartTotal(): CartTotal {
  const items = useShoppingListStore((state) => state.items)
  const catalog = useShoppingListStore((state) => state.catalog)

  return useMemo(() => {
    const unchecked = items.filter((item) => !item.checked)
    let total = 0
    let pricedCount = 0
    for (const item of unchecked) {
      const price = estimateItemPrice(item, catalog)
      if (price) {
        total += price.lineTotal
        pricedCount += 1
      }
    }
    return { total: Math.round(total * 100) / 100, pricedCount, unpricedCount: unchecked.length - pricedCount }
  }, [items, catalog])
}
