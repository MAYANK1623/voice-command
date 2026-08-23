import { useEffect, useMemo } from 'react'
import { Mic } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { CATEGORY_ORDER, CATEGORY_META } from '@/data/categoryMeta'
import { ProductRow } from '@/components/search/ProductRow'
import { Badge } from '@/components/common/Badge'

// Shown whenever the cart has nothing in it — which, since the list starts
// blank for every new user (see backend/src/db/seed.ts), is also the very
// first thing anyone sees. Rather than a bare "your list is empty" message,
// this doubles as a browsable view of the full product catalog so there's
// something to actually act on immediately, tapping "Add" (or still just
// using the mic/quick-add, which stay the fastest path for anything not in
// the catalog).
export function EmptyState() {
  const catalog = useShoppingListStore((state) => state.catalog)
  const isCatalogLoading = useShoppingListStore((state) => state.isCatalogLoading)
  const catalogError = useShoppingListStore((state) => state.catalogError)
  const fetchCatalog = useShoppingListStore((state) => state.fetchCatalog)

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      products: catalog.filter((product) => product.category === category),
    })).filter((group) => group.products.length > 0)
  }, [catalog])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <Mic size={20} />
        </span>
        <p className="text-sm font-semibold text-ink">Your cart is empty</p>
        <p className="max-w-[22rem] text-sm text-ink-muted">
          Browse items below, tap the mic and say <span className="font-medium text-ink">“Add milk”</span>, or use
          the field above.
        </p>
      </div>

      {isCatalogLoading && (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading available items">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-surface-sunken" />
          ))}
        </div>
      )}

      {catalogError && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-red-600">{catalogError}</p>
          <button
            type="button"
            onClick={fetchCatalog}
            className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {!isCatalogLoading && !catalogError && groups.length > 0 && (
        <div className="flex flex-col gap-6">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-ink-faint">Browse items to add</p>
          {groups.map((group) => {
            const meta = CATEGORY_META[group.category]
            return (
              <section key={group.category}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span aria-hidden className="text-sm">
                    {meta.emoji}
                  </span>
                  <h2 className="text-sm font-semibold text-ink">{meta.label}</h2>
                  <Badge color={meta.color}>{group.products.length}</Badge>
                </div>
                <ul className="flex flex-col gap-2">
                  {group.products.map((product) => (
                    <ProductRow key={product.id} product={product} />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
