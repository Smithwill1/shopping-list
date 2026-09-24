import { describe, expect, it } from 'vitest'
import { validateItemName, validatePrice } from './validation'

describe('validateItemName', () => {
  it('rejects a blank name', () => {
    expect(validateItemName('  ')).toBe('Item name is required')
  })

  it('accepts a real name', () => {
    expect(validateItemName('Bananas')).toBeNull()
  })
})

describe('validatePrice', () => {
  it('accepts a blank price (optional)', () => {
    expect(validatePrice('')).toBeNull()
  })

  it('rejects a non-numeric price', () => {
    expect(validatePrice('free')).toBe('Enter a valid number')
  })

  it('rejects a negative price', () => {
    expect(validatePrice('-5')).toBe('Price cannot be negative')
  })

  it('accepts a valid price', () => {
    expect(validatePrice('3.50')).toBeNull()
  })
})
