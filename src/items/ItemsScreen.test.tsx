import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ItemsScreen } from './ItemsScreen'

const mockSelect = vi.fn()
const mockInsert = vi.fn()

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({ select: mockSelect, insert: mockInsert })),
  },
}))

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}))

function selectChain(result: { data: unknown[] }) {
  const builder = {
    eq: vi.fn(() => builder),
    order: vi.fn(() => Promise.resolve(result)),
  }
  return builder
}

beforeEach(() => {
  mockSelect.mockReset()
  mockInsert.mockReset()
})

describe('ItemsScreen', () => {
  it('shows an empty state with an add-item CTA when there are no items', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    render(<ItemsScreen householdId="household-1" />)

    expect(await screen.findByText(/no saved items yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add a new item/i })).toBeInTheDocument()
  })

  it('shows existing items alongside a smaller "new item" button', async () => {
    mockSelect.mockReturnValue(
      selectChain({ data: [{ id: '1', name: 'Bananas', price: 3.5, rank: 1000 }] }),
    )
    render(<ItemsScreen householdId="household-1" />)

    expect(await screen.findByText('Bananas')).toBeInTheDocument()
    expect(screen.getByText('$3.50')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new item/i })).toBeInTheDocument()
  })

  it('shows a validation error instead of submitting when the name is blank', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    render(<ItemsScreen householdId="household-1" />)

    fireEvent.click(await screen.findByRole('button', { name: /add a new item/i }))
    fireEvent.click(screen.getByRole('button', { name: /^add item$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/item name is required/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('shows a validation error for a non-numeric price', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    render(<ItemsScreen householdId="household-1" />)

    fireEvent.click(await screen.findByRole('button', { name: /add a new item/i }))
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: 'Milk' } })
    fireEvent.change(screen.getByLabelText(/rough price/i), { target: { value: 'free' } })
    fireEvent.click(screen.getByRole('button', { name: /^add item$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter a valid number/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
