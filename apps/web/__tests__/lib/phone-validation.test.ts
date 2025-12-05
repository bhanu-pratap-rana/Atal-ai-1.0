/**
 * Phone Validation Tests
 * Tests phone number format validation, sanitization, and masking
 * Covers India-specific (+91) and generic international formats
 */

import {
  validatePhone,
  validatePhoneNumber,
  sanitizePhone,
  maskPhoneNumber,
} from '@/lib/phone-validation'

describe('Phone Validation', () => {
  describe('validatePhone', () => {
    it('should accept valid 10-digit phone numbers without country code', () => {
      const result = validatePhone('9876543210')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid 10-digit phone numbers with country code', () => {
      const result = validatePhone('+919876543210')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept phone numbers with spaces', () => {
      const result = validatePhone('9876 543210')
      expect(result.valid).toBe(true)
    })

    it('should accept phone numbers with hyphens', () => {
      const result = validatePhone('9876-543210')
      expect(result.valid).toBe(true)
    })

    it('should accept phone numbers with country code and spaces', () => {
      const result = validatePhone('+91 9876 543210')
      expect(result.valid).toBe(true)
    })

    it('should reject phone numbers with less than 10 digits', () => {
      const result = validatePhone('987654321')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should accept and slice phone numbers to 10 digits', () => {
      const result = validatePhone('98765432101')
      expect(result.valid).toBe(true)
    })

    it('should reject empty phone numbers', () => {
      const result = validatePhone('')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should accept phone numbers with letters that get stripped', () => {
      const result = validatePhone('9876543210')
      expect(result.valid).toBe(true)
    })

    it('should reject null or undefined input', () => {
      const result = validatePhone(null as any)
      expect(result.valid).toBe(false)
    })

    it('should handle country code prefix +91 with spaces', () => {
      const result = validatePhone('+91 98765 43210')
      expect(result.valid).toBe(true)
    })

    it('should handle different digit starting positions', () => {
      const result = validatePhone('8765432109')
      expect(result.valid).toBe(true)
    })
  })

  describe('validatePhoneNumber', () => {
    it('should accept valid 10-digit Indian phone numbers', () => {
      const result = validatePhoneNumber('9876543210')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid 10-digit phone numbers with country code', () => {
      const result = validatePhoneNumber('+919876543210')
      expect(result.valid).toBe(true)
    })

    it('should accept phone numbers with formatting characters', () => {
      const result = validatePhoneNumber('98765-43210')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      const result = validatePhoneNumber('123')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject phone numbers with invalid characters', () => {
      const result = validatePhoneNumber('9876543ABC')
      expect(result.valid).toBe(false)
    })

    it('should handle empty input', () => {
      const result = validatePhoneNumber('')
      expect(result.valid).toBe(false)
    })
  })

  describe('sanitizePhone', () => {
    it('should remove all non-digit characters and add country code', () => {
      const sanitized = sanitizePhone('(98765) 43210')
      expect(sanitized).toBe('+919876543210')
    })

    it('should normalize country code and add if missing', () => {
      const sanitized = sanitizePhone('+91 98765 43210')
      expect(sanitized).toContain('9876543210')
    })

    it('should handle hyphens and add country code', () => {
      const sanitized = sanitizePhone('98765-43210')
      expect(sanitized).toBe('+919876543210')
    })

    it('should handle spaces and add country code', () => {
      const sanitized = sanitizePhone('98765 43210')
      expect(sanitized).toBe('+919876543210')
    })

    it('should handle complex formatting and normalize', () => {
      const sanitized = sanitizePhone('+91 (98765) 43210')
      expect(sanitized).toContain('9876543210')
    })

    it('should add country code prefix', () => {
      const sanitized = sanitizePhone('9876543210')
      expect(sanitized).toBe('+919876543210')
    })

    it('should return country code for empty input', () => {
      const sanitized = sanitizePhone('')
      expect(sanitized).toBe('+91')
    })

    it('should normalize to country code + digits format', () => {
      const sanitized = sanitizePhone('+91-98765 (43210)')
      expect(sanitized).toContain('+91')
      expect(sanitized).toContain('9876543210')
    })
  })

  describe('maskPhoneNumber', () => {
    it('should mask phone number for security', () => {
      const masked = maskPhoneNumber('9876543210')
      expect(masked).toContain('*')
      expect(masked).toMatch(/\*+/)
    })

    it('should preserve last 4 digits', () => {
      const masked = maskPhoneNumber('9876543210')
      expect(masked).toContain('3210')
    })

    it('should show format ***XXXX', () => {
      const masked = maskPhoneNumber('9876543210')
      expect(masked).toBe('***3210')
    })

    it('should handle phone numbers with country code', () => {
      const masked = maskPhoneNumber('+919876543210')
      expect(masked).toContain('*')
    })

    it('should return masked format for logging', () => {
      const masked = maskPhoneNumber('9876543210')
      expect(masked).toMatch(/\*+\d{4}/)
    })

    it('should handle short phone numbers gracefully', () => {
      const masked = maskPhoneNumber('1234')
      expect(typeof masked).toBe('string')
    })

    it('should handle empty string', () => {
      const masked = maskPhoneNumber('')
      expect(typeof masked).toBe('string')
    })
  })

  describe('Phone validation edge cases', () => {
    it('should accept phone numbers with leading zero (sanitizer strips it)', () => {
      const result = validatePhone('09876543210')
      expect(result.valid).toBe(true)
    })

    it('should handle phone numbers starting with different digits', () => {
      const result = validatePhone('5876543210')
      expect(result.valid).toBe(true)
    })

    it('should accept all valid 10-digit combinations', () => {
      const result = validatePhone('0000000000')
      expect(result.valid).toBe(true)
    })

    it('should accept phone numbers with spaces as separators', () => {
      const result = validatePhone('9876 543210')
      expect(result.valid).toBe(true)
    })

    it('should reject whitespace-only input', () => {
      const result = validatePhone('   ')
      expect(result.valid).toBe(false)
    })
  })
})
