import { requireNonBlank } from '../lib/validation'

export function validateEmail(email: string): string | null {
  const requiredError = requireNonBlank(email, 'Email')
  if (requiredError) return requiredError
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email'
  return null
}

export function validatePassword(password: string): string | null {
  const requiredError = requireNonBlank(password, 'Password')
  if (requiredError) return requiredError
  if (password.length < 8) return 'Password must be at least 8 characters'
  return null
}
