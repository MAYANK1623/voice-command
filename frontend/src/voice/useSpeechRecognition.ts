import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useShoppingListStore } from '@/store/useShoppingListStore'

// Hand-written minimal typings for the parts of the Web Speech API this
// app uses. TypeScript's bundled DOM lib doesn't reliably cover this
// (support is Chrome/Edge-only, often behind the `webkit` prefix), and
// declaring these as plain local interfaces — rather than augmenting the
// global `Window` type — avoids any risk of clashing with whatever the
// DOM lib does or doesn't already declare.
interface SpeechRecognitionAlternativeLike {
  readonly transcript: string
}
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternativeLike
}
interface SpeechRecognitionResultListLike {
  readonly length: number
  [index: number]: SpeechRecognitionResultLike
}
interface SpeechRecognitionEventLike {
  readonly results: SpeechRecognitionResultListLike
}
interface SpeechRecognitionErrorEventLike {
  readonly error: string
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}
interface SpeechRecognitionWindow {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as SpeechRecognitionWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

// Friendly copy for the error codes the spec defines. "aborted" is what
// fires when *we* call stop()/abort() ourselves — that's a normal
// user-initiated cancel, not a failure, so it's handled separately below
// rather than shown as an error.
const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access was denied. Enable it in your browser settings and try again.',
  'no-speech': "Didn't catch that — try again.",
  'audio-capture': 'No microphone was found on this device.',
  network: 'A network error interrupted voice recognition.',
}

interface UseSpeechRecognitionOptions {
  lang: string
  onFinalTranscript: (transcript: string) => void
}

interface UseSpeechRecognitionResult {
  isSupported: boolean
  start: () => void
  stop: () => void
}

export function useSpeechRecognition({
  lang,
  onFinalTranscript,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // Kept in a ref so recreating the recognition instance (below) doesn't
  // need onFinalTranscript in its dependency array — callers often pass a
  // fresh closure every render.
  const onFinalTranscriptRef = useRef(onFinalTranscript)
  onFinalTranscriptRef.current = onFinalTranscript

  const setVoiceState = useShoppingListStore((state) => state.setVoiceState)
  const setLastTranscript = useShoppingListStore((state) => state.setLastTranscript)

  const Ctor = useMemo(() => getSpeechRecognitionCtor(), [])
  const isSupported = Boolean(Ctor)

  // Recreated whenever `lang` changes (Day 4 wires a language picker to
  // this) — SpeechRecognition.lang must be set before start(), and some
  // browser implementations ignore changing it on a live instance.
  useEffect(() => {
    if (!Ctor) return undefined

    const recognition = new Ctor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onstart = () => setVoiceState('listening')

    recognition.onresult = (event) => {
      // continuous=false means one utterance per session, so the last
      // result is always the (possibly still-interim) transcript so far.
      const lastResult = event.results[event.results.length - 1]
      if (!lastResult) return
      const transcript = (lastResult[0]?.transcript ?? '').trim()
      setLastTranscript(transcript)
      if (lastResult.isFinal) {
        setVoiceState('processing')
        onFinalTranscriptRef.current(transcript)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
        // We called stop()/abort() ourselves — not a real error.
        setVoiceState('idle')
        return
      }
      setVoiceState('error')
      setLastTranscript(ERROR_MESSAGES[event.error] ?? 'Voice recognition error. Please try again.')
    }

    recognition.onend = () => {
      const current = useShoppingListStore.getState().voiceState
      if (current === 'listening') {
        // Ended without producing a final result (e.g. silence timeout).
        setVoiceState('idle')
      } else if (current === 'error') {
        // Auto-clear the error state after a moment so the mic button
        // doesn't stay red forever.
        setTimeout(() => {
          if (useShoppingListStore.getState().voiceState === 'error') setVoiceState('idle')
        }, 2500)
      }
    }

    recognitionRef.current = recognition
    return () => {
      recognition.onstart = null
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
      recognitionRef.current = null
    }
  }, [Ctor, lang, setVoiceState, setLastTranscript])

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setVoiceState('error')
      setLastTranscript('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    setLastTranscript(null)
    try {
      recognitionRef.current.start()
    } catch {
      // start() throws if called while already running — a harmless
      // double-tap of the mic button; nothing to recover from.
    }
  }, [setVoiceState, setLastTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return { isSupported, start, stop }
}
