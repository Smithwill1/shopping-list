import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QuickAddItem } from './QuickAddItem'

const mockItemsInsert = vi.fn()
const mockItemsSelect = vi.fn()
const mockListItemsInsert = vi.fn()

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn((table: string) =>
      table === 'items'
        ? { insert: mockItemsInsert, select: mockItemsSelect }
        : { insert: mockListItemsInsert },
    ),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}))

function selectChain(result: { data: unknown }) {
  const builder = {
    eq: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  }
  return builder
}

beforeEach(() => {
  mockItemsInsert.mockReset()
  mockItemsSelect.mockReset()
  mockListItemsInsert.mockReset()
})

function renderForm(onAdded = vi.fn()) {
  render(
    <QuickAddItem householdId="household-1" listId="list-1" existingItems={[]} onAdded={onAdded} />,
  )
  return onAdded
}

describe('QuickAddItem', () => {
  it('shows a validation error instead of submitting when the name is blank', () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /^add to list$/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/item name is required/i)
    expect(mockListItemsInsert).not.toHaveBeenCalled()
  })

  it('"Add to list" creates an ad-hoc list item, not a catalog item', async () => {
    mockListItemsInsert.mockResolvedValue({ error: null })
    const onAdded = renderForm()

    fireEvent.change(screen.getByLabelText(/add an item/i), { target: { value: 'Milk' } })
    fireEvent.click(screen.getByRole('button', { name: /^add to list$/i }))

    await vi.waitFor(() => expect(mockListItemsInsert).toHaveBeenCalled())
    expect(mockListItemsInsert).toHaveBeenCalledWith({
      list_id: 'list-1',
      name: 'Milk',
      created_by: 'user-1',
    })
    expect(mockItemsInsert).not.toHaveBeenCalled()
    expect(onAdded).toHaveBeenCalled()
  })

  it('"Add + save for later" creates a catalog item, then links it', async () => {
    mockItemsInsert.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'item-1' }, error: null })),
      })),
    })
    mockListItemsInsert.mockResolvedValue({ error: null })
    const onAdded = renderForm()

    fireEvent.change(screen.getByLabelText(/add an item/i), { target: { value: 'Bananas' } })
    fireEvent.click(screen.getByRole('button', { name: /save for later/i }))

    await vi.waitFor(() => expect(mockListItemsInsert).toHaveBeenCalled())
    expect(mockListItemsInsert).toHaveBeenCalledWith({
      list_id: 'list-1',
      item_id: 'item-1',
      created_by: 'user-1',
    })
    expect(onAdded).toHaveBeenCalled()
  })

  it('reuses an existing catalog item instead of failing on a duplicate name', async () => {
    mockItemsInsert.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate' } }),
        ),
      })),
    })
    mockItemsSelect.mockReturnValue(selectChain({ data: { id: 'existing-1' } }))
    mockListItemsInsert.mockResolvedValue({ error: null })
    const onAdded = renderForm()

    fireEvent.change(screen.getByLabelText(/add an item/i), { target: { value: 'Bananas' } })
    fireEvent.click(screen.getByRole('button', { name: /save for later/i }))

    await vi.waitFor(() => expect(mockListItemsInsert).toHaveBeenCalled())
    expect(mockListItemsInsert).toHaveBeenCalledWith({
      list_id: 'list-1',
      item_id: 'existing-1',
      created_by: 'user-1',
    })
    expect(onAdded).toHaveBeenCalled()
  })
})
