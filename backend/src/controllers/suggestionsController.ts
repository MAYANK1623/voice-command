import type { Request, Response } from 'express'
import * as suggestionsService from '../services/suggestionsService.js'
import { suggestionsQuerySchema } from '../validators/suggestionsValidators.js'
import { ApiError } from '../utils/ApiError.js'

export async function getSuggestions(req: Request, res: Response) {
  const parsed = suggestionsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid suggestions query', parsed.error.flatten())
  }
  const excludeNames = parsed.data.exclude
    ? parsed.data.exclude.split(',').map((name) => name.trim()).filter(Boolean)
    : []
  const suggestions = await suggestionsService.getSuggestions(excludeNames)
  res.json({ suggestions })
}
