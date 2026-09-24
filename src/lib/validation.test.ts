import { describe, expect, it } from 'vitest'
import { requireNonBlank } from './validation'

describe('requireNonBlank', () => {
  it('rejects an empty string', () => {
    expect(requireNonBlank('', 'Name')).toBe('Name is required')
  })

  it('rejects a whitespace-only string', () => {
    expect(requireNonBlank('   ', 'Name')).toBe('Name is required')
  })

  it('accepts a non-blank value', () => {
    expect(requireNonBlank('Bananas', 'Name')).toBeNull()
  })
})
