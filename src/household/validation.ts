import { requireNonBlank } from '../lib/validation'

export function validateHouseholdName(name: string): string | null {
  return requireNonBlank(name, 'Household name')
}

export function validateInviteCode(code: string): string | null {
  return requireNonBlank(code, 'Invite code')
}
