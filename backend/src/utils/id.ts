import { randomUUID } from 'node:crypto'

// Server is the single source of truth for IDs — the client never invents
// one. Prefixed so ids are recognizable in logs (`itm_...`) and namespaced
// against future entity types.
export function generateId(prefix = 'itm'): string {
  return `${prefix}_${randomUUID()}`
}
