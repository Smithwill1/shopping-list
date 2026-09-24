import { describe, expect, it } from 'vitest'
import { friendlyError } from './errors'

describe('friendlyError', () => {
  it('replaces a unique-violation error with the given message', () => {
    expect(friendlyError({ code: '23505', message: 'duplicate key value' }, 'Already exists')).toBe(
      'Already exists',
    )
  })

  it('passes other errors through unchanged', () => {
    expect(friendlyError({ code: '42501', message: 'permission denied' }, 'Already exists')).toBe(
      'permission denied',
    )
  })
})
