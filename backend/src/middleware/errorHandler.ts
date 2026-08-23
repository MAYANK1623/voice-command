import type { NextFunction, Request, Response } from 'express'
import { ApiError } from '../utils/ApiError.js'
import { isProduction } from '../config/env.js'

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  })
}

// Express recognizes an error-handling middleware by its 4-argument arity —
// keep all four params even though `next` is unused, or Express will treat
// this as a normal middleware and never call it on errors.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { message: err.message, details: err.details },
    })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({
    error: {
      message: 'Internal server error',
      // Never leak stack traces / internals once deployed.
      ...(isProduction ? {} : { debug: err instanceof Error ? err.stack : err }),
    },
  })
}
