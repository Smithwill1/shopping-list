import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ListItemRow } from './ListItemRow'
import type { ListItem } from './useListItems'

function makeItem(overrides: Partial<ListItem> = {}): ListItem {
  return {
    id: '1',
    itemId: 'item-1',
    name: 'Milk',
    price: 2,
    rank: 1000,
    done: false,
    quantity: 1,
    ...overrides,
  }
}

describe('ListItemRow', () => {
  it('shows the price × quantity as the line total', () => {
    render(
      <ListItemRow
        item={makeItem({ price: 2.5, quantity: 3 })}
        onToggle={vi.fn()}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    )

    expect(screen.getByText('$7.50')).toBeInTheDocument()
  })

  it('shows no price when the item has none, regardless of quantity', () => {
    render(
      <ListItemRow
        item={makeItem({ price: null, quantity: 4 })}
        onToggle={vi.fn()}
        onRemove={vi.fn()}
        onQuantityChange={vi.fn()}
      />,
    )

    expect(screen.queryByText(/^\$/)).not.toBeInTheDocument()
  })

  it('calls onQuantityChange when incrementing', () => {
    const onQuantityChange = vi.fn()
    render(
      <ListItemRow
        item={makeItem({ quantity: 2 })}
        onToggle={vi.fn()}
        onRemove={vi.fn()}
        onQuantityChange={onQuantityChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /increase quantity/i }))

    expect(onQuantityChange).toHaveBeenCalledWith('1', 3)
  })

  it('decrements quantity when above 1', () => {
    const onQuantityChange = vi.fn()
    const onRemove = vi.fn()
    render(
      <ListItemRow
        item={makeItem({ quantity: 2 })}
        onToggle={vi.fn()}
        onRemove={onRemove}
        onQuantityChange={onQuantityChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /decrease quantity/i }))

    expect(onQuantityChange).toHaveBeenCalledWith('1', 1)
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('removes the item instead of decrementing below 1', () => {
    const onQuantityChange = vi.fn()
    const onRemove = vi.fn()
    render(
      <ListItemRow
        item={makeItem({ quantity: 1 })}
        onToggle={vi.fn()}
        onRemove={onRemove}
        onQuantityChange={onQuantityChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^remove milk$/i }))

    expect(onRemove).toHaveBeenCalledWith('1')
    expect(onQuantityChange).not.toHaveBeenCalled()
  })
})
