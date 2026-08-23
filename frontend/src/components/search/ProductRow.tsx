import { Plus } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { CATEGORY_META } from '@/data/categoryMeta'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types'

// Shared by SearchResultsPanel (voice/typed search results), EmptyState
// (the full browsable catalog shown while the cart is empty), and
// SeasonalPanel (Step 23) — one row definition, one "Add to list" action,
// reused everywhere a Product needs rendering. `badges`/`salePrice` are
// optional and only ever passed by SeasonalPanel; every other caller is
// unaffected.
export function ProductRow({
  product,
  badges,
  salePrice,
}: {
  product: Product
  badges?: string[]
  salePrice?: number
}) {
  const addItem = useShoppingListStore((state) => state.addItem)
  const meta = CATEGORY_META[product.category]

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-surface p-3 shadow-card">
      <span className="text-xl" aria-hidden="true">
        {meta.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{product.name}</p>
        <p className="truncate text-xs text-ink-muted">
          {product.brand} &middot;{' '}
          {salePrice !== undefined ? (
            <>
              <span className="line-through">{formatPrice(product.price)}</span>{' '}
              <span className="font-semibold text-emerald-600">{formatPrice(salePrice)}</span>
            </>
          ) : (
            formatPrice(product.price)
          )}{' '}
          / {product.unit}
        </p>
        {badges && badges.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label={`Add ${product.name} to list`}
        onClick={() =>
          addItem({ name: product.name, unit: product.unit, category: product.category, addedVia: 'manual' })
        }
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
      >
        <Plus size={16} />
      </button>
    </li>
  )
}
