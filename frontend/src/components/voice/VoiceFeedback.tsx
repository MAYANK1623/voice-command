import { useShoppingListStore } from '@/store/useShoppingListStore'

// Sits just above the mic FAB: shows the live transcript while listening
// ("Listening… 'add two bottles of water'"), then swaps to what the
// command processor actually did once it's done ("Added water" / "Didn't
// understand..."). See docs/DESIGN.md's "Listening" mockup state.
export function VoiceFeedback() {
  const voiceState = useShoppingListStore((state) => state.voiceState)
  const lastTranscript = useShoppingListStore((state) => state.lastTranscript)
  const feedbackMessage = useShoppingListStore((state) => state.feedbackMessage)

  if ((voiceState === 'listening' || voiceState === 'processing') && lastTranscript) {
    return (
      <div className="mx-4 flex max-w-xs items-center gap-2 rounded-full bg-surface-sunken px-4 py-2 text-xs text-ink-muted shadow-card">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
        </span>
        <span className="truncate">
          {voiceState === 'listening' ? 'Listening… ' : 'Got it — '}
          <span className="font-medium text-ink">&ldquo;{lastTranscript}&rdquo;</span>
        </span>
      </div>
    )
  }

  if (feedbackMessage) {
    return (
      <div className="mx-4 max-w-xs truncate rounded-full bg-surface-sunken px-4 py-2 text-center text-xs text-ink-muted shadow-card">
        {feedbackMessage}
      </div>
    )
  }

  return null
}
