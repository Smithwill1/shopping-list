import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupSelectionPanel } from './GroupSelectionPanel'

const mockGroupItemsSelect = vi.fn()
const mockListItemsInsert = vi.fn()

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn((table: string) =>
      table === 'group_items' ? { select: mockGroupItemsSelect } : { insert: mockListItemsInsert },
    ),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}))

function groupItemsChain(data: unknown[]) {
  return { eq: vi.fn(() => Promise.resolve({ data })) }
}

const pizzaGroupItems = [
  { id: 'gi-1', item_id: 'item-base', items: { name: 'Pizza base', price: 3, rank: 1000 } },
  { id: 'gi-2', item_id: 'item-cheese', items: { name: 'Cheese', price: 5, rank: 2000 } },
]

beforeEach(() => {
  mockGroupItemsSelect.mockReset()
  mockListItemsInsert.mockReset()
})

describe('GroupSelectionPanel', () => {
  it('pre-selects every item not already on the list', async () => {
    mockGroupItemsSelect.mockReturnValue(groupItemsChain(pizzaGroupItems))
    render(
      <GroupSelectionPanel
        groupId="group-1"
        groupName="Pizza night"
        listId="list-1"
        listItems={[]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    )

    expect(await screen.findByRole('checkbox', { name: 'Pizza base' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Cheese' })).toBeChecked()
    expect(screen.getByRole('button', { name: /add 2 items/i })).toBeInTheDocument()
  })

  it('excludes items already on the list from the panel entirely', async () => {
    mockGroupItemsSelect.mockReturnValue(groupItemsChain(pizzaGroupItems))
    render(
      <GroupSelectionPanel
        groupId="group-1"
        groupName="Pizza night"
        listId="list-1"
        listItems={[
          {
            id: 'li-1',
            itemId: 'item-base',
            name: 'Pizza base',
            price: 3,
            rank: 1000,
            done: false,
          },
        ]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    )

    expect(await screen.findByRole('checkbox', { name: 'Cheese' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Pizza base' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add 1 item$/i })).toBeInTheDocument()
  })

  it('deselecting an item excludes it from the confirmed insert', async () => {
    mockGroupItemsSelect.mockReturnValue(groupItemsChain(pizzaGroupItems))
    mockListItemsInsert.mockResolvedValue({ error: null })
    const onConfirmed = vi.fn()

    render(
      <GroupSelectionPanel
        groupId="group-1"
        groupName="Pizza night"
        listId="list-1"
        listItems={[]}
        onCancel={vi.fn()}
        onConfirmed={onConfirmed}
      />,
    )

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Cheese' }))
    fireEvent.click(screen.getByRole('button', { name: /add 1 item$/i }))

    await vi.waitFor(() => expect(mockListItemsInsert).toHaveBeenCalled())
    expect(mockListItemsInsert).toHaveBeenCalledWith([
      { list_id: 'list-1', item_id: 'item-base', created_by: 'user-1' },
    ])
    expect(onConfirmed).toHaveBeenCalled()
  })
})
