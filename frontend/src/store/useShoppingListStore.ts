import { create } from 'zustand'
import type { ItemCategory, ItemUnit, Product, SeasonalRecommendation, ShoppingItem, Suggestion, VoiceState } from '@/types'
import { itemsApi, type CreateItemPayload, type UpdateItemPayload } from '@/services/itemsApi'
import { productsApi, type ProductSearchFilters, type SubstituteFilters } from '@/services/productsApi'
import { suggestionsApi } from '@/services/suggestionsApi'
import { ApiClientError } from '@/lib/apiClient'
import { DEFAULT_VOICE_LANG } from '@/voice/i18n/languages'
import { normalizeItemName } from '@/voice/matchItem'
import { combineQuantities, resolveImpliedUnit } from '@/voice/unitConversion'
import { inferCategory } from '@/voice/categoryKeywords'

// Persisted across reloads so the picked language sticks — Day 4, Step 10.
// Guarded because this module also gets imported by non-browser tooling
// (e.g. the smoke-test scripts under scripts/), where `localStorage` and
// `window` don't exist.
const VOICE_LANG_STORAGE_KEY = 'voicecart.voiceLang'

function readStoredVoiceLang(): string {
  if (typeof window === 'undefined') return DEFAULT_VOICE_LANG
  try {
    return window.localStorage.getItem(VOICE_LANG_STORAGE_KEY) ?? DEFAULT_VOICE_LANG
  } catch {
    return DEFAULT_VOICE_LANG
  }
}

function writeStoredVoiceLang(lang: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(VOICE_LANG_STORAGE_KEY, lang)
  } catch {
    // Storage unavailable (private browsing, quota) — the picker still
    // works for the current session, it just won't persist. Not worth
    // surfacing as an app error.
  }
}

interface ShoppingListState {
  items: ShoppingItem[]
  isLoading: boolean
  error: string | null
  voiceState: VoiceState
  lastTranscript: string | null
  feedbackMessage: string | null

  // Step 10: the BCP-47 tag SpeechRecognition (and the translate-then-parse
  // step) use — see voice/i18n/.
  voiceLang: string
  setVoiceLang: (lang: string) => void

  // Step 11/12: voice/manual product search results (a separate catalog
  // search, not the shopping list itself — see Product's doc comment).
  // Step 14 (substitutes) reuses this exact same slice rather than a
  // second copy — "show some alternative products" is the same shape of
  // result either way, differing only in how it was sourced, which
  // `searchKind` records purely for the panel's header text.
  searchResults: Product[]
  searchQuery: string | null
  searchKind: 'search' | 'substitute'
  // True when searchKind is 'search' but the query itself matched nothing
  // in the catalog ("unavailable") and searchResults holds a substitutes
  // fallback instead — see searchProducts below. Lets the panel say
  // "couldn't find X, here's what's close" instead of misrepresenting
  // alternatives as exact matches.
  searchFallback: boolean
  isSearching: boolean
  searchError: string | null
  searchProducts: (filters: ProductSearchFilters) => Promise<void>
  findSubstitutes: (filters: SubstituteFilters) => Promise<void>
  clearSearchResults: () => void

  // Step 13: "you're probably low on X" prompts, computed server-side from
  // purchase history — see Suggestion's doc comment. The backend always
  // returns a small fixed batch (3) rather than the whole eligible pool;
  // resolving all of them (accept/dismiss) triggers a fresh fetch that
  // excludes everything already shown this session (`seenSuggestionNames`)
  // so the next batch is a genuinely different 3, not the same ones back.
  suggestions: Suggestion[]
  seenSuggestionNames: string[]
  isSuggestionsLoading: boolean
  suggestionsError: string | null
  fetchSuggestions: () => Promise<void>
  dismissSuggestion: (itemName: string) => void
  acceptSuggestion: (suggestion: Suggestion) => Promise<void>

  // The full product catalog, for the empty-cart "browse and add" view
  // (EmptyState) — a separate, uncapped list from searchResults above.
  // Fetched lazily (only once EmptyState actually mounts) and cached here
  // rather than re-fetched every time the cart happens to be empty.
  catalog: Product[]
  isCatalogLoading: boolean
  catalogError: string | null
  fetchCatalog: () => Promise<void>

