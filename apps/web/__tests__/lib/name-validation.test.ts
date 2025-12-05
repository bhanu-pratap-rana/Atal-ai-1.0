/**
 * Name & Roll Number Validation Tests
 * Tests validation for names, roll numbers, and string sanitization
 */

import {
  validateName,
  validateRollNumber,
  sanitizeString,
} from '@/lib/name-validation'

describe('Name Validation', () => {
  describe('validateName', () => {
    it('should accept valid names with letters only', () => {
      const result = validateName('John')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept names with spaces', () => {
      const result = validateName('John Doe')
      expect(result.valid).toBe(true)
    })

    it('should accept names with hyphens', () => {
      const result = validateName('John-Paul')
      expect(result.valid).toBe(true)
    })

    it('should accept names with apostrophes', () => {
      const result = validateName("O'Brien")
      expect(result.valid).toBe(true)
    })

    it('should accept names with mixed letters, spaces, hyphens, and apostrophes', () => {
      const result = validateName("Mary-Jane O'Connor")
      expect(result.valid).toBe(true)
    })

    it('should accept minimum 2 character names', () => {
      const result = validateName('Jo')
      expect(result.valid).toBe(true)
    })

    it('should reject single character names', () => {
      const result = validateName('J')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject names with less than 2 characters', () => {
      const result = validateName('A')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('at least 2 characters')
    })

    it('should reject empty names', () => {
      const result = validateName('')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject names exceeding 100 characters', () => {
      const longName = 'A'.repeat(101)
      const result = validateName(longName)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too long')
    })

    it('should reject names with exactly 101 characters', () => {
      const longName = 'John' + 'A'.repeat(97)
      const result = validateName(longName)
      expect(result.valid).toBe(false)
    })

    it('should accept names with exactly 100 characters', () => {
      const longName = 'J' + 'o'.repeat(99)
      const result = validateName(longName)
      expect(result.valid).toBe(true)
    })

    it('should reject names with numbers', () => {
      const result = validateName('John123')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject names with special characters', () => {
      const result = validateName('John@Doe')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('only contain letters')
    })

    it('should reject names with symbols', () => {
      const result = validateName('John$Doe')
      expect(result.valid).toBe(false)
    })

    it('should trim whitespace from names', () => {
      const result = validateName('  John Doe  ')
      expect(result.valid).toBe(true)
    })

    it('should reject names with only spaces', () => {
      const result = validateName('   ')
      expect(result.valid).toBe(false)
    })

    it('should reject names with leading/trailing spaces when trimmed', () => {
      const result = validateName(' ')
      expect(result.valid).toBe(false)
    })

    it('should accept uppercase names', () => {
      const result = validateName('JOHN')
      expect(result.valid).toBe(true)
    })

    it('should accept lowercase names', () => {
      const result = validateName('john')
      expect(result.valid).toBe(true)
    })

    it('should accept mixed case names', () => {
      const result = validateName('JoHn DoE')
      expect(result.valid).toBe(true)
    })
  })
})

describe('Roll Number Validation', () => {
  describe('validateRollNumber', () => {
    it('should accept valid alphanumeric roll numbers', () => {
      const result = validateRollNumber('2024001')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept roll numbers with letters', () => {
      const result = validateRollNumber('A2024001')
      expect(result.valid).toBe(true)
    })

    it('should accept roll numbers with only numbers', () => {
      const result = validateRollNumber('123456')
      expect(result.valid).toBe(true)
    })

    it('should accept roll numbers with only letters', () => {
      const result = validateRollNumber('ABCDEF')
      expect(result.valid).toBe(true)
    })

    it('should accept single character roll numbers', () => {
      const result = validateRollNumber('A')
      expect(result.valid).toBe(true)
    })

    it('should reject empty roll numbers', () => {
      const result = validateRollNumber('')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject whitespace-only roll numbers', () => {
      const result = validateRollNumber('   ')
      expect(result.valid).toBe(false)
    })

    it('should reject null or undefined input', () => {
      const result = validateRollNumber(null as any)
      expect(result.valid).toBe(false)
    })

    it('should reject non-string input', () => {
      const result = validateRollNumber(123 as any)
      expect(result.valid).toBe(false)
    })

    it('should accept roll numbers with special formatting', () => {
      const result = validateRollNumber('2024-001')
      expect(result.valid).toBe(true)
    })
  })
})

describe('String Sanitization', () => {
  describe('sanitizeString', () => {
    it('should trim leading whitespace', () => {
      const sanitized = sanitizeString('  hello')
      expect(sanitized).toBe('hello')
    })

    it('should trim trailing whitespace', () => {
      const sanitized = sanitizeString('hello  ')
      expect(sanitized).toBe('hello')
    })

    it('should trim both leading and trailing whitespace', () => {
      const sanitized = sanitizeString('  hello  ')
      expect(sanitized).toBe('hello')
    })

    it('should replace multiple spaces with single space', () => {
      const sanitized = sanitizeString('hello   world')
      expect(sanitized).toBe('hello world')
    })

    it('should replace multiple spaces between words', () => {
      const sanitized = sanitizeString('hello    world    test')
      expect(sanitized).toBe('hello world test')
    })

    it('should handle tabs and convert to single space', () => {
      const sanitized = sanitizeString('hello\t\tworld')
      expect(sanitized).toBe('hello world')
    })

    it('should handle mixed whitespace characters', () => {
      const sanitized = sanitizeString('hello \t  \n world')
      expect(sanitized).toBe('hello world')
    })

    it('should preserve case', () => {
      const sanitized = sanitizeString('  HeLLo WoRLd  ')
      expect(sanitized).toBe('HeLLo WoRLd')
    })

    it('should handle already sanitized strings', () => {
      const sanitized = sanitizeString('hello world')
      expect(sanitized).toBe('hello world')
    })

    it('should return empty string for whitespace-only input', () => {
      const sanitized = sanitizeString('   ')
      expect(sanitized).toBe('')
    })

    it('should handle newlines', () => {
      const sanitized = sanitizeString('hello\nworld')
      expect(sanitized).toBe('hello world')
    })

    it('should handle carriage returns', () => {
      const sanitized = sanitizeString('hello\r\nworld')
      expect(sanitized).toBe('hello world')
    })
  })
})
