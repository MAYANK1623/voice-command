// Step 10: languages the mic can listen in. `code` is a BCP-47 tag passed
// straight to SpeechRecognition.lang (see useSpeechRecognition.ts) — the
// browser/OS handles the actual speech-to-text for each; this app only
// needs to turn the resulting transcript into English command syntax
// afterward (see translate.ts).
export interface VoiceLanguage {
  code: string
  label: string
  nativeLabel: string
}

// English and Hindi are the two languages this app is built and tested
// around most closely, so they lead the list; Spanish/French remain
// supported but secondary.
export const VOICE_LANGUAGES: VoiceLanguage[] = [
  { code: 'en-US', label: 'English', nativeLabel: 'English' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'es-ES', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr-FR', label: 'French', nativeLabel: 'Français' },
]

export const DEFAULT_VOICE_LANG = 'en-US'
