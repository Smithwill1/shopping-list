import { describe, expect, it } from 'vitest'
import { validateListName } from './validation'

describe('validateListName', () => {
  it('rejects a blank name', () => {
    expect(validateListName('   ')).toBe('List name is required')
  })

  it('accepts a real name', () => {
    expect(validateListName('Weekly groceries')).toBeNull()
  })
})
