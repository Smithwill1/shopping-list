import { requireNonBlank } from '../lib/validation'

export function validateGroupName(name: string): string | null {
  return requireNonBlank(name, 'Group name')
}
