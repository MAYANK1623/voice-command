# VoiceCart — UI/UX Design

This document captures the design decisions for Day 1, Step 2, before any
React components were built. Tailwind tokens in `frontend/tailwind.config.js`
implement everything below directly (see `brand`, `accent`, `surface`, `ink`).

## Product framing

VoiceCart is **voice-first, mobile-first**. The core interaction loop is:
speak → see it appear on the list → glance to confirm. Every screen decision
follows from that: large tap targets, minimal chrome, one thumb-reachable
primary action (the mic), and immediate visual feedback for anything spoken.

## Color palette

| Token | Hex | Used for |
|---|---|---|
| `brand-500` | `#16A34A` (emerald) | Primary actions, logo mark, idle mic, checked state |
| `brand-600` | `#15803D` | Hover/active variant of primary |
| `accent-500` | `#F97316` (coral) | The mic **while listening** — must read as "different from idle" at a glance |
| `surface` / `surface-muted` | `#FFFFFF` / `#F9FAFB` | Card background / page background |
| `ink` / `ink-muted` / `ink-faint` | `#111827` / `#6B7280` / `#9CA3AF` | Primary / secondary / tertiary text |
| category colors | green/blue/amber/orange/purple/slate/gray | One distinct pastel per category badge, see `categoryMeta.ts` |

Rationale: emerald reads as "fresh/grocery" without being a cliché "app blue",
and reserving coral/orange *only* for the active listening state means the
user never has to read text to know the app heard them — the color change is
enough. Semantic colors (red for destructive, green for success) are kept
separate from the brand palette to avoid ambiguity.

Typography: **Inter**, loaded via Google Fonts with system-ui fallback.
Chosen for its excellent legibility at small sizes (item names, quantities)
and neutral, professional character.

## Layout — wireframe

Single-column, mobile-first, capped at `max-w-lg` so it also reads as a
centered card on desktop rather than stretching full-width.

```
┌─────────────────────────────────┐
│ 🧺 VoiceCart          3 / 8     │  ← sticky header: logo, tagline,
│    Say it. It's on the list.    │     remaining/total counter
├─────────────────────────────────┤
│ 🥦 Produce            [2]       │  ← category section header
│  ┌───────────────────────────┐  │     + item count badge
│  │ ○  Bananas          6 pcs │−+🗑│  ← item card: check, name+qty,
│  └───────────────────────────┘  │     quantity steppers, delete
│  ┌───────────────────────────┐  │
│  │ ●  Apples (done)    4 pcs │−+🗑│  ← checked = dimmed + strikethrough
│  └───────────────────────────┘  │
│                                  │
│ 🥛 Dairy               [2]      │
│  ...                             │
│                                  │
├─────────────────────────────────┤
│                                  │
│            ( 🎤 )                │  ← floating mic button, fixed to
│                                  │     bottom, thumb-reachable
└─────────────────────────────────┘
```

### States

- **Idle list**: items grouped by category in a fixed order (produce → dairy
  → bakery → snacks → beverages → household → other), each group hidden if
  empty.
- **Empty list**: replaced entirely by an empty-state card with a short
  instruction ("Tap the mic and say 'Add milk'") — never an empty gray box.
- **Mic idle**: solid emerald circle, mic icon.
- **Mic listening**: coral circle + an animated pulsing ring (`animate-pulseRing`
  in Tailwind config) to signal "actively capturing audio".
- **Mic processing** (Day 3): coral circle → spinner icon, once audio capture
  ends and the transcript is being parsed.
- **Mic error** (Day 3): red circle + mic-off icon, e.g. permission denied.

### Component inventory (maps directly to `frontend/src/components/`)

- `layout/AppShell` — page frame: header + scrollable content + fixed mic.
- `layout/Header` — logo, tagline, live remaining/total counter.
- `shopping-list/ShoppingListView` — groups items by category from the store.
- `shopping-list/CategorySection` — one category group + its badge count.
- `shopping-list/ItemCard` — checkbox, name, qty, stepper, delete.
- `shopping-list/EmptyState` — shown when the list has zero items.
- `voice/MicButton` — the floating action button described above.
- `common/Badge`, `common/IconButton` — shared primitives.

## Accessibility notes

- All icon-only controls have `aria-label`s (mic button, quantity steppers,
  delete, checkbox).
- The checkbox uses `role="checkbox"` + `aria-checked` since it's a styled
  `<button>`, not a native checkbox (needed for the custom circular design).
- Color is never the *only* signal: checked items also get a strikethrough,
  the listening mic also gets a distinct icon transition (mic → spinner).
- Tap targets are ≥36px (quantity/delete) or ≥56px (primary mic FAB), per
  mobile touch-target guidelines.

## What's deliberately deferred

- Dark mode — not required by the brief; revisit only if time allows in Day 6.
- Search/filter bar UI — arrives with voice-activated search, Day 4.
- Settings/language picker — arrives with multilingual support, Day 4.