  // Step 23: "why buy this now" — in season and/or on sale, derived from
  // the static catalog (not purchase history, unlike suggestions above).
  // Fetched once and cached the same idempotent way as catalog: it's the
  // same catalog data, just filtered/ranked differently, so there's no
  // per-user state to keep re-fetching.
  seasonal: SeasonalRecommendation[]
  isSeasonalLoading: boolean
  seasonalError: string | null
  fetchSeasonal: () => Promise<void>

  // Every action below is optimistic: the local `items` array updates
  // immediately (so the UI never waits on a round-trip), then the request
  // fires in the background. On failure, the local change is rolled back
  // and `error` is set — see ErrorBanner, which surfaces it. Each also
  // resolves to a success boolean (Step 16) so a caller that cares whether
  // it actually worked — chiefly voice's announcements, which otherwise
  // said "Added milk" even when the add silently failed and rolled back —
  // can tell the difference, without every existing caller that doesn't
  // care needing to change (they just don't read the resolved value).
  fetchItems: () => Promise<void>
  addItem: (input: {
    name: string
    quantity?: number
    unit?: ItemUnit
    category?: ItemCategory
    addedVia?: ShoppingItem['addedVia']
  }) => Promise<boolean>
  removeItem: (id: string) => Promise<boolean>
  toggleChecked: (id: string) => Promise<boolean>
  updateQuantity: (id: string, quantity: number, unit?: ItemUnit) => Promise<boolean>
  clearChecked: () => Promise<boolean>
  dismissError: () => void

  // Wired up fully in Day 3 by voice/useSpeechRecognition.ts and
  // voice/useVoiceCommands.ts.
  setVoiceState: (state: VoiceState) => void
  setLastTranscript: (transcript: string | null) => void
  setFeedbackMessage: (message: string | null) => void
}

function tempId(): string {
  return `temp_${Math.random().toString(36).slice(2, 10)}`
}

