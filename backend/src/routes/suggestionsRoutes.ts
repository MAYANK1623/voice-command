import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import * as suggestionsController from '../controllers/suggestionsController.js'

export const suggestionsRouter = Router()

suggestionsRouter.get('/', asyncHandler(suggestionsController.getSuggestions))
