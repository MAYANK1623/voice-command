import { useCallback } from 'react'
import { useShoppingListStore } from '@/store/useShoppingListStore'
import { useSpeechRecognition } from './useSpeechRecognition'
import { parseCommand } from './parseCommand'
import { findMatchingItem, normalizeItemName } from './matchItem'
import { resolveImpliedUnit, resolveRemoval } from './unitConversion'
import { translateTranscript, applyGroceryVocabulary } from './i18n/translate'
import { inferCategory } from './categoryKeywords'

const FEEDBACK_DISPLAY_MS = 4000

// The Step 9 glue: takes a finalized transcript, runs it through the Step 8
// parser, resolves it against the current list (for remove/check), and
// calls the exact same store actions Day 2's manual UI already uses — so
// voice and the "+" quick-add form are just two paths into one CRUD layer,
// never two separate ones.
export function useVoiceCommands(lang: string) {
  const addItem = useShoppingListStore((state) => state.addItem)
  const removeItem = useShoppingListStore((state) => state.removeItem)
  const updateQuantity = useShoppingListStore((state) => state.updateQuantity)
  const toggleChecked = useShoppingListStore((state) => state.toggleChecked)
  const clearChecked = useShoppingListStore((state) => state.clearChecked)
  const searchProducts = useShoppingListStore((state) => state.searchProducts)
  const findSubstitutes = useShoppingListStore((state) => state.findSubstitutes)
  const setVoiceState = useShoppingListStore((state) => state.setVoiceState)
  const setFeedbackMessage = useShoppingListStore((state) => state.setFeedbackMessage)

  const announce = useCallback(
    (message: string) => {
      setFeedbackMessage(message)
      setTimeout(() => {
        if (useShoppingListStore.getState().feedbackMessage === message) {
          setFeedbackMessage(null)
        }
      }, FEEDBACK_DISPLAY_MS)
    },
    [setFeedbackMessage]
  )

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript) {
        setVoiceState('idle')
        return
      }

      // Step 10: translate a non-English transcript into the English
      // command syntax parseCommand already understands (a no-op for
      // English). `command.raw` still holds the original transcript for
      // display purposes below.
      // applyGroceryVocabulary catches Hindi/Hinglish nouns even when the
      // language picker isn't on Hindi ("add pyaz" while set to English)
      // — see i18n/translate.ts for why this is safe to always run.
      const command = applyGroceryVocabulary(parseCommand(translateTranscript(transcript, lang)))
      const items = useShoppingListStore.getState().items

      switch (command.action) {
        case 'add': {
          const name = command.itemName as string
          // Checked ahead of the call so the announcement can say what
          // actually happened — addItem decides merge-vs-create itself
          // (see store/useShoppingListStore.ts), this just predicts it
          // with the same normalizeItemName check for the feedback text.
          const existing = items.find(
            (item) => !item.checked && normalizeItemName(item.name) === normalizeItemName(name)
          )
          const succeeded = await addItem({
            name,
            quantity: command.quantity,
            unit: command.unit,
            category: command.category,
            addedVia: 'voice',
          })
          // Step 16: addItem resolves false on a failed/rolled-back write
          // (see the store) — announcing "Added milk" anyway would tell
          // the user something happened when it didn't. The ErrorBanner
          // still carries the actual reason; this just keeps the voice
          // feedback honest about which one occurred.
          announce(
            !succeeded
              ? `Couldn't add ${name} — check your connection and try again`
              : existing
                ? `Updated ${existing.name} to ${existing.quantity + (command.quantity ?? 1)}`
                : `Added ${name}`
          )
          break
        }

        case 'remove': {
          const match = command.itemName ? findMatchingItem(items, command.itemName) : undefined
          if (match) {
            if (command.quantity) {
              // Unit-aware partial removal: "remove 6" out of "1 dozen
              // eggs" (=12) leaves 6 *pcs*, not "0.5 dozen" — same
              // conversion covers kg/g and l/ml. No unit spoken defaults
              // via resolveImpliedUnit (see voice/unitConversion.ts).
              const removeUnit = command.unit ?? resolveImpliedUnit(match.unit)
              const outcome = resolveRemoval(
                { quantity: match.quantity, unit: match.unit },
                { quantity: command.quantity, unit: removeUnit }
              )
              if (outcome === 'remove-all') {
                const succeeded = await removeItem(match.id)
                announce(succeeded ? `Removed ${match.name}` : `Couldn't remove ${match.name} — try again`)
              } else {
                const succeeded = await updateQuantity(match.id, outcome.quantity, outcome.unit)
                announce(
                  succeeded
                    ? `Removed ${command.quantity} ${removeUnit} of ${match.name} — ${outcome.quantity} ${outcome.unit} left`
                    : `Couldn't update ${match.name} — try again`
                )
              }
            } else {
              const succeeded = await removeItem(match.id)
              announce(succeeded ? `Removed ${match.name}` : `Couldn't remove ${match.name} — try again`)
            }
          } else {
            announce(`Couldn't find "${command.itemName}" on your list`)
          }
          break
        }

        case 'check': {
          const match = command.itemName ? findMatchingItem(items, command.itemName) : undefined
          if (match) {
            const succeeded = match.checked || (await toggleChecked(match.id))
            announce(succeeded ? `Checked off ${match.name}` : `Couldn't check off ${match.name} — try again`)
          } else {
            announce(`Couldn't find "${command.itemName}" on your list`)
          }
          break
        }

        case 'clear_checked': {
          const succeeded = await clearChecked()
          announce(succeeded ? 'Cleared checked items' : "Couldn't clear checked items — try again")
          break
        }

        case 'substitute': {
          const target = command.itemName ?? ''
          // Prefer the category of a matching item already on the list
          // (most accurate — it's this exact product), falling back to
          // keyword inference for an item that isn't on the list at all
          // ("find a substitute for toothpaste" before ever adding one).
          const match = target ? findMatchingItem(items, target) : undefined
          const category = match?.category ?? inferCategory(target)
          await findSubstitutes({ name: target, category })
          const count = useShoppingListStore.getState().searchResults.length
          announce(
            count > 0
              ? `Found ${count} alternative${count === 1 ? '' : 's'} to "${target}"`
              : `No alternatives found for "${target}"`
          )
          break
        }

        case 'search': {
          const query = command.itemName
          await searchProducts({ query, minPrice: command.minPrice, maxPrice: command.maxPrice })
          const { searchResults, searchFallback } = useShoppingListStore.getState()
          const count = searchResults.length
          const label = query || 'products'
          // searchFallback means these are substitutes for a query that
          // matched nothing directly ("unavailable") — say so, rather than
          // announcing them as if "label" itself was found.
          announce(
            searchFallback
              ? count > 0
                ? `Couldn't find "${label}" — found ${count} alternative${count === 1 ? '' : 's'} instead`
                : `No products or alternatives found for "${label}"`
              : count > 0
                ? `Found ${count} result${count === 1 ? '' : 's'} for "${label}"`
                : `No products found for "${label}"`
          )
          break
        }

        case 'unknown':
        default: {
          announce(`Didn't understand "${transcript}" — try "Add milk" or "Remove milk".`)
          break
        }
      }

      setVoiceState('idle')
    },
    [
      addItem,
      removeItem,
      updateQuantity,
      toggleChecked,
      clearChecked,
      searchProducts,
      findSubstitutes,
      setVoiceState,
      announce,
      lang,
    ]
  )

  return useSpeechRecognition({ lang, onFinalTranscript: handleFinalTranscript })
}
