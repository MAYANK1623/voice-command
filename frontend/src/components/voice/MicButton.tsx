import { Loader2, Mic, MicOff } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { useVoiceCommands } from '@/voice/useVoiceCommands'
import { VoiceFeedback } from './VoiceFeedback'
import { LanguagePicker } from './LanguagePicker'
import { CartTotalBadge } from './CartTotalBadge'

export function MicButton() {
  const voiceState = useShoppingListStore((state) => state.voiceState)
  const voiceLang = useShoppingListStore((state) => state.voiceLang)
  const { isSupported, start, stop } = useVoiceCommands(voiceLang)

  const isListening = voiceState === 'listening'
  const isProcessing = voiceState === 'processing'
  const isError = voiceState === 'error'

  function handleClick() {
    if (isListening) {
      stop()
      return
    }
    start()
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 pb-6 pt-10 bg-gradient-to-t from-surface-muted via-surface-muted/90 to-transparent">
      {isSupported && <LanguagePicker />}
      <VoiceFeedback />

      <div className="flex items-center justify-center gap-3">
        <CartTotalBadge />
        <button
          type="button"
          onClick={handleClick}
          disabled={isProcessing}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop listening' : 'Start voice command'}
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-fab transition-transform active:scale-95 disabled:cursor-wait ${
            isError ? 'bg-red-500' : isListening ? 'bg-accent-500' : 'bg-brand-500 hover:bg-brand-600'
          }`}
        >
          {isListening && <span className="absolute inset-0 rounded-full bg-accent-400 animate-pulseRing" />}
          {isProcessing ? (
            <Loader2 size={26} className="animate-spin" />
          ) : isError ? (
            <MicOff size={26} />
          ) : (
            <Mic size={26} />
          )}
        </button>
      </div>

      {!isSupported && (
        <p className="max-w-[16rem] text-center text-xs text-ink-faint">
          Voice input isn't supported in this browser — try Chrome or Edge, or use the text field
          above.
        </p>
      )}
    </div>
  )
}
