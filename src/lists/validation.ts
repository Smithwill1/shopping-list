export function validateListName(name: string): string | null {
  if (!name.trim()) return 'List name is required'
  return null
}
