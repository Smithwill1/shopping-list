import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListsScreen } from './ListsScreen'

const mockSelect = vi.fn()
const mockInsert = vi.fn()

function fakeChannel() {
  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn(() => channel),
  }
  return channel
}

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({ select: mockSelect, insert: mockInsert })),
    channel: vi.fn(() => fakeChannel()),
    removeChannel: vi.fn(),
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
  it('shows an empty state pointing at the floating add button when there are no lists', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    expect(await screen.findByText(/no lists yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add a new list/i })).toBeInTheDocument()
  })

  it('shows existing lists, with the floating add button still available', async () => {
    mockSelect.mockReturnValue(
      selectChain({ data: [{ id: '1', name: 'Groceries', description: null }] }),
    )
    renderScreen()

    expect(await screen.findByText('Groceries')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add a new list/i })).toBeInTheDocument()
  })

  it('opens the add-list dialog when the floating button is clicked', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /add a new list/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/list name/i)).toBeInTheDocument()
  })

  it('shows a validation error instead of submitting when the name is blank', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    fireEvent.click(await screen.findByRole('button', { name: /add a new list/i }))
    fireEvent.click(await screen.findByRole('button', { name: /^create$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/list name is required/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
