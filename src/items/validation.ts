export function validateItemName(name: string): string | null {
  if (!name.trim()) return 'Item name is required'
  return null
}

export function validatePrice(price: string): string | null {
  if (!price.trim()) return null // optional

  const value = Number(price)
  if (Number.isNaN(value)) return 'Enter a valid number'
  if (value < 0) return 'Price cannot be negative'
  return null
}
