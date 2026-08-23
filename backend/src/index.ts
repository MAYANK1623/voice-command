import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { env, isProduction } from './config/env.js'
import { requestLogger } from './middleware/requestLogger.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import { itemsRouter } from './routes/itemsRoutes.js'
import { productsRouter } from './routes/productsRoutes.js'
import { suggestionsRouter } from './routes/suggestionsRoutes.js'
import { getDb } from './db/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Day 8: the recommended single-service deploy — this same process serves
// both the API and the built frontend, same-origin, so there's no CORS to
// configure and no second hosted service to pay for/manage. `npm run
// build` at the repo root produces both `backend/dist` (this file, once
// compiled) and `frontend/dist` (the static build) side by side.
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist')

async function main() {
  // Ensure the JSON store is read (and seeded, on first run) before the
  // server starts accepting requests, so the very first request never
  // races the initial disk read.
  await getDb()

  const app = express()

  // Only matters for a *split* deploy (frontend hosted separately, e.g.
  // Vercel + this API on Render) — the recommended same-origin deploy
  // below never sends a cross-origin request in the first place, so this
  // middleware simply never has anything to do there.
  app.use(cors({ origin: env.corsOrigins }))
  app.use(express.json())
  app.use(requestLogger)

  // Health check — used by the hosting platform to verify the service is
  // up, and handy for a quick manual smoke test locally.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'voicecart-backend', timestamp: new Date().toISOString() })
  })

  app.use('/api/items', itemsRouter)
  app.use('/api/products', productsRouter)
  app.use('/api/suggestions', suggestionsRouter)

  if (isProduction) {
    // Serves the built React app's static assets, then falls back to
    // index.html for any other GET so a hard refresh/direct link still
    // works — this is a single-page app with no client-side router today,
    // but the fallback costs nothing and avoids a 404 trap later if one's
    // added. Placed after the /api routes so it never shadows them.
    app.use(express.static(FRONTEND_DIST))
    app.get('*', (req, res, next) => {
      // Never swallow an unmatched /api/* route into the SPA fallback —
      // that should reach notFoundHandler below and return a proper JSON
      // 404, not index.html.
      if (req.path.startsWith('/api')) return next()
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
    })
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  app.listen(env.port, () => {
    console.log(`VoiceCart backend listening on http://localhost:${env.port}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
