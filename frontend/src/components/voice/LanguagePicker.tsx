import { Languages } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { VOICE_LANGUAGES } from '@/voice/i18n/languages'

// Step 10: a native <select> rather than a custom dropdown — it's fully
// accessible for free (keyboard, screen readers) and this app is already
// voice-first, so a hand-rolled listbox here would be effort spent on the
// least important interaction surface. Feeds `voiceLang` straight into
// MicButton's useVoiceCommands(lang) call — see workdone.md Day 3/4.
export function LanguagePicker() {
  const voiceLang = useShoppingListStore((state) => state.voiceLang)
  const setVoiceLang = useShoppingListStore((state) => state.setVoiceLang)

  return (
    <label className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink-muted">
      <Languages size={14} aria-hidden="true" />
      <span className="sr-only">Voice language</span>
      <select
        value={voiceLang}
        onChange={(event) => setVoiceLang(event.target.value)}
        className="bg-transparent text-ink-muted focus:outline-none"
      >
        {VOICE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
