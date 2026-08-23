import { z } from 'zod'

// `exclude` arrives as a single comma-separated string (query params can't
// carry arrays cleanly without bracket/repeat conventions) — split into a
// clean array downstream in the controller.
export const suggestionsQuerySchema = z.object({
  exclude: z.string().trim().max(2000).optional(),
})
export type SuggestionsQuery = z.infer<typeof suggestionsQuerySchema>
