export function validateGroupName(name: string): string | null {
  if (!name.trim()) return 'Group name is required'
  return null
}
