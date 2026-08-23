// Relative "/api/..." paths by default — the Vite dev proxy forwards
// these to localhost:4000 locally (see vite.config.ts), and in the
// recommended production deploy the same Express process serves both the
// API and this built frontend from one origin (see backend/src/index.ts),
// so no override is ever needed there either.
//
// VITE_API_BASE_URL is only for a *split* deploy — frontend and backend
// hosted as two separate services/origins (e.g. this built as a Vercel
// static site, API on Render) — set at build time to the API's full URL.
// Baked into the bundle by Vite (see .env.example), not read at runtime.
const API_BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api'

export class ApiClientError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    // fetch itself throws on network failure (offline, server down) —
    // distinguish that from an HTTP error status below.
    throw new ApiClientError(0, 'Could not reach the server. Check your connection and try again.')
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body?.error?.message ?? message
    } catch {
      // Non-JSON error body — fall back to statusText above.
    }
    throw new ApiClientError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
