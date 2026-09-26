import { describe, expect, it } from 'vitest'
import { sortListItems, type ListItem } from './useListItems'

function item(overrides: Partial<ListItem>): ListItem {
  return {
    id: 'id',
    itemId: null,
    name: 'Item',
    price: null,
    rank: null,
    done: false,
    quantity: 1,
    ...overrides,
  }
}

describe('sortListItems', () => {
  it('sorts unchecked items by rank, lowest first', () => {
    const items = [item({ id: 'a', rank: 3000 }), item({ id: 'b', rank: 1000 })]
    expect(sortListItems(items).map((i) => i.id)).toEqual(['b', 'a'])
  })

  it('sinks checked-off items below every unchecked item, regardless of rank', () => {
    const items = [
      item({ id: 'checked-low-rank', rank: 500, done: true }),
      item({ id: 'unchecked-high-rank', rank: 9000, done: false }),
    ]
    expect(sortListItems(items).map((i) => i.id)).toEqual([
      'unchecked-high-rank',
      'checked-low-rank',
    ])
  })

  it('keeps rank order within each of the checked and unchecked groups', () => {
    const items = [
      item({ id: 'checked-2', rank: 2000, done: true }),
      item({ id: 'unchecked-2', rank: 2000, done: false }),
      item({ id: 'checked-1', rank: 1000, done: true }),
      item({ id: 'unchecked-1', rank: 1000, done: false }),
    ]
    expect(sortListItems(items).map((i) => i.id)).toEqual([
      'unchecked-1',
      'unchecked-2',
      'checked-1',
      'checked-2',
    ])
  })

  it('does not mutate the input array', () => {
    const items = [item({ id: 'a', rank: 2000 }), item({ id: 'b', rank: 1000 })]
    const original = [...items]
    sortListItems(items)
    expect(items).toEqual(original)
  })
})
