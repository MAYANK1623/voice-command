import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler.js'
import * as itemsController from '../controllers/itemsController.js'

export const itemsRouter = Router()

// Registered before '/:id' so it's never shadowed by the id param route.
itemsRouter.post('/clear-checked', asyncHandler(itemsController.postClearChecked))

itemsRouter.get('/', asyncHandler(itemsController.getItems))
itemsRouter.post('/', asyncHandler(itemsController.postItem))
itemsRouter.patch('/:id', asyncHandler(itemsController.patchItem))
itemsRouter.delete('/:id', asyncHandler(itemsController.deleteItem))
