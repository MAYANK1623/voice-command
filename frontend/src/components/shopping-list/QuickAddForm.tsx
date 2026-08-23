import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { parseCommand } from '@/voice/parseCommand'
import { translateTranscript, translateGroceryNoun, applyGroceryVocabulary } from '@/voice/i18n/translate'
import { inferCategory } from '@/voice/categoryKeywords'

// Manual add path — lets the full CRUD loop be tested/demoed before voice
// input exists (Day 3). Once voice command parsing lands, it calls the
// same store.addItem() this form calls; this input stays as the always
// available manual fallback (some users won't want to talk to their
// phone in a quiet room).
//
// Routed through the exact same translate -> parse -> vocabulary pipeline
// voice uses (see useVoiceCommands.ts), not just a raw string handed to
// addItem — so typing "2 kilo pyaz" or "pani" behaves identically to
// saying it: quantity/unit get parsed and Hindi/Hinglish nouns resolve to
// their English name, regardless of whichever language the voice picker
// happens to be set to (typed text has no language selection of its own).
export function QuickAddForm() {
  const [value, setValue] = useState('')
  const addItem = useShoppingListStore((state) => state.addItem)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const raw = value.trim()
    if (!raw) return

    const voiceLang = useShoppingListStore.getState().voiceLang
    const command = applyGroceryVocabulary(parseCommand(translateTranscript(raw, voiceLang)))

    if (command.action === 'add' && command.itemName) {
      addItem({
        name: command.itemName,
        quantity: command.quantity,
        unit: command.unit,
        category: command.category,
        addedVia: 'manual',
      })
    } else {
      // No quantity/unit/verb structure detected (e.g. just "Paper
      // Towels") — still worth a Hindi/Hinglish noun check ("pyaz" typed
      // alone), then fall back to the original behavior: whatever was
      // typed becomes the item name as-is. Category is re-inferred from
      // the translated name too ("pyaz" -> "onion" -> produce), not left
      // at addItem's 'other' default.
      const translatedName = translateGroceryNoun(raw)
      addItem({ name: translatedName, category: inferCategory(translatedName), addedVia: 'manual' })
    }
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Add an item…"
        aria-label="Add an item"
        className="h-10 flex-1 rounded-full border border-gray-200 bg-surface px-4 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        aria-label="Add item"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus size={18} />
      </button>
    </form>
  )
}
