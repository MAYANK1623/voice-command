import { useCartTotal } from '@/hooks/useCartTotal'
import { formatPrice } from '@/lib/format'

// Step 24: a compact "estimated total" pill placed right beside the mic
// button (see MicButton.tsx) — unlike the full CartTotal card further up
// the list, this one lives in MicButton's fixed bottom bar, so it's always
// on screen regardless of scroll position, the same way the mic button
// itself always is. Shares the exact same sum as CartTotal via
// hooks/useCartTotal.ts rather than recomputing it, so the two can never
// disagree. A leading "~" discloses when some items were left out of the
// sum for lack of a resolvable price, without repeating the full "N items
// not included" sentence CartTotal already carries — that's one tap away
// via the visible summary card, not hidden, just not duplicated here.
export function CartTotalBadge() {
  const { total, pricedCount, unpricedCount } = useCartTotal()

  if (pricedCount === 0) return null

  return (
    <div className="flex flex-col items-center rounded-2xl bg-surface px-3 py-1.5 shadow-card">
      <span className="text-[9px] font-medium uppercase tracking-wide text-ink-faint">Est. total</span>
      <span className="text-sm font-semibold text-ink">
        {unpricedCount > 0 && '~'}
        {formatPrice(total)}
      </span>
    </div>
  )
}
