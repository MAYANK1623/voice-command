import { useEffect } from 'react'
import { Plus, Sparkles, X } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { CATEGORY_META } from '@/data/categoryMeta'
import type { Suggestion } from '@/types'

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const acceptSuggestion = useShoppingListStore((state) => state.acceptSuggestion)
  const dismissSuggestion = useShoppingListStore((state) => state.dismissSuggestion)
  const meta = CATEGORY_META[suggestion.category]

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
      <span className="text-xl" aria-hidden="true">
        {meta.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">Running low on {suggestion.itemName}?</p>
        <p className="truncate text-xs text-ink-muted">
          Usually bought every ~{Math.round(suggestion.averageIntervalDays)} days — last one was{' '}
          {Math.round(suggestion.daysSinceLastPurchase)} days ago.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Dismiss suggestion for ${suggestion.itemName}`}
          onClick={() => dismissSuggestion(suggestion.itemName)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-surface-sunken hover:text-ink"
        >
          <X size={14} />
        </button>
        <button
          type="button"
          aria-label={`Add ${suggestion.itemName} to list`}
          onClick={() => acceptSuggestion(suggestion)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white transition-colors hover:bg-amber-600"
        >
          <Plus size={14} />
        </button>
      </div>
    </li>
  )
}

// Step 13: "you're probably low on X" prompts, derived from purchase
// history (see backend/src/services/suggestionsService.ts) rather than
// static rules. The backend always hands back a small fixed batch (3),
// never the whole eligible pool — resolving all of them (accept/dismiss)
// triggers the store to fetch a fresh, genuinely different batch (see
// dismissSuggestion/acceptSuggestion), so this component just renders
// whatever's currently in `suggestions` with no slicing of its own.
// Fetched once when the shopping list mounts; renders nothing while
// there are none, same "no clutter until there's something to show"
// pattern as SearchResultsPanel/EmptyState.
export function SuggestionsPanel() {
  const suggestions = useShoppingListStore((state) => state.suggestions)
  const isLoading = useShoppingListStore((state) => state.isSuggestionsLoading)
  const fetchSuggestions = useShoppingListStore((state) => state.fetchSuggestions)

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  if (isLoading || suggestions.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
        <Sparkles size={12} />
        Suggestions
      </p>
      <ul className="flex flex-col gap-2">
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.itemName} suggestion={suggestion} />
        ))}
      </ul>
    </div>
  )
}
