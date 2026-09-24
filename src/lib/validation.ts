export function requireNonBlank(value: string, fieldLabel: string): string | null {
  if (!value.trim()) return `${fieldLabel} is required`
  return null
}
