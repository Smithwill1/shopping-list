import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupsScreen } from './GroupsScreen'

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
      <GroupsScreen householdId="household-1" />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockSelect.mockReset()
  mockInsert.mockReset()
})

describe('GroupsScreen', () => {
  it('shows an empty state pointing at the floating add button when there are no groups', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    expect(await screen.findByText(/no groups yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add a new group/i })).toBeInTheDocument()
  })

  it('shows existing groups, with the floating add button still available', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [{ id: '1', name: 'Pizza night' }] }))
    renderScreen()

    expect(await screen.findByText('Pizza night')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add a new group/i })).toBeInTheDocument()
  })

  it('opens the add-group dialog when the floating button is clicked', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /add a new group/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument()
  })

  it('shows a validation error instead of submitting when the name is blank', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    fireEvent.click(await screen.findByRole('button', { name: /add a new group/i }))
    fireEvent.click(await screen.findByRole('button', { name: /^create$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/group name is required/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
