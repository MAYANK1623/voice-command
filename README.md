# VoiceCart — Voice Command Shopping Assistant

A voice-first shopping list app: speak naturally ("add milk", "I need
bananas") and it lands in a categorized, editable shopping list, with smart
suggestions and substitutes as the list grows.

**Live**: [voicecart-nsql.onrender.com](https://voicecart-nsql.onrender.com)
*(free-tier host — the first request after idle may take ~30-60s to
cold-start)*

Built for a technical assessment. Repo: [github.com/MAYANK1623/voice-command](https://github.com/MAYANK1623/voice-command).
See [`docs/DESIGN.md`](./docs/DESIGN.md) for the UI design system.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + TypeScript + lowdb (file-based JSON store)
- **Voice**: Web Speech API (browser-native, free, no API key required)
- **Monorepo**: npm workspaces (`frontend/`, `backend/`)

## Project status

This is a multi-day build, Days 1–9 complete: project setup, UI, a full
CRUD backend + database, voice input, multilingual commands (English/
Spanish/French/Hindi — including Hinglish/Latin-script Hindi),
voice-activated product search with price/brand filtering over a
101-item catalog, a hardened voice/NLP layer (merge-on-add instead of
duplicates, unit-aware quantities across dozen/kg/l, quantity-aware
partial removal), history-based smart suggestions, ranked product
substitutes, seasonal/on-sale recommendations, an estimated price per
cart item and running total (shown both inline and beside the mic
button), purchase history, deployment (single-service architecture,
live on Render), and hardened error/loading states — backed by 111
automated tests (`npm test`). The cart starts empty for every user;
browse the full catalog right from the empty state. Tap the mic and say
things like "Add milk", "Add 2 bottles of water", "Remove 3 bananas",
"Half a dozen eggs", "Find toothpaste under $5", "Find a substitute for
milk", or switch languages and try "añade leche" / "ajoute du lait" /
"दूध जोड़ो" / "1 kilo pyaz jodo".

## Prerequisites

- **Node.js 18.18+** (LTS 20.x recommended) and npm — see
  [nodejs.org](https://nodejs.org) if you don't have it yet.
- Git.

## Getting started

```bash
# from the repo root
npm install          # installs both frontend/ and backend/ workspaces
npm run dev           # runs backend (port 4000) + frontend (port 5173) together
```

Then open http://localhost:5173.

To run them separately:

```bash
npm run dev:backend   # http://localhost:4000  (health check: /api/health)
npm run dev:frontend  # http://localhost:5173
```

## Repository layout

```
frontend/    React + Vite + Tailwind client (mobile-first UI)
backend/     Express + TypeScript API (health check today, CRUD from Day 2)
docs/        Design system and other reference docs
```

## Deployment

Single-service by design: the backend serves the built frontend directly
in production (same origin, no CORS to configure). Live at
[voicecart-nsql.onrender.com](https://voicecart-nsql.onrender.com), via
**Render**: `render.yaml` (Blueprint) — dashboard.render.com → New →
Blueprint → select this repo.

Health check is `/api/health`. Note: Render's free tier has no
persistent disk, so the lowdb `db.json` (shopping list, purchase
history) resets on every redeploy/restart — fine for a demo, called out
here rather than silently accepted.

## Approach (200-word write-up)

VoiceCart is a voice-first shopping list: a React/TypeScript frontend
talks to an Express/TypeScript API over a lowdb JSON store, monorepo'd
with npm workspaces and shipped as one deployable service (the backend
serves the built frontend, same-origin — no CORS, no second host).

The build was staged, not architected upfront: CRUD first, then voice
input, then a rule-based NLP layer for parsing commands (add/remove/find/
substitute) across English, Spanish, French, and Hindi/Hinglish —
deliberately no external LLM or translation API, so it stays instant,
offline, and free, at the honest cost of a fixed vocabulary rather than
open-ended understanding. The same "explainable, no black box" choice
runs through suggestions (purchase-history interval math), substitutes
(shared-tag + shared-name-word ranking), seasonal picks (calendar months
on the catalog itself), and cart pricing (catalog lookup + unit
conversion, never a guess when it can't resolve honestly).

Reliability came from actually running the app repeatedly against real
phrasing, not just unit tests — several real bugs (sale prices not
applying, "water bottle" never matching, brand-qualified adds failing)
were only found that way, each now covered by both a dedicated test and
a live verification. 111 automated tests, both workspaces typecheck
clean.
