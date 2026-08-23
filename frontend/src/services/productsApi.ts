import { api } from '@/lib/apiClient'
import type { ItemCategory, Product, SeasonalRecommendation } from '@/types'

export interface ProductSearchFilters {
  query?: string
  minPrice?: number
  maxPrice?: number
}

interface ProductsSearchResponse {
  products: Product[]
}

interface SeasonalResponse {
  recommendations: SeasonalRecommendation[]
}

function buildQueryString(filters: ProductSearchFilters): string {
  const params = new URLSearchParams()
  if (filters.query) params.set('q', filters.query)
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export interface SubstituteFilters {
  name?: string
  category?: ItemCategory
}

function buildSubstituteQueryString(filters: SubstituteFilters): string {
  const params = new URLSearchParams()
  if (filters.name) params.set('name', filters.name)
  if (filters.category) params.set('category', filters.category)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

// Maps to backend/src/routes/productsRoutes.ts. Used by both the voice
// "search" intent (voice/useVoiceCommands.ts) and the manual SearchBar
// fallback — same two-entry-points-into-one-layer pattern Day 2 set up for
// items (see workdone.md).
export const productsApi = {
  search: (filters: ProductSearchFilters) =>
    api.get<ProductsSearchResponse>(`/products/search${buildQueryString(filters)}`).then((r) => r.products),
  // Full, uncapped catalog — for the empty-cart browse view, not search.
  list: () => api.get<ProductsSearchResponse>('/products').then((r) => r.products),
  // Step 14: alternatives to an item, same category (resolved server-side
  // from `name` against the catalog, or from `category` directly).
  substitutes: (filters: SubstituteFilters) =>
    api.get<ProductsSearchResponse>(`/products/substitutes${buildSubstituteQueryString(filters)}`).then((r) => r.products),
  // Step 23: "why buy this now" — in season and/or on sale, recomputed
  // server-side against the real current month/catalog on every call.
  seasonal: () => api.get<SeasonalResponse>('/products/seasonal').then((r) => r.recommendations),
}
