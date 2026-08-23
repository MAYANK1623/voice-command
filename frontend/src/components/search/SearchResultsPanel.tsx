import { Search, X } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { ProductRow } from './ProductRow'

// Step 11/12 (search) and Step 14 (substitutes) share this one panel —
// shows results from any entry point: the voice "search"/"substitute"
// intent (useVoiceCommands.ts), the manual SearchBar, or a "Find
// alternatives" tap — since all of them call into the same
// store.searchResults slice (see the store's searchKind doc comment).
// Renders nothing until something has actually happened, so it never adds
// visual clutter to the minimalist default view.
export function SearchResultsPanel() {
  const searchQuery = useShoppingListStore((state) => state.searchQuery)
  const searchKind = useShoppingListStore((state) => state.searchKind)
  const searchFallback = useShoppingListStore((state) => state.searchFallback)
  const isSearching = useShoppingListStore((state) => state.isSearching)
  const searchError = useShoppingListStore((state) => state.searchError)
  const searchResults = useShoppingListStore((state) => state.searchResults)
  const clearSearchResults = useShoppingListStore((state) => state.clearSearchResults)

  const isActive = Boolean(searchQuery) || isSearching || Boolean(searchError) || searchResults.length > 0
  if (!isActive) return null

  const isSubstitute = searchKind === 'substitute'
  // Step 14 "unavailable" case: the query itself matched nothing in the
  // catalog, so searchResults holds a substitutes fallback instead of
  // exact matches — say so, rather than implying "X" was actually found.
  const heading = searchQuery
    ? isSubstitute
      ? `Alternatives to "${searchQuery}"`
      : searchFallback
        ? `Couldn't find "${searchQuery}" — here's what's close`
        : `Results for "${searchQuery}"`
    : isSubstitute
      ? 'Alternatives'
      : 'Search results'

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
          <Search size={14} className="shrink-0 text-brand-600" />
          <span className="truncate">{heading}</span>
        </p>
        <button
          type="button"
          aria-label="Close results"
          onClick={clearSearchResults}
          className="shrink-0 rounded-full p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>

      {isSearching && <p className="text-xs text-ink-muted">{isSubstitute ? 'Looking…' : 'Searching…'}</p>}
      {searchError && <p className="text-xs text-red-600">{searchError}</p>}
      {!isSearching && !searchError && searchResults.length === 0 && (
        <p className="text-xs text-ink-muted">
          {isSubstitute
            ? "No alternatives found in that category."
            : 'No products matched. Try a different item, brand, or price range.'}
        </p>
      )}

      {searchResults.length > 0 && (
        <ul className="flex flex-col gap-2">
          {searchResults.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </ul>
      )}
    </div>
  )
}
