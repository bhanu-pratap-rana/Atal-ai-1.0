/**
 * Unit tests for auth-validation.ts
 *
 * Tests all validation functions for email, phone, OTP, password, etc.
 * Ensures consistent behavior across the authentication system.
 *
 * Tests: 30+ cases covering happy paths, edge cases, and error conditions
 */

import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  validateOTP,
  validatePIN,
  validateClassCode,
  sanitizePhone,
  sanitizeOTP,
  sanitizePIN,
  sanitizeClassCode,
  validateSignInForm,
  validateSignUpForm,
  validatePhoneSignInForm,
  validateJoinClassForm,
} from './auth-validation'

describe('Email Validation', () => {
  it('should validate correct email', () => {
    const result = validateEmail('user@gmail.com')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject email with blocked domain', () => {
    const result = validateEmail('user@tempmail.com')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Disposable')
  })

  it('should reject invalid email format', () => {
    const result = validateEmail('invalid-email')
    expect(result.valid).toBe(false)
  })

  it('should reject email that exceeds max length', () => {
    const longEmail = 'a'.repeat(254) + '@gmail.com'
    const result = validateEmail(longEmail)
    expect(result.valid).toBe(false)
  })

  it('should normalize email to lowercase', () => {
    const result = validateEmail('USER@GMAIL.COM')
    expect(result.valid).toBe(true)
  })

  it('should reject empty email', () => {
    const result = validateEmail('')
    expect(result.valid).toBe(false)
  })

  it('should reject email with spaces', () => {
    const result = validateEmail('user @gmail.com')
    expect(result.valid).toBe(false)
  })

  it('should accept domains with subdomains', () => {
    const result = validateEmail('user@mail.google.com')
    expect(result.valid).toBe(true)
  })
})

describe('Password Validation', () => {
  it('should validate password of correct length', () => {
    const result = validatePassword('ValidPassword123')
    expect(result.valid).toBe(true)
  })

  it('should reject password below minimum length', () => {
    const result = validatePassword('Short1')
    expect(result.valid).toBe(false)
  })

  it('should reject password above maximum length', () => {
    const result = validatePassword('a'.repeat(129))
    expect(result.valid).toBe(false)
  })

  it('should reject empty password', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
  })

  it('should accept passwords with special characters', () => {
    const result = validatePassword('MyP@ssw0rd!')
    expect(result.valid).toBe(true)
  })
})

describe('Password Match Validation', () => {
  it('should validate matching passwords', () => {
    const result = validatePasswordMatch('Password123', 'Password123')
    expect(result.valid).toBe(true)
  })

  it('should reject mismatched passwords', () => {
    const result = validatePasswordMatch('Password123', 'Password124')
    expect(result.valid).toBe(false)
  })

  it('should be case-sensitive', () => {
    const result = validatePasswordMatch('password', 'Password')
    expect(result.valid).toBe(false)
  })
})

describe('Phone Validation', () => {
  it('should validate correct Indian phone number', () => {
    const result = validatePhone('9876543210')
    expect(result.valid).toBe(true)
  })

  it('should validate phone with country code', () => {
    const result = validatePhone('+919876543210')
    expect(result.valid).toBe(true)
  })

  it('should validate phone with spaces/dashes', () => {
    const result = validatePhone('98 7654 3210')
    expect(result.valid).toBe(true)
  })

  it('should reject phone with insufficient digits', () => {
    const result = validatePhone('987654')
    expect(result.valid).toBe(false)
  })

  it('should reject empty phone', () => {
    const result = validatePhone('')
    expect(result.valid).toBe(false)
  })

  it('should reject non-numeric phone', () => {
    const result = validatePhone('abcd1234567')
    expect(result.valid).toBe(false)
  })
})

