import { describe, expect, it } from 'vitest'
import { nextRank, rankBetween } from './rank'

describe('nextRank', () => {
  it('starts at 1000 for the first item', () => {
    expect(nextRank([])).toBe(1000)
  })

  it('goes 1000 past the current highest rank', () => {
    expect(nextRank([{ rank: 1000 }, { rank: 2500 }])).toBe(3500)
  })
})

describe('rankBetween', () => {
  it('returns 1000 when the list is empty', () => {
    expect(rankBetween(undefined, undefined)).toBe(1000)
  })

  it('returns 1000 past the previous item when dropped at the end', () => {
    expect(rankBetween(2000, undefined)).toBe(3000)
  })

  it('returns 1000 before the next item when dropped at the start', () => {
    expect(rankBetween(undefined, 2000)).toBe(1000)
  })

  it('returns the midpoint when dropped between two items', () => {
    expect(rankBetween(1000, 2000)).toBe(1500)
  })
})
