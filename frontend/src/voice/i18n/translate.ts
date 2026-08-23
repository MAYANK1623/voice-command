import { LANGUAGE_PACKS, HINDI, type SvoLanguagePack } from './translations'
import { inferCategory } from '../categoryKeywords'
import type { ParsedCommand } from '../parseCommand'

function tokenize(text: string): string[] {
  return text.toLowerCase().trim().split(/\s+/).filter(Boolean)
}

function translateWords(text: string, words: Record<string, string>): string {
  return tokenize(text)
    .map((token) => words[token] ?? token)
    .join(' ')
}

// Longest phrases first, then falls back to per-token substitution — see
// translations.ts's SvoLanguagePack doc comment for why this is enough for
// SVO languages (Spanish/French) but not for Hindi.
function applySvoPack(text: string, pack: SvoLanguagePack): string {
  const tokens = tokenize(text)
  const phrases = [...pack.phrases].sort((a, b) => b.from.length - a.from.length)

  const out: string[] = []
  let i = 0
  while (i < tokens.length) {
    const phrase = phrases.find(
      (p) => tokens.slice(i, i + p.from.length).join(' ') === p.from.join(' ')
    )
    if (phrase) {
      if (phrase.to) out.push(phrase.to)
      i += phrase.from.length
      continue
    }
    out.push(pack.words[tokens[i]] ?? tokens[i])
    i += 1
  }
  return out.join(' ')
}

// Step 10: turns a non-English transcript into the English command syntax
// parseCommand.ts already understands, so voice input in any supported
// language reuses the exact same Step 8 parser rather than needing a
// parallel pattern set per language. English passes through unchanged.
// Unsupported languages also pass through unchanged — they'll simply fail
// to parse and surface as "Didn't understand ..." like any English
// out-of-vocabulary phrase would.
export function translateTranscript(transcript: string, langCode: string): string {
  const subtag = langCode.slice(0, 2).toLowerCase()
  if (subtag === 'en') return transcript

  const pack = LANGUAGE_PACKS[subtag]
  if (!pack) return transcript

  const normalized = transcript.toLowerCase().trim()

  if (pack.kind === 'svo') {
    return applySvoPack(normalized, pack)
  }

  // SOV (Hindi): try each whole-sentence template; on no match, fall back
  // to plain word substitution so numbers/units/nouns still translate even
  // though the sentence won't parse into a recognized command.
  for (const template of pack.templates) {
    const match = normalized.match(template.pattern)
    if (match) {
      const captured = match[1] ?? ''
      return template.build(translateWords(captured, pack.words))
    }
  }
  return translateWords(normalized, pack.words)
}

// A Hindi/Hinglish noun ("pyaz", "pani") can show up in an otherwise
// English (or Spanish/French, or manually-typed) phrase without the
// language picker ever being switched to Hindi — very common in practice,
// since most Indian users mix languages rather than speaking "pure"
// Hindi. Reuses Hindi's own word list (both scripts) as a standing
// vocabulary, independent of whichever langCode produced the phrase.
//
// Deliberately a *post*-processing step, applied only to an
// already-isolated item name (see applyGroceryVocabulary below) — never
// to a raw transcript before parseCommand has matched a verb pattern
// against it. Some Hindi/Hinglish words (e.g. "do" = two) collide with
// ordinary English words ("do not need milk"); substituting into the raw
// sentence first could corrupt that match ("do" -> "two"), but by the
// time a noun has been isolated, that risk is gone — the surrounding verb
// has already done its job.
export function translateGroceryNoun(name: string): string {
  const lower = name.toLowerCase()
  const direct = HINDI.words[lower]
  if (direct) return direct
  return name
    .split(' ')
    .map((token) => HINDI.words[token.toLowerCase()] ?? token)
    .join(' ')
}

// Applied after parseCommand, regardless of the selected language — see
// translateGroceryNoun's doc comment for why this is safe to run
// unconditionally. Re-infers category too, since a translated noun
// ("pyaz" -> "onion") may now match a category keyword it didn't before.
export function applyGroceryVocabulary(command: ParsedCommand): ParsedCommand {
  if (!command.itemName) return command
  const translated = translateGroceryNoun(command.itemName)
  if (translated === command.itemName) return command
  return {
    ...command,
    itemName: translated,
    ...(command.action === 'add' ? { category: inferCategory(translated) } : {}),
  }
}
