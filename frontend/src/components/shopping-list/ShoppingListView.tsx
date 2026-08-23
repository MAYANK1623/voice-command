import { useEffect, useMemo } from 'react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { CATEGORY_ORDER } from '@/data/categoryMeta'
import { CategorySection } from './CategorySection'
import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'
import { QuickAddForm } from './QuickAddForm'
import { ErrorBanner } from '@/components/common/ErrorBanner'
import { SearchResultsPanel } from '@/components/search/SearchResultsPanel'
import { SuggestionsPanel } from '@/components/suggestions/SuggestionsPanel'
import { SeasonalPanel } from '@/components/seasonal/SeasonalPanel'
import { CartTotal } from './CartTotal'

export function ShoppingListView() {
  const items = useShoppingListStore((state) => state.items)
  const isLoading = useShoppingListStore((state) => state.isLoading)
  const error = useShoppingListStore((state) => state.error)
  const fetchItems = useShoppingListStore((state) => state.fetchItems)
  const dismissError = useShoppingListStore((state) => state.dismissError)
  const fetchCatalog = useShoppingListStore((state) => state.fetchCatalog)

  useEffect(() => {
    fetchItems()
    // Step 24: cart pricing (ItemCard/CartTotal) needs the catalog too, and
    // unlike EmptyState this view mounts whether the cart is empty or not
    // — fetchCatalog is idempotent (see the store), so this is safe to
    // call alongside EmptyState's own call without double-fetching.
    fetchCatalog()
  }, [fetchItems, fetchCatalog])

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0)
  }, [items])

  const showInitialLoading = isLoading && items.length === 0
  // Retry only makes sense when there's nothing on screen because the
  // initial fetch itself failed — a safely re-runnable, no-argument
  // action. An error from a later add/remove/etc. still shows (dismissible,
  // unchanged), just without a generic retry (see ErrorBanner's doc comment).
  const isInitialLoadFailure = Boolean(error) && items.length === 0 && !isLoading

  return (
    <div className="flex flex-col gap-4 pb-32">
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={dismissError}
          onRetry={isInitialLoadFailure ? fetchItems : undefined}
        />
      )}
      <QuickAddForm />
      <SuggestionsPanel />
      <SeasonalPanel />
      <SearchResultsPanel />

      {showInitialLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          <CartTotal />
          {groups.map((group) => (
            <CategorySection key={group.category} category={group.category} items={group.items} />
          ))}
        </div>
      )}
    </div>
  )
}