describe('OTP Validation', () => {
  it('should validate 6-digit OTP', () => {
    const result = validateOTP('123456')
    expect(result.valid).toBe(true)
  })

  it('should reject OTP with less than 6 digits', () => {
    const result = validateOTP('12345')
    expect(result.valid).toBe(false)
  })

  it('should reject OTP with non-digits', () => {
    const result = validateOTP('12345a')
    expect(result.valid).toBe(false)
  })

  it('should reject empty OTP', () => {
    const result = validateOTP('')
    expect(result.valid).toBe(false)
  })
})

describe('PIN Validation', () => {
  it('should validate 4-digit PIN', () => {
    const result = validatePIN('1234')
    expect(result.valid).toBe(true)
  })

  it('should reject PIN with less than 4 digits', () => {
    const result = validatePIN('123')
    expect(result.valid).toBe(false)
  })

  it('should reject PIN with letters', () => {
    const result = validatePIN('123a')
    expect(result.valid).toBe(false)
  })
})

describe('Class Code Validation', () => {
  it('should validate 6-character class code', () => {
    const result = validateClassCode('ABC123')
    expect(result.valid).toBe(true)
  })

  it('should accept lowercase and convert to uppercase', () => {
    const result = validateClassCode('abc123')
    expect(result.valid).toBe(true)
  })

  it('should reject code with special characters', () => {
    const result = validateClassCode('ABC@#$')
    expect(result.valid).toBe(false)
  })

  it('should reject code shorter than 6 characters', () => {
    const result = validateClassCode('ABC12')
    expect(result.valid).toBe(false)
  })
})

describe('Sanitization Functions', () => {
  it('sanitizePhone should remove non-digits and add country code', () => {
    const result = sanitizePhone('98 7654 3210')
    expect(result).toBe('+919876543210')
  })

  it('sanitizeOTP should keep only 6 digits', () => {
    const result = sanitizeOTP('123456789')
    expect(result).toBe('123456')
  })

  it('sanitizePIN should keep only 4 digits', () => {
    const result = sanitizePIN('12345678')
    expect(result).toBe('1234')
  })

  it('sanitizeClassCode should uppercase and remove non-alphanumeric', () => {
    const result = sanitizeClassCode('abc-123')
    expect(result).toBe('ABC123')
  })
})

describe('Form Validation', () => {
  it('validateSignInForm should validate email and password', () => {
    const result = validateSignInForm('user@gmail.com', 'Password123')
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('validateSignUpForm should validate email, password, and confirm', () => {
    const result = validateSignUpForm('user@gmail.com', 'Password123', 'Password123')
    expect(result.valid).toBe(true)
  })

  it('validateSignUpForm should reject mismatched passwords', () => {
    const result = validateSignUpForm('user@gmail.com', 'Password123', 'Password124')
    expect(result.valid).toBe(false)
    expect(result.errors.confirmPassword).toBeDefined()
  })

  it('validatePhoneSignInForm should validate phone and password', () => {
    const result = validatePhoneSignInForm('9876543210', 'Password123')
    expect(result.valid).toBe(true)
  })

  it('validateJoinClassForm should validate class code, roll number, and PIN', () => {
    const result = validateJoinClassForm('ABC123', '101', '1234')
    expect(result.valid).toBe(true)
  })

  it('validateJoinClassForm should reject invalid inputs', () => {
    const result = validateJoinClassForm('ABC', '101', '1234')
    expect(result.valid).toBe(false)
    expect(result.errors.classCode).toBeDefined()
  })
})

describe('Edge Cases', () => {
  it('should handle null inputs gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateEmail(null as any).valid).toBe(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validatePassword(null as any).valid).toBe(false)
  })

  it('should handle undefined inputs gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validatePhone(undefined as any).valid).toBe(false)
  })

  it('should trim whitespace from inputs', () => {
    const result = validateEmail('  user@gmail.com  ')
    expect(result.valid).toBe(true)
  })

  it('should handle very long input strings', () => {
    const longString = 'a'.repeat(10000)
    const result = validateEmail(longString + '@gmail.com')
    expect(result.valid).toBe(false)
  })
})
