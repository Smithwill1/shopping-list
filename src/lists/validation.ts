import { requireNonBlank } from '../lib/validation'

export function validateListName(name: string): string | null {
  return requireNonBlank(name, 'List name')
}
