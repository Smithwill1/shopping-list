import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListsScreen } from './ListsScreen'

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

function renderScreen() {
  return render(
    <MemoryRouter>
      <ListsScreen householdId="household-1" />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockSelect.mockReset()
  mockInsert.mockReset()
})

describe('ListsScreen', () => {
  it('shows an empty state with a create CTA when there are no lists', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    expect(await screen.findByText(/no lists yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create your first list/i })).toBeInTheDocument()
  })

  it('shows existing lists alongside a smaller "new list" button', async () => {
    mockSelect.mockReturnValue(
      selectChain({ data: [{ id: '1', name: 'Groceries', description: null }] }),
    )
    renderScreen()

    expect(await screen.findByText('Groceries')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ new list/i })).toBeInTheDocument()
  })

  it('shows a validation error instead of submitting when the name is blank', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    fireEvent.click(await screen.findByRole('button', { name: /create your first list/i }))
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/list name is required/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
