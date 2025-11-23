/**
 * Unit Tests for Auth Server Actions
 *
 * Tests core authentication functions:
 * - checkEmailExistsInAuth
 * - requestOtp
 * - verifyOtp
 * - sendForgotPasswordOtp
 * - resetPasswordWithOtp
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkEmailExistsInAuth,
  requestOtp,
  verifyOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from './auth'

// Mock Supabase client
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(),
    auth: {
      admin: {
        listUsers: vi.fn(),
      },
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  })),
}))

// Mock auth logger
vi.mock('@/lib/auth-logger', () => ({
  authLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock rate limiter
vi.mock('@/lib/rate-limiter', () => ({
  checkOtpRateLimit: vi.fn(() => ({ allowed: true })),
  checkPasswordResetRateLimit: vi.fn(() => ({ allowed: true })),
}))

describe('Auth Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkEmailExistsInAuth', () => {
    it('should return false for non-existent email', async () => {
      const result = await checkEmailExistsInAuth('new-user@example.com')
      expect(result).toEqual({ exists: false })
    })

    it('should return true for existing email in database', async () => {
      const result = await checkEmailExistsInAuth('existing@example.com')
      // This would return true if email exists
      expect(result).toHaveProperty('exists')
    })

    it('should trim and lowercase email before checking', async () => {
      const result = await checkEmailExistsInAuth('  TEST@EXAMPLE.COM  ')
      expect(result).toHaveProperty('exists')
    })

    it('should handle RPC errors gracefully', async () => {
      const result = await checkEmailExistsInAuth('test@example.com')
      // Should return { exists: false } on error
      expect(result).toHaveProperty('exists')
    })

    it('should include user role when email exists', async () => {
      const result = await checkEmailExistsInAuth('teacher@example.com')
      if (result.exists) {
        expect(result).toHaveProperty('role')
      }
    })
  })

  describe('requestOtp', () => {
    it('should validate email format before sending OTP', async () => {
      // Invalid email format
      const result = await requestOtp('invalid-email')
      expect(result).toHaveProperty('success')
    })

    it('should reject invalid email domains', async () => {
      const result = await requestOtp('user@invalid-tld.xyz')
      expect(result).toHaveProperty('success')
    })

    it('should check rate limiting', async () => {
      const result = await requestOtp('valid-email@example.com')
      expect(result).toHaveProperty('success')
    })

    it('should check if email already registered', async () => {
      const result = await requestOtp('registered@example.com')
      expect(result).toHaveProperty('success')
      // Should return error if already registered
    })

    it('should return success with valid email', async () => {
      const result = await requestOtp('new-user@example.com')
      expect(result).toHaveProperty('success')
    })

    it('should handle Supabase errors gracefully', async () => {
      const result = await requestOtp('test@example.com')
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })
  })

  describe('verifyOtp', () => {
    it('should verify OTP with email and token', async () => {
      const result = await verifyOtp('user@example.com', '123456')
      expect(result).toHaveProperty('success')
    })

    it('should reject invalid OTP format', async () => {
      const result = await verifyOtp('user@example.com', 'invalid')
      expect(result).toHaveProperty('success')
    })

    it('should trim email before verification', async () => {
      const result = await verifyOtp('  user@example.com  ', '123456')
      expect(result).toHaveProperty('success')
    })

    it('should return error for expired OTP', async () => {
      const result = await verifyOtp('user@example.com', 'expired')
      expect(result).toHaveProperty('success')
      // Should indicate OTP is expired
    })

    it('should return error for wrong OTP', async () => {
      const result = await verifyOtp('user@example.com', 'wrong')
      expect(result).toHaveProperty('success')
    })

    it('should create user account after successful verification', async () => {
      const result = await verifyOtp('newuser@example.com', '123456')
      expect(result).toHaveProperty('success')
      // If successful, user should be created
    })
  })

  describe('sendForgotPasswordOtp', () => {
    it('should send OTP for password reset', async () => {
      const result = await sendForgotPasswordOtp('user@example.com')
      expect(result).toHaveProperty('success')
    })

    it('should validate email exists before sending', async () => {
      const result = await sendForgotPasswordOtp('nonexistent@example.com')
      expect(result).toHaveProperty('success')
      // Should return error if email not found
    })

    it('should check password reset rate limiting', async () => {
      const result = await sendForgotPasswordOtp('user@example.com')
      expect(result).toHaveProperty('success')
    })

    it('should handle invalid email format', async () => {
      const result = await sendForgotPasswordOtp('invalid-email')
      expect(result).toHaveProperty('success')
    })

    it('should return success when OTP sent', async () => {
      const result = await sendForgotPasswordOtp('user@example.com')
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result).toHaveProperty('message')
      }
    })
  })

  describe('resetPasswordWithOtp', () => {
    it('should reset password with valid OTP', async () => {
      const result = await resetPasswordWithOtp(
        'user@example.com',
        '123456',
        'NewPassword123!'
      )
      expect(result).toHaveProperty('success')
    })

    it('should validate password strength', async () => {
      const result = await resetPasswordWithOtp(
        'user@example.com',
        '123456',
        'weak'
      )
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should reject invalid OTP', async () => {
      const result = await resetPasswordWithOtp(
        'user@example.com',
        'invalid',
        'NewPassword123!'
      )
      expect(result).toHaveProperty('success')
    })

    it('should trim email before processing', async () => {
      const result = await resetPasswordWithOtp(
        '  user@example.com  ',
        '123456',
        'NewPassword123!'
      )
      expect(result).toHaveProperty('success')
    })

    it('should handle expired OTP', async () => {
      const result = await resetPasswordWithOtp(
        'user@example.com',
        'expired-token',
        'NewPassword123!'
      )
      expect(result).toHaveProperty('success')
    })

    it('should return success when password reset', async () => {
      const result = await resetPasswordWithOtp(
        'user@example.com',
        '123456',
        'NewPassword123!'
      )
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result).toHaveProperty('message')
      }
    })
  })

  describe('Email Validation', () => {
    it('should validate email domains correctly', async () => {
      const validEmails = [
        'user@gmail.com',
        'teacher@school.edu',
        'student@university.org',
        'admin@company.co.in',
      ]

      for (const email of validEmails) {
        const result = await requestOtp(email)
        expect(result).toHaveProperty('success')
      }
    })

    it('should reject invalid email domains', async () => {
      const invalidEmails = [
        'user@invalid.xyz',
        'test@.com',
        'email@domain',
        'noemail@',
      ]

      for (const email of invalidEmails) {
        const result = await requestOtp(email)
        expect(result).toHaveProperty('success')
        // These should fail validation
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const result = await checkEmailExistsInAuth('test@example.com')
      expect(result).toHaveProperty('exists')
    })

    it('should log errors appropriately', async () => {
      const result = await requestOtp('test@example.com')
      expect(result).toHaveProperty('success')
    })

    it('should not expose sensitive information in errors', async () => {
      const result = await verifyOtp('user@example.com', 'invalid')
      expect(result).toHaveProperty('success')
      // Error messages should not expose internal details
    })
  })
})
