export interface PricedListItem {
  price: number | null
  done: boolean
}

export function listTotal(items: PricedListItem[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0), 0)
}

export function trolleyTotal(items: PricedListItem[]): number {
  return items.filter((item) => item.done).reduce((sum, item) => sum + (item.price ?? 0), 0)
}

export function unpricedCount(items: PricedListItem[]): number {
  return items.filter((item) => item.price === null).length
}
