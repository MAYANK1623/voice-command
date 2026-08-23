import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import * as productsController from '../controllers/productsController.js'

export const productsRouter = Router()

productsRouter.get('/', asyncHandler(productsController.getProducts))
productsRouter.get('/search', asyncHandler(productsController.getSearchProducts))
productsRouter.get('/substitutes', asyncHandler(productsController.getSubstitutes))
productsRouter.get('/seasonal', asyncHandler(productsController.getSeasonal))
