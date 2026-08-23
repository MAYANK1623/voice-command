import { AlertTriangle, RotateCw, X } from 'lucide-react'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
  // Step 16: only meaningful for a failure that's safely re-runnable with
  // no arguments — chiefly "the initial list fetch failed" (see
  // ShoppingListView, the only caller that passes this). A failed
  // add/remove/etc. isn't retried generically here, since doing that
  // right would mean re-issuing that exact original action, not just
  // "try something" — omit onRetry for those and this renders unchanged.
  onRetry?: () => void
}

// Minimal, functional error surface for Day 2 (a failed API call must never
// fail silently). Day 7 ("error handling") adds a retry action for the one
// case where retrying unambiguously means "try again with no arguments".
export function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          aria-label="Retry"
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          <RotateCw size={12} />
          Retry
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss error"
        onClick={onDismiss}
        className="shrink-0 rounded-full p-0.5 text-red-400 hover:bg-red-100 hover:text-red-600"
      >
        <X size={16} />
      </button>
    </div>
  )
}
