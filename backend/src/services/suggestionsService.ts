import { listHistory } from './historyService.js'
import { listItems } from './itemsService.js'
import type { PurchaseHistoryEntry, Suggestion } from '../types/index.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000
// A fixed pool of 3 — a wall of 7+ suggestions defeats the point of a
// suggestion (it's just the whole history dumped back at the user). The
// frontend calls back with `exclude` once these 3 are resolved
// (accepted/dismissed) to reveal a genuinely different 3, not to raise
// this cap.
const MAX_SUGGESTIONS = 3
// One purchase gives no interval to compare against at all; two is the
// minimum needed to compute one — a weak signal, but an honest one, not a
// guess dressed up as a pattern.
const MIN_PURCHASES_FOR_PATTERN = 2
// A suggestion fires once the gap since the last purchase reaches 100% of
// the historical average — the customer has gone at least as long as
// their own usual restock gap without buying it again, not merely
// approaching it. Raised from an earlier 0.8 (which fired while still
// "probably running low," before the usual restock day had even arrived)
// so only genuinely overdue, high-demand gaps surface — e.g. someone who
// hasn't bought sugar in as long as (or longer than) their own typical gap.
const DUE_THRESHOLD_RATIO = 1.0

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

function groupByItem(history: PurchaseHistoryEntry[]): Map<string, PurchaseHistoryEntry[]> {
  const groups = new Map<string, PurchaseHistoryEntry[]>()
  for (const entry of history) {
    const key = normalize(entry.itemName)
    const group = groups.get(key) ?? []
    group.push(entry)
    groups.set(key, group)
  }
  return groups
}

function averageIntervalDays(sortedAscending: PurchaseHistoryEntry[]): number {
  const intervals: number[] = []
  for (let i = 1; i < sortedAscending.length; i++) {
    const gapMs = new Date(sortedAscending[i].purchasedAt).getTime() - new Date(sortedAscending[i - 1].purchasedAt).getTime()
    intervals.push(gapMs / MS_PER_DAY)
  }
  return intervals.reduce((sum, days) => sum + days, 0) / intervals.length
}

// Rule-based, same "no external AI/ML service" trade-off Day 3 documented
// for command parsing: a simple average-interval-vs-time-since-last-
// purchase ratio, recomputed on every request rather than a trained
// model — honest, explainable, and more than sufficient for one user's
// history.
//
// `excludeNames` is how the frontend asks for a genuinely different batch
// once the current 3 are resolved — accepting or dismissing one doesn't
// change the underlying history (an accept adds it to the active list,
// which the "already on the list" filter below would catch anyway; a
// dismiss doesn't change anything at all), so without this the very next
// request would just return the identical 3.
export async function getSuggestions(excludeNames: string[] = []): Promise<Suggestion[]> {
  const [history, activeItems] = await Promise.all([listHistory(), listItems()])
  const activeUncheckedNames = new Set(
    activeItems.filter((item) => !item.checked).map((item) => normalize(item.name))
  )
  const excluded = new Set(excludeNames.map(normalize))

  const suggestions: Suggestion[] = []
  for (const [key, entries] of groupByItem(history)) {
    if (entries.length < MIN_PURCHASES_FOR_PATTERN) continue
    if (activeUncheckedNames.has(key)) continue // already on the list — don't nag
    if (excluded.has(key)) continue // already shown and resolved this session

    const sortedAscending = [...entries].sort(
      (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
    )
    const last = sortedAscending[sortedAscending.length - 1]
    const avgInterval = averageIntervalDays(sortedAscending)
    const daysSince = (Date.now() - new Date(last.purchasedAt).getTime()) / MS_PER_DAY

    if (daysSince >= avgInterval * DUE_THRESHOLD_RATIO) {
      suggestions.push({
        itemName: last.itemName,
        category: last.category,
        unit: last.unit,
        lastPurchasedAt: last.purchasedAt,
        daysSinceLastPurchase: Math.round(daysSince * 10) / 10,
        averageIntervalDays: Math.round(avgInterval * 10) / 10,
      })
    }
  }

  // Most overdue relative to its own pattern first, not just most days
  // since purchase — a weekly item 2 days late is more "due" than a
  // monthly item 5 days late.
  return suggestions
    .sort((a, b) => b.daysSinceLastPurchase / b.averageIntervalDays - a.daysSinceLastPurchase / a.averageIntervalDays)
    .slice(0, MAX_SUGGESTIONS)
}
