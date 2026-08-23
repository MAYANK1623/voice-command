import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Separate from vite.config.ts (not merged into it) so `vitest run` never
// needs the dev-server-only bits (proxy, port) — just the same '@' alias
// the app itself uses, so test imports match source imports exactly.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node', // pure logic tests (parser, i18n, unit conversion) — no DOM needed
  },
})