// Voice-parsed item names arrive all-lowercase (parseCommand normalizes
// the whole transcript before extracting one) — capitalize just the first
// character for display, e.g. "onion" -> "Onion", matching the seeded
// items' casing. A no-op for scripts without letter case (Devanagari), and
// deliberately only the first letter — title-casing every word would wrongly
// capitalize "of"/"and" in a name like "leg of lamb".
function capitalizeFirst(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  voiceState: 'idle',
  lastTranscript: null,
  feedbackMessage: null,

  voiceLang: readStoredVoiceLang(),
  setVoiceLang: (lang) => {
    writeStoredVoiceLang(lang)
    set({ voiceLang: lang })
  },

  searchResults: [],
  searchQuery: null,
  searchKind: 'search',
  searchFallback: false,
  isSearching: false,
  searchError: null,
  searchProducts: async (filters) => {
    set({
      isSearching: true,
      searchError: null,
      searchQuery: filters.query?.trim() || null,
      searchKind: 'search',
      searchFallback: false,
    })
    try {
      const products = await productsApi.search(filters)
      const trimmedQuery = filters.query?.trim()
      if (products.length === 0 && trimmedQuery) {
        // "Unavailable" — nothing in the catalog matched this query at
        // all, so proactively offer alternatives instead of a dead-end
        // "no results" (same substitutes lookup a manual "find a
        // substitute for X" uses). Category is unknown for a query that
        // didn't resolve to any catalog entry, so infer one from the
        // query text the same way voice-added items get auto-categorized.
        const fallback = await productsApi.substitutes({ name: trimmedQuery, category: inferCategory(trimmedQuery) })
        set({ searchResults: fallback, isSearching: false, searchFallback: fallback.length > 0 })
        return
      }
      set({ searchResults: products, isSearching: false })
    } catch (err) {
      set({ isSearching: false, searchError: toErrorMessage(err), searchResults: [] })
    }
  },
  findSubstitutes: async (filters) => {
    set({
      isSearching: true,
      searchError: null,
      searchQuery: filters.name?.trim() || null,
      searchKind: 'substitute',
      searchFallback: false,
    })
    try {
      const products = await productsApi.substitutes(filters)
      set({ searchResults: products, isSearching: false })
    } catch (err) {
      set({ isSearching: false, searchError: toErrorMessage(err), searchResults: [] })
    }
  },
  clearSearchResults: () =>
    set({ searchResults: [], searchQuery: null, searchError: null, searchKind: 'search', searchFallback: false }),

  suggestions: [],
  seenSuggestionNames: [],
  isSuggestionsLoading: false,
  suggestionsError: null,
  fetchSuggestions: async () => {
    set({ isSuggestionsLoading: true, suggestionsError: null })
    try {
      const suggestions = await suggestionsApi.list(get().seenSuggestionNames)
      set({ suggestions, isSuggestionsLoading: false })
    } catch (err) {
      set({ isSuggestionsLoading: false, suggestionsError: toErrorMessage(err) })
    }
  },
  dismissSuggestion: (itemName) => {
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.itemName !== itemName),
      seenSuggestionNames: [...state.seenSuggestionNames, itemName],
    }))
    // That may have been the last of the current batch — pull a fresh,
    // different one right away instead of leaving the panel empty.
    if (get().suggestions.length === 0) get().fetchSuggestions()
  },
  acceptSuggestion: async (suggestion) => {
    // Drop it from the list optimistically so it can't be double-tapped
    // while the add is in flight — addItem has its own rollback for the
    // create itself, this just protects against acting on it twice.
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.itemName !== suggestion.itemName),
      seenSuggestionNames: [...state.seenSuggestionNames, suggestion.itemName],
    }))
    if (get().suggestions.length === 0) get().fetchSuggestions()
    await get().addItem({
      name: suggestion.itemName,
      unit: suggestion.unit,
      category: suggestion.category,
      addedVia: 'suggestion',
    })
  },

  catalog: [],
  isCatalogLoading: false,
  catalogError: null,
  fetchCatalog: async () => {
    // Idempotent: EmptyState calls this on every mount (cart empties and
    // re-empties as items get checked off/removed), but the catalog is
    // static, so skip the round-trip once it's already loaded.
    if (get().catalog.length > 0 || get().isCatalogLoading) return
    set({ isCatalogLoading: true, catalogError: null })
    try {
      const catalog = await productsApi.list()
      set({ catalog, isCatalogLoading: false })
    } catch (err) {
      set({ isCatalogLoading: false, catalogError: toErrorMessage(err) })
    }
  },

  seasonal: [],
  isSeasonalLoading: false,
  seasonalError: null,
  fetchSeasonal: async () => {
    if (get().seasonal.length > 0 || get().isSeasonalLoading) return
    set({ isSeasonalLoading: true, seasonalError: null })
    try {
      const seasonal = await productsApi.seasonal()
      set({ seasonal, isSeasonalLoading: false })
    } catch (err) {
      set({ isSeasonalLoading: false, seasonalError: toErrorMessage(err) })
    }
  },

  fetchItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await itemsApi.list()
      set({ items, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: toErrorMessage(err) })
    }
  },

  addItem: async ({ name, quantity = 1, unit, category = 'other', addedVia = 'manual' }) => {
    const trimmedName = name.trim()
    if (!trimmedName) return false

    // "Add milk" (or "I want 3 milk") when a Milk row is already on the
    // list bumps that row's quantity instead of creating a second "Milk"
    // entry next to it — matches how a person actually uses a shopping
    // list. Only merges into an *unchecked* row: a checked-off item
    // represents something already bought, so asking for it again is a new
    // need, not a correction to old state, and gets its own fresh row.
    // Shared with voice's remove/check target matching (see matchItem.ts)
    // so "same item" means the same thing everywhere it's decided.
    const existing = get().items.find(
      (item) => !item.checked && normalizeItemName(item.name) === normalizeItemName(trimmedName)
    )
    if (existing) {
      // No unit spoken ("add milk", "add 6 eggs") reads as more of
      // whatever unit the existing row already tracks — except 'dozen',
      // where a bare count means individual items (see
      // voice/unitConversion.ts's resolveImpliedUnit doc comment). Then
      // convert through a shared base so "1 dozen" + "6 eggs" -> 18 pcs
      // and "2 l" + "500 ml" -> "2.5 l" instead of just summing mismatched
      // numbers.
      const additionUnit = unit ?? resolveImpliedUnit(existing.unit)
      const combined = combineQuantities(
        { quantity: existing.quantity, unit: existing.unit },
        { quantity, unit: additionUnit }
      )
      return get().updateQuantity(existing.id, combined.quantity, combined.unit)
    }

    const resolvedUnit = unit ?? 'pcs'
    const displayName = capitalizeFirst(trimmedName)
    const now = new Date().toISOString()
    const optimisticItem: ShoppingItem = {
      id: tempId(),
      name: displayName,
      quantity,
      unit: resolvedUnit,
      category,
      checked: false,
      addedVia,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ items: [...state.items, optimisticItem] }))

    const payload: CreateItemPayload = { name: displayName, quantity, unit: resolvedUnit, category, addedVia }
    try {
      const created = await itemsApi.create(payload)
      set((state) => ({
        items: state.items.map((item) => (item.id === optimisticItem.id ? created : item)),
        error: null, // clears a stale error from an earlier, unrelated failure
      }))
      return true
    } catch (err) {
      set((state) => ({
        items: state.items.filter((item) => item.id !== optimisticItem.id),
        error: toErrorMessage(err),
      }))
      return false
    }
  },

  removeItem: async (id) => {
    const previousItems = get().items
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
    try {
      await itemsApi.remove(id)
      set({ error: null })
      return true
    } catch (err) {
      set({ items: previousItems, error: toErrorMessage(err) })
      return false
    }
  },

  toggleChecked: async (id) => {
    const previousItems = get().items
    const target = previousItems.find((item) => item.id === id)
    if (!target) return false

    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    }))
    try {
      await itemsApi.update(id, { checked: !target.checked })
      set({ error: null })
      return true
    } catch (err) {
      set({ items: previousItems, error: toErrorMessage(err) })
      return false
    }
  },

  // `unit` is optional and only passed by callers doing unit-aware
  // add/remove math (see voice/unitConversion.ts) — e.g. "1 dozen" minus
  // "6 pcs" needs to flip the row's unit to 'pcs', not just its number.
  // The everyday +/- steppers in ItemCard never pass it, so the item's
  // unit is left untouched for a plain quantity bump.
  updateQuantity: async (id, quantity, unit) => {
    // The plain +/- steppers (no unit passed) only ever step by whole
    // units, so flooring at 1 is correct for them — quantity 0 isn't a
    // stepper state, Delete is. But unit-aware callers can legitimately
    // ask for 0.5 (half a liter/kg), so they only get a near-zero floor,
    // just enough to guard against a genuine 0/negative reaching the API
    // (resolveRemoval in voice/unitConversion.ts already guarantees a
    // positive result in normal use, returning 'remove-all' instead of a
    // zero/negative quantity, so this floor is a defensive backstop only).
    const safeQuantity = unit ? Math.max(0.01, quantity) : Math.max(1, quantity)
    const previousItems = get().items
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity: safeQuantity, ...(unit ? { unit } : {}) } : item
      ),
    }))
    const patch: UpdateItemPayload = { quantity: safeQuantity, ...(unit ? { unit } : {}) }
    try {
      await itemsApi.update(id, patch)
      set({ error: null })
      return true
    } catch (err) {
      set({ items: previousItems, error: toErrorMessage(err) })
      return false
    }
  },

  clearChecked: async () => {
    const previousItems = get().items
    set((state) => ({ items: state.items.filter((item) => !item.checked) }))
    try {
      await itemsApi.clearChecked()
      set({ error: null })
      return true
    } catch (err) {
      set({ items: previousItems, error: toErrorMessage(err) })
      return false
    }
  },

  dismissError: () => set({ error: null }),

  setVoiceState: (voiceState) => set({ voiceState }),
  setLastTranscript: (lastTranscript) => set({ lastTranscript }),
  setFeedbackMessage: (feedbackMessage) => set({ feedbackMessage }),
}))
