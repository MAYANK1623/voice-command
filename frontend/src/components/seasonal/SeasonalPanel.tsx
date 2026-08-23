import { useEffect } from 'react'
import { Leaf } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { ProductRow } from '@/components/search/ProductRow'
import type { SeasonalRecommendation } from '@/types'

function badgesFor(item: SeasonalRecommendation): string[] {
  const badges: string[] = []
  if (item.inSeason) badges.push('🌱 In season')
  if (item.onSale && item.salePercent) badges.push(`🏷️ ${item.salePercent}% off`)
  return badges
}

// Step 23: "why buy this now" — in season and/or on sale, derived from the
// static catalog (backend/src/data/productCatalog.ts's seasonMonths/
// salePercent) rather than purchase history, unlike SuggestionsPanel.
// Reuses ProductRow (same "Add to list" action as search results/browsing)
// rather than a bespoke card, passing its computed badges/salePrice
// through the two optional props ProductRow gained for exactly this.
// Fetched once when the shopping list mounts, same as SuggestionsPanel;
// renders nothing while there's nothing to show, same "no clutter" pattern
// as the rest of this app's panels.
export function SeasonalPanel() {
  const seasonal = useShoppingListStore((state) => state.seasonal)
  const isLoading = useShoppingListStore((state) => state.isSeasonalLoading)
  const fetchSeasonal = useShoppingListStore((state) => state.fetchSeasonal)

  useEffect(() => {
    fetchSeasonal()
  }, [fetchSeasonal])

  if (isLoading || seasonal.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        <Leaf size={12} />
        Seasonal picks
      </p>
      <ul className="flex flex-col gap-2">
        {seasonal.map((item) => (
          <ProductRow key={item.id} product={item} badges={badgesFor(item)} salePrice={item.salePrice} />
        ))}
      </ul>
    </div>
  )
}
