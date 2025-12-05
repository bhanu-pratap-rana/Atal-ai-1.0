/**
 * Code/PIN/OTP Validation Tests
 * Tests validation and sanitization for class codes, PINs, OTPs, and school codes
 */

import {
  validateSchoolCode,
  validateClassCode,
  sanitizeClassCode,
  validatePin,
  validatePIN,
  sanitizePIN,
  sanitizeOTP,
  validateOTP,
} from '@/lib/code-validation'

describe('School Code Validation', () => {
  describe('validateSchoolCode', () => {
    it('should accept valid 6-character alphanumeric school code', () => {
      const result = validateSchoolCode('SCHOOL')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept uppercase school codes', () => {
      const result = validateSchoolCode('ABC123')
      expect(result.valid).toBe(true)
    })

    it('should accept school codes with all letters', () => {
      const result = validateSchoolCode('ABCDEF')
      expect(result.valid).toBe(true)
    })

    it('should accept school codes with all numbers', () => {
      const result = validateSchoolCode('123456')
      expect(result.valid).toBe(true)
    })

    it('should convert lowercase to uppercase', () => {
      const result = validateSchoolCode('school')
      expect(result.valid).toBe(true)
    })

    it('should reject codes with less than 6 characters', () => {
      const result = validateSchoolCode('ABCD1')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject codes with more than 6 characters', () => {
      const result = validateSchoolCode('ABCDEF1')
      expect(result.valid).toBe(false)
    })

    it('should reject codes with special characters', () => {
      const result = validateSchoolCode('SCHOOL!')
      expect(result.valid).toBe(false)
    })

    it('should reject codes with spaces', () => {
      const result = validateSchoolCode('ABC DE1')
      expect(result.valid).toBe(false)
    })

    it('should reject empty school code', () => {
      const result = validateSchoolCode('')
      expect(result.valid).toBe(false)
    })
  })
})

describe('Class Code Validation', () => {
  describe('validateClassCode', () => {
    it('should accept valid 6-character alphanumeric class code', () => {
      const result = validateClassCode('CLASS1')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept uppercase class codes', () => {
      const result = validateClassCode('ABC123')
      expect(result.valid).toBe(true)
    })

    it('should convert lowercase to uppercase', () => {
      const result = validateClassCode('class1')
      expect(result.valid).toBe(true)
    })

    it('should sanitize and validate non-alphanumeric characters', () => {
      const result = validateClassCode('clas-s1')
      expect(result.valid).toBe(true)
    })

    it('should handle mixed case with special characters', () => {
      const result = validateClassCode('CLAs.S1')
      expect(result.valid).toBe(true)
    })

    it('should reject code without enough alphanumeric characters', () => {
      const result = validateClassCode('cl@ss!')
      expect(result.valid).toBe(false)
    })

    it('should reject null or undefined input', () => {
      const result = validateClassCode(null as any)
      expect(result.valid).toBe(false)
    })

    it('should reject empty class code', () => {
      const result = validateClassCode('')
      expect(result.valid).toBe(false)
    })

    it('should reject codes with less than 6 characters after sanitization', () => {
      const result = validateClassCode('ABC')
      expect(result.valid).toBe(false)
    })
  })

  describe('sanitizeClassCode', () => {
    it('should remove non-alphanumeric characters', () => {
      const sanitized = sanitizeClassCode('cla-ss1')
      expect(sanitized).toBe('CLASS1')
    })

    it('should convert to uppercase', () => {
      const sanitized = sanitizeClassCode('class1')
      expect(sanitized).toBe('CLASS1')
    })

    it('should remove special characters', () => {
      const sanitized = sanitizeClassCode('cl-ass1')
      expect(sanitized).toBe('CLASS1')
    })

    it('should handle spaces', () => {
      const sanitized = sanitizeClassCode('cl as s1')
      expect(sanitized).toBe('CLASS1')
    })

    it('should slice to 6 characters maximum', () => {
      const sanitized = sanitizeClassCode('CLASSLONG123')
      expect(sanitized.length).toBeLessThanOrEqual(6)
    })

    it('should preserve all alphanumeric characters', () => {
      const sanitized = sanitizeClassCode('A1B2C3D4E5')
      expect(sanitized).toMatch(/^[A-Z0-9]+$/)
    })

    it('should handle already sanitized codes', () => {
      const sanitized = sanitizeClassCode('CLASS1')
      expect(sanitized).toBe('CLASS1')
    })
  })
})

