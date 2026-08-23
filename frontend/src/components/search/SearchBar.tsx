import { useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { extractPriceRange } from '@/voice/priceFilters'

// Manual complement to the voice "search" intent (Step 11/12) — same
// two-entry-points-into-one-layer pattern Day 2 set up for QuickAddForm vs.
// voice add. Reuses extractPriceRange so typing "toothpaste under $5"
// behaves identically to saying it. Collapsed to an icon by default to
// keep the default view minimalist per the brief's UI requirement.
export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')
  const searchProducts = useShoppingListStore((state) => state.searchProducts)
  const clearSearchResults = useShoppingListStore((state) => state.clearSearchResults)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    const { minPrice, maxPrice, rest } = extractPriceRange(trimmed)
    searchProducts({ query: rest, minPrice, maxPrice })
  }

  function close() {
    setIsOpen(false)
    setValue('')
    clearSearchResults()
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Search products"
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink"
      >
        <Search size={16} />
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-1.5">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="h-9 w-full min-w-0 rounded-full border border-gray-200 bg-surface px-3 text-xs text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink"
      >
        <X size={16} />
      </button>
    </form>
  )
}
