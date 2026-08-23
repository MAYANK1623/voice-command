import { api } from '@/lib/apiClient'
import type { ItemCategory, ItemUnit, ShoppingItem } from '@/types'

interface ItemsListResponse {
  items: ShoppingItem[]
}
interface ItemResponse {
  item: ShoppingItem
}
interface ClearCheckedResponse {
  removed: number
}

export interface CreateItemPayload {
  name: string
  quantity?: number
  unit?: ItemUnit
  category?: ItemCategory
  addedVia?: ShoppingItem['addedVia']
}

export type UpdateItemPayload = Partial<
  Pick<ShoppingItem, 'name' | 'quantity' | 'unit' | 'category' | 'checked'>
>

// Maps 1:1 to backend/src/routes/itemsRoutes.ts. Every store action in
// useShoppingListStore.ts calls exactly one of these.
export const itemsApi = {
  list: () => api.get<ItemsListResponse>('/items').then((r) => r.items),
  create: (payload: CreateItemPayload) =>
    api.post<ItemResponse>('/items', payload).then((r) => r.item),
  update: (id: string, patch: UpdateItemPayload) =>
    api.patch<ItemResponse>(`/items/${id}`, patch).then((r) => r.item),
  remove: (id: string) => api.delete<void>(`/items/${id}`),
  clearChecked: () => api.post<ClearCheckedResponse>('/items/clear-checked'),
}
