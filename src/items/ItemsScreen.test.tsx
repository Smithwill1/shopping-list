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
  it('shows an empty state pointing at the floating add button when there are no items', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    render(<ItemsScreen householdId="household-1" />)

    expect(await screen.findByText(/no saved items yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add a new item/i })).toBeInTheDocument()
  })

  it('shows existing items, with the floating add button still available', async () => {
    mockSelect.mockReturnValue(
      selectChain({ data: [{ id: '1', name: 'Bananas', price: 3.5, rank: 1000 }] }),
    )
    render(<ItemsScreen householdId="household-1" />)

    expect(await screen.findByText('Bananas')).toBeInTheDocument()
    expect(screen.getByText('$3.50')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add a new item/i })).toBeInTheDocument()
  })

  it('opens the add-item dialog when the floating button is clicked', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    render(<ItemsScreen householdId="household-1" />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /add a new item/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/item name/i)).toBeInTheDocument()
  })

  it('shows a validation error instead of submitting when the name is blank', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    render(<ItemsScreen householdId="household-1" />)

    fireEvent.click(await screen.findByRole('button', { name: /add a new item/i }))
    fireEvent.click(await screen.findByRole('button', { name: /^add item$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/item name is required/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('shows a validation error for a non-numeric price', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    render(<ItemsScreen householdId="household-1" />)

    fireEvent.click(await screen.findByRole('button', { name: /add a new item/i }))
    fireEvent.change(await screen.findByLabelText(/item name/i), { target: { value: 'Milk' } })
    fireEvent.change(screen.getByLabelText(/rough price/i), { target: { value: 'free' } })
    fireEvent.click(screen.getByRole('button', { name: /^add item$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter a valid number/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
