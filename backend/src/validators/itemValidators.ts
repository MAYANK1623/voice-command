import { z } from 'zod'
import { ADDED_VIA, ITEM_CATEGORIES, ITEM_UNITS } from '../types/index.js'

export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  quantity: z.number().positive('Quantity must be positive').max(999).optional(),
  unit: z.enum(ITEM_UNITS).optional(),
  category: z.enum(ITEM_CATEGORIES).optional(),
  addedVia: z.enum(ADDED_VIA).optional(),
})
export type CreateItemInput = z.infer<typeof createItemSchema>

export const updateItemSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80).optional(),
    quantity: z.number().positive('Quantity must be positive').max(999).optional(),
    unit: z.enum(ITEM_UNITS).optional(),
    category: z.enum(ITEM_CATEGORIES).optional(),
    checked: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Provide at least one field to update',
  })
export type UpdateItemInput = z.infer<typeof updateItemSchema>
