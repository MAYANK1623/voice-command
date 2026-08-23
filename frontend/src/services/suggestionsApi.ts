import { api } from '@/lib/apiClient'
import type { Suggestion } from '@/types'

interface SuggestionsResponse {
  suggestions: Suggestion[]
}

// Maps to backend/src/routes/suggestionsRoutes.ts. `excludeNames` asks for
// a genuinely different batch once the current one is resolved — see the
// backend service's doc comment for why that's needed at all.
export const suggestionsApi = {
  list: (excludeNames: string[] = []) => {
    const qs = excludeNames.length > 0 ? `?exclude=${encodeURIComponent(excludeNames.join(','))}` : ''
    return api.get<SuggestionsResponse>(`/suggestions${qs}`).then((r) => r.suggestions)
  },
}
