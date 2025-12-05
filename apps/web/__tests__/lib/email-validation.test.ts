/**
 * Email Validation Tests
 * Tests email format validation, domain verification, and typo detection
 */

import {
  validateEmail,
  normalizeEmail,
  maskEmail,
  detectDomainTypo,
  isValidEmailDomain,
} from '@/lib/email-validation'

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('should accept valid emails from whitelisted providers', () => {
      const validEmails = [
        'user@gmail.com',
        'teacher@yahoo.com',
        'student@outlook.com',
        'name.surname@protonmail.com',
      ]

      validEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user name@example.com',
        '',
      ]

      invalidEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should detect domain typos and suggest corrections', () => {
      const result = validateEmail('user@gmial.com')
      expect(result.valid).toBe(false)
      expect(result.suggestion).toBeDefined()
      expect(result.suggestion).toContain('gmail.com')
    })

    it('should reject emails exceeding max length', () => {
      const longEmail = 'a'.repeat(300) + '@example.com'
      const result = validateEmail(longEmail)
      expect(result.valid).toBe(false)
    })

    it('should handle null or undefined input', () => {
      const result1 = validateEmail('')
      expect(result1.valid).toBe(false)

      const result2 = validateEmail(null as any)
      expect(result2.valid).toBe(false)
    })

    it('should normalize email to lowercase', () => {
      const result = validateEmail('USER@GMAIL.COM')
      expect(result.valid).toBe(true)
    })
  })

  describe('normalizeEmail', () => {
    it('should trim whitespace and convert to lowercase', () => {
      expect(normalizeEmail('  User@Example.COM  ')).toBe('user@example.com')
      expect(normalizeEmail('TEACHER@SCHOOL.EDU')).toBe('teacher@school.edu')
    })

    it('should handle already normalized emails', () => {
      expect(normalizeEmail('user@gmail.com')).toBe('user@gmail.com')
    })
  })

  describe('maskEmail', () => {
    it('should mask email for logging', () => {
      const masked = maskEmail('user@example.com')
      expect(masked).toMatch(/^\w\*\*\*@example\.com$/)
      expect(masked).not.toContain('user')
    })

    it('should handle invalid email format gracefully', () => {
      const masked = maskEmail('invalid')
      expect(masked).toBe('***@***')
    })

    it('should preserve domain visibility', () => {
      const masked = maskEmail('john.doe@company.co.uk')
      expect(masked).toContain('company.co.uk')
      expect(masked).not.toContain('john')
      expect(masked).not.toContain('doe')
    })
  })

  describe('detectDomainTypo', () => {
    it('should detect common domain typos', () => {
      const result = detectDomainTypo('gmial.com')
      expect(result.hasTypo).toBe(true)
      expect(result.suggestion).toBe('gmail.com')
    })

    it('should suggest similar valid domains', () => {
      const result = detectDomainTypo('yahou.com')
      expect(result.hasTypo).toBe(true)
      expect(result.suggestion).toMatch(/yahoo|ymail/)
    })

    it('should suggest same domain when exactly matching', () => {
      const result = detectDomainTypo('gmail.com')
      expect(result.hasTypo).toBe(true)
      expect(result.suggestion).toBe('gmail.com')
    })

    it('should handle very different domains with no match', () => {
      const result = detectDomainTypo('xyzabc123999.com')
      expect(result.hasTypo).toBe(false)
    })
  })

  describe('isValidEmailDomain', () => {
    it('should validate known email providers', () => {
      const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'protonmail.com', 'zoho.com']
      validDomains.forEach(domain => {
        expect(isValidEmailDomain(domain)).toBe(true)
      })
    })

    it('should validate generic TLDs', () => {
      expect(isValidEmailDomain('company.co.uk')).toBe(true)
      expect(isValidEmailDomain('business.co.in')).toBe(true)
      expect(isValidEmailDomain('example.io')).toBe(true)
    })

    it('should reject invalid domain formats', () => {
      expect(isValidEmailDomain('invalid')).toBe(false)
      expect(isValidEmailDomain('.com')).toBe(false)
      expect(isValidEmailDomain('domain..com')).toBe(false)
    })

    it('should reject unknown TLDs', () => {
      expect(isValidEmailDomain('example.invalid')).toBe(false)
      expect(isValidEmailDomain('user.unknown')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(isValidEmailDomain('GMAIL.COM')).toBe(true)
      expect(isValidEmailDomain('Gmail.Com')).toBe(true)
    })
  })
})
