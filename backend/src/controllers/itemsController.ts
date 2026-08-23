import type { Request, Response } from 'express'
import * as itemsService from '../services/itemsService.js'
import { createItemSchema, updateItemSchema } from '../validators/itemValidators.js'
import { ApiError } from '../utils/ApiError.js'

export async function getItems(_req: Request, res: Response) {
  const items = await itemsService.listItems()
  res.json({ items })
}

export async function postItem(req: Request, res: Response) {
  const parsed = createItemSchema.safeParse(req.body)
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid item payload', parsed.error.flatten())
  }
  const item = await itemsService.createItem(parsed.data)
  res.status(201).json({ item })
}

export async function patchItem(req: Request, res: Response) {
  const parsed = updateItemSchema.safeParse(req.body)
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid update payload', parsed.error.flatten())
  }
  const item = await itemsService.updateItem(req.params.id, parsed.data)
  res.json({ item })
}

export async function deleteItem(req: Request, res: Response) {
  await itemsService.removeItem(req.params.id)
  res.status(204).end()
}

export async function postClearChecked(_req: Request, res: Response) {
  const removed = await itemsService.clearCheckedItems()
  res.json({ removed })
}
