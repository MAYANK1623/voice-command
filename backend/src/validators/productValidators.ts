import { z } from 'zod'
import { ITEM_CATEGORIES } from '../types/index.js'

// Query-string input, so every field arrives as a string (or is absent) —
// z.coerce turns "4.99" into 4.99, same pattern zod recommends for query
// params. maxPrice below minPrice is a user-error we let through rather
// than 400 on: it just yields zero results, which is a fine answer to a
// nonsensical range.
export const searchProductsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().nonnegative('minPrice must be 0 or more').optional(),
  maxPrice: z.coerce.number().nonnegative('maxPrice must be 0 or more').optional(),
})
export type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>

// Step 14: at least one of name/category is required to know what aisle
// to look in — refined below rather than making both required, since
// either alone is enough (name resolves to a category via the catalog;
// category alone works when the caller already knows it, e.g. from the
// ShoppingItem being substituted).
export const substituteQuerySchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    category: z.enum(ITEM_CATEGORIES).optional(),
  })
  .refine((data) => data.name || data.category, { message: 'Provide a name or category to find substitutes for' })
export type SubstituteQuery = z.infer<typeof substituteQuerySchema>
