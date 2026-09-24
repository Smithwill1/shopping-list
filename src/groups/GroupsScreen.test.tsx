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
  it('shows an empty state with a create CTA when there are no groups', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    expect(await screen.findByText(/no groups yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create your first group/i })).toBeInTheDocument()
  })

  it('shows existing groups alongside a smaller "new group" button', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [{ id: '1', name: 'Pizza night' }] }))
    renderScreen()

    expect(await screen.findByText('Pizza night')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new group/i })).toBeInTheDocument()
  })

  it('shows a validation error instead of submitting when the name is blank', async () => {
    mockSelect.mockReturnValue(selectChain({ data: [] }))
    renderScreen()

    fireEvent.click(await screen.findByRole('button', { name: /create your first group/i }))
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/group name is required/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
