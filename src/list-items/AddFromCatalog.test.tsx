import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddFromCatalog } from './AddFromCatalog'
import type { Item } from '../items/useItems'

const mockInsert = vi.fn()

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: mockInsert })),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}))

const catalogItems: Item[] = [
  { id: 'item-milk', name: 'Milk', price: 2, rank: 1000 },
  { id: 'item-eggs', name: 'Eggs', price: 6, rank: 2000 },
]

beforeEach(() => {
  mockInsert.mockReset()
})

describe('AddFromCatalog', () => {
  it('renders nothing when every catalog item is already on the list', () => {
    render(
      <AddFromCatalog
        listId="list-1"
        catalogItems={catalogItems}
        listItems={[
          {
            id: 'li-1',
            itemId: 'item-milk',
            name: 'Milk',
            price: 2,
            rank: 1000,
            done: false,
            quantity: 1,
          },
          {
            id: 'li-2',
            itemId: 'item-eggs',
            name: 'Eggs',
            price: 6,
            rank: 2000,
            done: false,
            quantity: 1,
          },
        ]}
        onAdded={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /add from your items/i })).not.toBeInTheDocument()
  })

  it('excludes items already on the list and lets you pick quantities for the rest', async () => {
    render(
      <AddFromCatalog
        listId="list-1"
        catalogItems={catalogItems}
        listItems={[]}
        onAdded={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /add from your items/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()

    // nothing selected yet
    expect(screen.getByRole('button', { name: /^add items$/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /increase quantity of milk/i }))
    fireEvent.click(screen.getByRole('button', { name: /increase quantity of milk/i }))

    expect(screen.getByRole('button', { name: /add 2 items \(\$4\.00\)/i })).toBeInTheDocument()
  })

  it('confirming inserts only the selected items, with their chosen quantities', async () => {
    mockInsert.mockResolvedValue({ error: null })
    const onAdded = vi.fn()
    render(
      <AddFromCatalog
        listId="list-1"
        catalogItems={catalogItems}
        listItems={[]}
        onAdded={onAdded}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /add from your items/i }))
    await screen.findByRole('dialog')

    fireEvent.click(screen.getByRole('button', { name: /increase quantity of eggs/i }))
    fireEvent.click(screen.getByRole('button', { name: /increase quantity of eggs/i }))
    fireEvent.click(screen.getByRole('button', { name: /increase quantity of eggs/i }))
    fireEvent.click(screen.getByRole('button', { name: /add 3 items/i }))

    await vi.waitFor(() => expect(mockInsert).toHaveBeenCalled())
    expect(mockInsert).toHaveBeenCalledWith([
      { list_id: 'list-1', item_id: 'item-eggs', quantity: 3, created_by: 'user-1' },
    ])
    expect(onAdded).toHaveBeenCalled()
  })
})
