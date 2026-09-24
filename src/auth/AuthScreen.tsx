import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { validateEmail, validatePassword } from './validation'

type Mode = 'sign-in' | 'sign-up'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validateEmail(email) ?? validatePassword(password)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    const { error: authError } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setSubmitting(false)

    if (authError) setError(authError.message)
  }

  return (
    <main>
      <header>
        <h1>🛒 Shopping List</h1>
      </header>
      <form onSubmit={handleSubmit}>
        <h2>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</h2>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={submitting}>
          {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setError(null)
        }}
      >
        {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </main>
  )
}
