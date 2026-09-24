import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { validateEmail, validatePassword } from './validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">🛒 Shopping List</h1>

      <Card className="w-full">
        <CardHeader>
          <h2 className="text-xl font-medium leading-snug">
            {mode === 'sign-in' ? 'Sign in' : 'Create an account'}
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Label className="flex-col items-stretch gap-1.5">
              Email
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Label>
            <Label className="flex-col items-stretch gap-1.5">
              Password
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              />
            </Label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="mt-1 w-full">
              {mode === 'sign-in' ? 'Sign in' : 'Sign up'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="link"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setError(null)
        }}
      >
        {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </Button>
    </div>
  )
}
