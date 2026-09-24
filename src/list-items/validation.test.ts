import { describe, expect, it } from 'vitest'
import { validateNewItemName } from './validation'

describe('validateNewItemName', () => {
  it('rejects a blank name', () => {
    expect(validateNewItemName('  ')).toBe('Item name is required')
  })

  it('accepts a real name', () => {
    expect(validateNewItemName('Milk')).toBeNull()
  })
})
