import type { Request, Response } from 'express'
import * as productsService from '../services/productsService.js'
import { searchProductsQuerySchema, substituteQuerySchema } from '../validators/productValidators.js'
import { ApiError } from '../utils/ApiError.js'

export async function getProducts(_req: Request, res: Response) {
  res.json({ products: productsService.listProducts() })
}

export async function getSearchProducts(req: Request, res: Response) {
  const parsed = searchProductsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid search query', parsed.error.flatten())
  }
  const products = productsService.searchProducts(parsed.data)
  res.json({ products })
}

export async function getSubstitutes(req: Request, res: Response) {
  const parsed = substituteQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid substitute query', parsed.error.flatten())
  }
  const products = productsService.findSubstitutes(parsed.data)
  res.json({ products })
}

export async function getSeasonal(_req: Request, res: Response) {
  res.json({ recommendations: productsService.getSeasonalRecommendations() })
}
