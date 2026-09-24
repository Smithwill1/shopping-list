import { describe, expect, it } from 'vitest'
import { validateHouseholdName, validateInviteCode } from './validation'

describe('validateHouseholdName', () => {
  it('rejects a blank name', () => {
    expect(validateHouseholdName('   ')).toBe('Household name is required')
  })

  it('accepts a real name', () => {
    expect(validateHouseholdName('Smith Household')).toBeNull()
  })
})

describe('validateInviteCode', () => {
  it('rejects a blank code', () => {
    expect(validateInviteCode('')).toBe('Invite code is required')
  })

  it('accepts a non-blank code', () => {
    expect(validateInviteCode('ABC123')).toBeNull()
  })
})
