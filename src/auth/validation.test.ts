import { describe, expect, it } from 'vitest'
import { validateEmail, validatePassword } from './validation'

describe('validateEmail', () => {
  it('rejects empty input', () => {
    expect(validateEmail('')).toBe('Email is required')
  })

  it('rejects malformed emails', () => {
    expect(validateEmail('not-an-email')).toBe('Enter a valid email')
  })

  it('accepts a valid email', () => {
    expect(validateEmail('a@b.com')).toBeNull()
  })
})

describe('validatePassword', () => {
  it('rejects empty input', () => {
    expect(validatePassword('')).toBe('Password is required')
  })

  it('rejects short passwords', () => {
    expect(validatePassword('short')).toBe('Password must be at least 8 characters')
  })

  it('accepts a password of 8+ characters', () => {
    expect(validatePassword('longenough')).toBeNull()
  })
})
