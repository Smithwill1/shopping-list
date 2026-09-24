export function validateHouseholdName(name: string): string | null {
  if (!name.trim()) return 'Household name is required'
  return null
}

export function validateInviteCode(code: string): string | null {
  if (!code.trim()) return 'Invite code is required'
  return null
}
