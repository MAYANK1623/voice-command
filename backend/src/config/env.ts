import 'dotenv/config'

// Central place for reading process.env so the rest of the app never touches
// process.env directly and always gets typed, defaulted values.
export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Comma-separated in production (e.g. a custom domain + the platform's
  // own issued domain both need to be allowed) — only relevant at all if
  // the frontend is hosted on a different origin than this API; the
  // recommended single-service deploy (see index.ts) is same-origin and
  // never hits CORS in the first place.
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()),
}

export const isProduction = env.nodeEnv === 'production'
