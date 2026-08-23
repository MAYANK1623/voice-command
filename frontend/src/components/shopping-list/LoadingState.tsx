// Skeleton for the initial fetch — enough so the list doesn't flash an
// incorrect "empty" state while data is in flight. Shaped like an actual
// ItemCard (checkbox circle + two text lines + stepper controls) rather
// than a single flat bar, and staggered so it reads as "still loading"
// rather than a static image — a uniform block that never changes can
// look identical to a broken/empty state at a glance.
export function LoadingState() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading your shopping list">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-3 rounded-2xl border border-gray-100 bg-surface p-3"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <div className="h-6 w-6 shrink-0 rounded-full bg-surface-sunken" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="h-3 rounded bg-surface-sunken" style={{ width: `${60 - index * 8}%` }} />
            <div className="h-2.5 w-1/3 rounded bg-surface-sunken" />
          </div>
          <div className="h-7 w-20 shrink-0 rounded-full bg-surface-sunken" />
        </div>
      ))}
    </div>
  )
}
