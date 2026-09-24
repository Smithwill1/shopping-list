import { describe, expect, it } from 'vitest'
import { listTotal, trolleyTotal, unpricedCount } from './totals'

const items = [
  { price: 3.5, done: true },
  { price: 2, done: false },
  { price: null, done: true },
]

describe('listTotal', () => {
  it('sums the price of every item, priced or not', () => {
    expect(listTotal(items)).toBe(5.5)
  })

  it('returns 0 for an empty list', () => {
    expect(listTotal([])).toBe(0)
  })
})

describe('trolleyTotal', () => {
  it('sums only checked-off items', () => {
    expect(trolleyTotal(items)).toBe(3.5)
  })

  it('treats an unpriced checked item as contributing 0', () => {
    expect(trolleyTotal([{ price: null, done: true }])).toBe(0)
  })
})

describe('unpricedCount', () => {
  it('counts items with no price set', () => {
    expect(unpricedCount(items)).toBe(1)
  })
})
