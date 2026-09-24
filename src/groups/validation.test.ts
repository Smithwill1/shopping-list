import { describe, expect, it } from 'vitest'
import { validateGroupName } from './validation'

describe('validateGroupName', () => {
  it('rejects a blank name', () => {
    expect(validateGroupName('  ')).toBe('Group name is required')
  })

  it('accepts a real name', () => {
    expect(validateGroupName('Pizza night')).toBeNull()
  })
})
