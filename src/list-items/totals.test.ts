import { describe, expect, it } from 'vitest'
import { listTotal, trolleyTotal, unpricedCount } from './totals'

const items = [
  { price: 3.5, done: true, quantity: 2 }, // $7.00
  { price: 2, done: false, quantity: 1 }, // $2.00
  { price: null, done: true, quantity: 3 }, // unpriced
]

describe('listTotal', () => {
  it('sums price × quantity for every item, priced or not', () => {
    expect(listTotal(items)).toBe(9)
  })

  it('returns 0 for an empty list', () => {
    expect(listTotal([])).toBe(0)
  })
})

describe('trolleyTotal', () => {
  it('sums price × quantity for only checked-off items', () => {
    expect(trolleyTotal(items)).toBe(7)
  })

  it('treats an unpriced checked item as contributing 0 regardless of quantity', () => {
    expect(trolleyTotal([{ price: null, done: true, quantity: 5 }])).toBe(0)
  })
})

describe('unpricedCount', () => {
  it('counts distinct unpriced line items, not units', () => {
    expect(unpricedCount(items)).toBe(1)
  })
})
