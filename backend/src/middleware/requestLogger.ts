import type { NextFunction, Request, Response } from 'express'

// Minimal structured request logger. Deliberately dependency-free (no
// morgan) to keep the backend's install surface small — this is the kind
// of thing that's easy to swap for pino/morgan later if log volume grows.
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`
    if (res.statusCode >= 500) {
      console.error(line)
    } else if (res.statusCode >= 400) {
      console.warn(line)
    } else {
      console.log(line)
    }
  })

  next()
}