describe('PIN Validation', () => {
  describe('validatePin', () => {
    it('should accept valid 4-digit PIN', () => {
      const result = validatePin('1234')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept PIN starting with zero', () => {
      const result = validatePin('0123')
      expect(result.valid).toBe(true)
    })

    it('should accept PIN with all same digits', () => {
      const result = validatePin('1111')
      expect(result.valid).toBe(true)
    })

    it('should accept PIN all zeros', () => {
      const result = validatePin('0000')
      expect(result.valid).toBe(true)
    })

    it('should reject PIN with less than 4 digits', () => {
      const result = validatePin('123')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject PIN with more than 4 digits', () => {
      const result = validatePin('12345')
      expect(result.valid).toBe(false)
    })

    it('should reject PIN with non-digit characters', () => {
      const result = validatePin('12A4')
      expect(result.valid).toBe(false)
    })

    it('should reject empty PIN', () => {
      const result = validatePin('')
      expect(result.valid).toBe(false)
    })

    it('should reject PIN with spaces', () => {
      const result = validatePin('12 34')
      expect(result.valid).toBe(false)
    })
  })

  describe('validatePIN', () => {
    it('should accept valid 4-digit PIN', () => {
      const result = validatePIN('1234')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject null or undefined input', () => {
      const result = validatePIN(null as any)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject empty PIN', () => {
      const result = validatePIN('')
      expect(result.valid).toBe(false)
    })

    it('should reject PIN with non-digit characters', () => {
      const result = validatePIN('12A4')
      expect(result.valid).toBe(false)
    })

    it('should reject PIN with incorrect length', () => {
      const result = validatePIN('123')
      expect(result.valid).toBe(false)
    })

    it('should accept valid PINs', () => {
      const validPins = ['0000', '1234', '9999', '5678']
      validPins.forEach(pin => {
        const result = validatePIN(pin)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('sanitizePIN', () => {
    it('should remove non-digit characters', () => {
      const sanitized = sanitizePIN('12-34')
      expect(sanitized).toBe('1234')
    })

    it('should remove all non-numeric input', () => {
      const sanitized = sanitizePIN('12a34')
      expect(sanitized).toBe('1234')
    })

    it('should slice to 4 digits maximum', () => {
      const sanitized = sanitizePIN('123456')
      expect(sanitized).toBe('1234')
    })

    it('should handle spaces', () => {
      const sanitized = sanitizePIN('12 34')
      expect(sanitized).toBe('1234')
    })

    it('should handle mixed special characters', () => {
      const sanitized = sanitizePIN('1-2.3,4')
      expect(sanitized).toBe('1234')
    })

    it('should return empty string for non-digit input', () => {
      const sanitized = sanitizePIN('ABCD')
      expect(sanitized).toBe('')
    })

    it('should handle already sanitized PINs', () => {
      const sanitized = sanitizePIN('1234')
      expect(sanitized).toBe('1234')
    })
  })
})

describe('OTP Validation', () => {
  describe('sanitizeOTP', () => {
    it('should remove non-digit characters', () => {
      const sanitized = sanitizeOTP('12-34-56')
      expect(sanitized).toBe('123456')
    })

    it('should remove all non-numeric input', () => {
      const sanitized = sanitizeOTP('12a34b56')
      expect(sanitized).toBe('123456')
    })

    it('should slice to 6 digits maximum', () => {
      const sanitized = sanitizeOTP('12345678')
      expect(sanitized).toBe('123456')
    })

    it('should handle spaces', () => {
      const sanitized = sanitizeOTP('12 34 56')
      expect(sanitized).toBe('123456')
    })

    it('should handle mixed special characters', () => {
      const sanitized = sanitizeOTP('1-2.3,4 5/6')
      expect(sanitized).toBe('123456')
    })

    it('should return empty string for non-digit input', () => {
      const sanitized = sanitizeOTP('ABCDEF')
      expect(sanitized).toBe('')
    })

    it('should handle already sanitized OTPs', () => {
      const sanitized = sanitizeOTP('123456')
      expect(sanitized).toBe('123456')
    })
  })

  describe('validateOTP', () => {
    it('should accept valid 6-digit OTP', () => {
      const result = validateOTP('123456')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept OTP starting with zero', () => {
      const result = validateOTP('012345')
      expect(result.valid).toBe(true)
    })

    it('should accept OTP with all same digits', () => {
      const result = validateOTP('111111')
      expect(result.valid).toBe(true)
    })

    it('should accept OTP all zeros', () => {
      const result = validateOTP('000000')
      expect(result.valid).toBe(true)
    })

    it('should reject OTP with less than 6 digits', () => {
      const result = validateOTP('12345')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject OTP with more than 6 digits', () => {
      const result = validateOTP('1234567')
      expect(result.valid).toBe(false)
    })

    it('should reject OTP with non-digit characters', () => {
      const result = validateOTP('12A456')
      expect(result.valid).toBe(false)
    })

    it('should reject empty OTP', () => {
      const result = validateOTP('')
      expect(result.valid).toBe(false)
    })

    it('should reject null or undefined input', () => {
      const result = validateOTP(null as any)
      expect(result.valid).toBe(false)
    })

    it('should reject OTP with spaces', () => {
      const result = validateOTP('12 34 56')
      expect(result.valid).toBe(false)
    })

    it('should accept valid OTPs', () => {
      const validOTPs = ['000000', '123456', '999999', '567890']
      validOTPs.forEach(otp => {
        const result = validateOTP(otp)
        expect(result.valid).toBe(true)
      })
    })
  })
})
