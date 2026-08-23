// A typed error carrying an HTTP status so the central error handler can
// respond correctly without every route re-implementing status logic.
// Used from Day 2 onward by controllers (e.g. `throw new ApiError(404, 'Item not found')`).
export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details)
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message)
  }
}
