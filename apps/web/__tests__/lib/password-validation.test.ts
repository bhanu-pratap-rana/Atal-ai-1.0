/**
 * Password Validation Tests
 * Tests password strength, requirements validation, and matching
 */

import {
  validatePassword,
  validatePasswordMatch,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  validatePasswordSimple,
  DEFAULT_PASSWORD_REQUIREMENTS,
} from '@/lib/password-validation'

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should accept strong passwords meeting all requirements', () => {
      const result = validatePassword('SecurePass123!')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject passwords below minimum length', () => {
      const result = validatePassword('Short1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.stringMatching(/at least 8 characters/i)
      )
    })

    it('should require uppercase letters', () => {
      const result = validatePassword('lowercase123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.stringMatching(/uppercase/i)
      )
    })

    it('should require lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.stringMatching(/lowercase/i)
      )
    })

    it('should require numbers', () => {
      const result = validatePassword('NoNumbers!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.stringMatching(/number/i)
      )
    })

    it('should require special characters', () => {
      const result = validatePassword('NoSpecial123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.stringMatching(/special character/i)
      )
    })

    it('should allow custom requirements', () => {
      const customReqs = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: false,
      }

      const result = validatePassword('pass123', customReqs)
      expect(result.valid).toBe(true)
    })

    it('should collect multiple errors', () => {
      const result = validatePassword('short')
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('validatePasswordMatch', () => {
    it('should accept matching passwords', () => {
      const result = validatePasswordMatch('SecurePass123!', 'SecurePass123!')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject non-matching passwords', () => {
      const result = validatePasswordMatch('SecurePass123!', 'Different123!')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should be case-sensitive', () => {
      const result = validatePasswordMatch('SecurePass123!', 'securePass123!')
      expect(result.valid).toBe(false)
    })

    it('should reject if confirm password is empty', () => {
      const result = validatePasswordMatch('SecurePass123!', '')
      expect(result.valid).toBe(false)
    })
  })

  describe('calculatePasswordStrength', () => {
    it('should score weak passwords low', () => {
      const score = calculatePasswordStrength('weakpass')
      expect(score).toBeLessThan(40)
    })

    it('should score medium passwords in middle range', () => {
      const score = calculatePasswordStrength('MediumPass123')
      expect(score).toBeGreaterThanOrEqual(40)
      expect(score).toBeLessThanOrEqual(80)
    })

    it('should score strong passwords high', () => {
      const score = calculatePasswordStrength('VerySecurePassword123!@#')
      expect(score).toBeGreaterThanOrEqual(80)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should reward longer passwords', () => {
      const short = calculatePasswordStrength('Pass123!')
      const long = calculatePasswordStrength('VeryLongSecurePassword123!')
      expect(long).toBeGreaterThan(short)
    })

    it('should reward diverse character types', () => {
      const lowercase = calculatePasswordStrength('password')
      const diverse = calculatePasswordStrength('PassWord123!')
      expect(diverse).toBeGreaterThan(lowercase)
    })

    it('should cap score at 100', () => {
      const score = calculatePasswordStrength('ThisIsAnExtremelyLongSecurePassword123!@#$%')
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should handle empty password', () => {
      const score = calculatePasswordStrength('')
      expect(score).toBe(0)
    })
  })

  describe('getPasswordStrengthLabel', () => {
    it('should label very weak passwords', () => {
      expect(getPasswordStrengthLabel(10)).toBe('Very Weak')
    })

    it('should label weak passwords', () => {
      expect(getPasswordStrengthLabel(30)).toBe('Weak')
    })

    it('should label fair passwords', () => {
      expect(getPasswordStrengthLabel(50)).toBe('Fair')
    })

    it('should label good passwords', () => {
      expect(getPasswordStrengthLabel(70)).toBe('Good')
    })

    it('should label strong passwords', () => {
      expect(getPasswordStrengthLabel(90)).toBe('Strong')
    })

    it('should handle edge scores', () => {
      expect(getPasswordStrengthLabel(19)).toBe('Very Weak')
      expect(getPasswordStrengthLabel(20)).toBe('Weak')
      expect(getPasswordStrengthLabel(59)).toBe('Fair')
      expect(getPasswordStrengthLabel(79)).toBe('Good')
      expect(getPasswordStrengthLabel(100)).toBe('Strong')
    })
  })

  describe('validatePasswordSimple', () => {
    it('should return single error instead of array', () => {
      const result = validatePasswordSimple('weak')
      expect(result.valid).toBe(false)
      expect(typeof result.error).toBe('string')
    })

    it('should accept valid passwords', () => {
      const result = validatePasswordSimple('SecurePass123!')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('DEFAULT_PASSWORD_REQUIREMENTS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_PASSWORD_REQUIREMENTS.minLength).toBe(8)
      expect(DEFAULT_PASSWORD_REQUIREMENTS.requireUppercase).toBe(true)
      expect(DEFAULT_PASSWORD_REQUIREMENTS.requireLowercase).toBe(true)
      expect(DEFAULT_PASSWORD_REQUIREMENTS.requireNumber).toBe(true)
      expect(DEFAULT_PASSWORD_REQUIREMENTS.requireSpecial).toBe(true)
    })
  })
})
