import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthScreen } from './AuthScreen'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { signInWithPassword: vi.fn(), signUp: vi.fn() } },
}))

describe('AuthScreen', () => {
  it('starts in sign-in mode', () => {
    render(<AuthScreen />)
    expect(screen.getByRole('heading', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('toggles to sign-up mode', () => {
    render(<AuthScreen />)
    fireEvent.click(screen.getByText(/don't have an account/i))
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
  })

  it('shows a validation error instead of submitting when the email is blank', () => {
    render(<AuthScreen />)
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i)
  })
})
