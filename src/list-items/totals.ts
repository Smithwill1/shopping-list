export interface PricedListItem {
  price: number | null
  done: boolean
  quantity: number
}

function lineTotal(item: PricedListItem): number {
  return (item.price ?? 0) * item.quantity
}

export function listTotal(items: PricedListItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0)
}

export function trolleyTotal(items: PricedListItem[]): number {
  return items.filter((item) => item.done).reduce((sum, item) => sum + lineTotal(item), 0)
}

// Counts distinct line items missing a price, not units — "3x paper
// towels" with no price flags as one unpriced line, not three.
export function unpricedCount(items: PricedListItem[]): number {
  return items.filter((item) => item.price === null).length
}
