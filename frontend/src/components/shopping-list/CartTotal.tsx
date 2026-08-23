import { useCartTotal } from '@/hooks/useCartTotal'
import { formatPrice } from '@/lib/format'

// Step 24: a running "amount to be paid" for the list, priced against the
// same product catalog voice search/suggestions/substitutes/seasonal picks
// already use — not a separate pricing source (see lib/pricing.ts via
// hooks/useCartTotal.ts, also used by MicButton's compact badge). Items
// that don't resolve to a catalog price are silently excluded from the sum
// rather than guessed at — but that's disclosed via the "N items not
// included" note below rather than presenting a partial total as complete.
// Renders nothing until there's at least one priced, unchecked item.
export function CartTotal() {
  const { total, pricedCount, unpricedCount } = useCartTotal()

  if (pricedCount === 0) return null

  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-surface p-3 shadow-card">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Estimated total</p>
        {unpricedCount > 0 && (
          <p className="truncate text-[11px] text-ink-faint">
            {unpricedCount} item{unpricedCount === 1 ? '' : 's'} without a listed price not included
          </p>
        )}
      </div>
      <p className="shrink-0 text-lg font-semibold text-ink">{formatPrice(total)}</p>
    </div>
  )
}
