import type { NextFunction, Request, RequestHandler, Response } from 'express'

// Express 4 does not catch rejected promises from async route handlers —
// an unhandled rejection there just hangs the request instead of reaching
// errorHandler. Wrapping every async handler in this forwards the
// rejection to next(), which does reach it.
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
