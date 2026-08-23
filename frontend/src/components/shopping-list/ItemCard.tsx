import { Minus, Plus, Repeat, Trash2 } from 'lucide-react'
import type { ShoppingItem } from '@/types'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { estimateItemPrice } from '@/lib/pricing'
import { formatPrice } from '@/lib/format'

interface ItemCardProps {
  item: ShoppingItem
}

export function ItemCard({ item }: ItemCardProps) {
  const toggleChecked = useShoppingListStore((state) => state.toggleChecked)
  const removeItem = useShoppingListStore((state) => state.removeItem)
  const updateQuantity = useShoppingListStore((state) => state.updateQuantity)
  const findSubstitutes = useShoppingListStore((state) => state.findSubstitutes)
  const catalog = useShoppingListStore((state) => state.catalog)
  // Step 24: best-effort — see estimateItemPrice's doc comment for why an
  // item with no catalog match, or an unconvertible unit, prices as
  // "unknown" (nothing shown) rather than a guess.
  const price = estimateItemPrice(item, catalog)

  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border border-gray-100 bg-surface p-3 shadow-card transition-opacity ${
        item.checked ? 'opacity-50' : ''
      }`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={item.checked ? `Mark ${item.name} as not bought` : `Mark ${item.name} as bought`}
        onClick={() => toggleChecked(item.id)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          item.checked
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-gray-300 text-transparent hover:border-brand-400'
        }`}
      >
        <svg viewBox="0 0 12 10" className="h-3 w-3" fill="none">
          <path
            d="M1 5l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium text-ink ${item.checked ? 'line-through' : ''}`}>
          {item.name}
        </p>
        <p className="text-xs text-ink-muted">
          {item.quantity} {item.unit}
          {price && (
            <>
              {' '}
              &middot;{' '}
              {price.onSale && price.originalUnitPrice !== undefined ? (
                <>
                  <span className="line-through">
                    {formatPrice(price.originalUnitPrice * item.quantity)}
                  </span>{' '}
                  <span className="font-semibold text-emerald-600">{formatPrice(price.lineTotal)}</span>
                </>
              ) : (
                formatPrice(price.lineTotal)
              )}
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={item.quantity <= 1 ? `Remove ${item.name}` : `Decrease quantity of ${item.name}`}
          // Stepping below 1 removes the row instead of getting stuck at
          // 1 forever — updateQuantity floors whole-unit quantities at 1
          // (see the store), so without this the "-" button would do
          // nothing on the last one. The Trash2 button below stays for
          // removing an item regardless of its quantity.
          onClick={() => (item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          aria-label={`Increase quantity of ${item.name}`}
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          aria-label={`Find a substitute for ${item.name}`}
          title="Find a substitute"
          onClick={() => findSubstitutes({ name: item.name, category: item.category })}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:bg-surface-sunken hover:text-ink"
        >
          <Repeat size={14} />
        </button>
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={() => removeItem(item.id)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  )
}
