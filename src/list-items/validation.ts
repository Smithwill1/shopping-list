export function validateNewItemName(name: string): string | null {
  if (!name.trim()) return 'Item name is required'
  return null
}
