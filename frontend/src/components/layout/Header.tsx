import { ShoppingBasket } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { SearchBar } from '@/components/search/SearchBar'

export function Header() {
  const totalCount = useShoppingListStore((state) => state.items.length)
  const checkedCount = useShoppingListStore(
    (state) => state.items.filter((item) => item.checked).length
  )
  const clearChecked = useShoppingListStore((state) => state.clearChecked)
  const remainingCount = totalCount - checkedCount

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-card">
            <ShoppingBasket size={18} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-base font-bold leading-tight text-ink">VoiceCart</h1>
            <p className="text-xs leading-tight text-ink-muted">Say it. It's on the list.</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 justify-end">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {checkedCount > 0 && (
            <button
              type="button"
              onClick={() => clearChecked()}
              className="whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
            >
              Clear {checkedCount} done
            </button>
          )}
          {totalCount > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">
                {remainingCount}
                <span className="text-ink-faint"> / {totalCount}</span>
              </p>
              <p className="text-[11px] text-ink-muted">items left</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
