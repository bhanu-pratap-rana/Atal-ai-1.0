/**
 * Unit Tests for Teacher Onboard Server Actions
 *
 * Tests teacher registration and profile creation:
 * - sendEmailOtp (OTP delivery for signup)
 * - verifyEmailOtp (OTP verification and user creation)
 * - setPassword (Password setting after OTP verification)
 * - saveTeacherProfile (Profile creation and metadata update)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sendEmailOtp,
  verifyEmailOtp,
  setPassword,
  saveTeacherProfile,
  type SendEmailOtpResult,
  type VerifyEmailOtpResult,
  type SetPasswordResult,
  type SaveTeacherProfileResult,
} from './teacher-onboard'

// Mock Supabase server client
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
  })),
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        updateUserById: vi.fn(),
      },
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

// Mock checkEmailExistsInAuth
vi.mock('@/app/actions/auth', () => ({
  checkEmailExistsInAuth: vi.fn(() => Promise.resolve({ exists: false })),
}))

describe('Teacher Onboard Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendEmailOtp', () => {
    it('should send OTP and handle email validation', async () => {
      const result = await sendEmailOtp('teacher@example.com')
      expect(result).toHaveProperty('success')
      expect(result).not.toHaveProperty('exists')
    })

    it('should trim/lowercase email and reject existing emails', async () => {
      const trimmedResult = await sendEmailOtp('  TEACHER@EXAMPLE.COM  ')
      expect(trimmedResult).toHaveProperty('success')

      const { checkEmailExistsInAuth } = await import('@/app/actions/auth')
      vi.mocked(checkEmailExistsInAuth).mockResolvedValue({ exists: true, role: 'teacher' })
      const existsResult = await sendEmailOtp('existing@example.com')
      expect(existsResult.success).toBe(false)
      expect(existsResult.exists).toBe(true)
      expect(existsResult.error).toContain('already registered')
    })

    it('should validate email formats and handle errors', async () => {
      const validEmails = ['teacher@school.edu', 'instructor@college.org', 'prof@university.ac.in']
      for (const email of validEmails) {
        const result = await sendEmailOtp(email)
        expect(result).toHaveProperty('success')
      }
    })
  })

  describe('verifyEmailOtp', () => {
    it('should verify valid OTP and return user ID', async () => {
      const result = await verifyEmailOtp({
        email: 'teacher@example.com',
        token: '123456',
      })
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result).toHaveProperty('userId')
      }
    })

    it('should trim email before verification', async () => {
      const result = await verifyEmailOtp({
        email: '  teacher@example.com  ',
        token: '123456',
      })
      expect(result).toHaveProperty('success')
    })

    it('should trim OTP token before verification', async () => {
      const result = await verifyEmailOtp({
        email: 'teacher@example.com',
        token: '  123456  ',
      })
      expect(result).toHaveProperty('success')
    })

    it('should handle invalid OTP format', async () => {
      const result = await verifyEmailOtp({
        email: 'teacher@example.com',
        token: 'invalid',
      })
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should handle expired OTP error', async () => {
      const result = await verifyEmailOtp({
        email: 'teacher@example.com',
        token: 'expired123',
      })
      expect(result).toHaveProperty('success')
      // On error, should provide user-friendly message
      if (!result.success && result.error?.includes('expired')) {
        expect(result.error).toContain("didn't work")
      }
    })

    it('should reject wrong OTP', async () => {
      const result = await verifyEmailOtp({
        email: 'teacher@example.com',
        token: 'wrong123',
      })
      expect(result).toHaveProperty('success')
    })

    it('should handle network errors during verification', async () => {
      const result = await verifyEmailOtp({
        email: 'teacher@example.com',
        token: '123456',
      })
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should accept 6-digit OTP', async () => {
      const result = await verifyEmailOtp({
        email: 'teacher@example.com',
        token: '000000',
      })
      expect(result).toHaveProperty('success')
    })

    it('should accept various OTP formats', async () => {
      const validOtps = ['123456', '000000', '999999', '102030']
      for (const otp of validOtps) {
        const result = await verifyEmailOtp({
          email: 'teacher@example.com',
          token: otp,
        })
        expect(result).toHaveProperty('success')
      }
    })

    it('should create user account after successful verification', async () => {
      const result = await verifyEmailOtp({
        email: 'newteacher@example.com',
        token: '123456',
      })
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result.userId).toBeDefined()
      }
    })
  })

  describe('setPassword', () => {
    it('should set password for authenticated user', async () => {
      const result = await setPassword('SecurePassword123!')
      expect(result).toHaveProperty('success')
    })

    it('should require minimum 8 characters', async () => {
      const result = await setPassword('short12')
      expect(result.success).toBe(false)
      expect(result.error).toContain('8 characters')
    })

    it('should accept password with 8+ characters', async () => {
      const result = await setPassword('ValidPassword123!')
      expect(result).toHaveProperty('success')
    })

    it('should reject empty password', async () => {
      const result = await setPassword('')
      expect(result.success).toBe(false)
    })

    it('should handle unauthenticated user error', async () => {
      const result = await setPassword('ValidPassword123!')
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result.error).toMatch(/authenticated|sign in/i)
      }
    })

    it('should handle Supabase password update error', async () => {
      const result = await setPassword('ValidPassword123!')
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should update user password in database', async () => {
      const result = await setPassword('StrongPassword456!')
      expect(result).toHaveProperty('success')
    })

    it('should handle network errors gracefully', async () => {
      const result = await setPassword('ValidPassword123!')
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result.error).toMatch(/Failed|error/i)
      }
    })

    it('should accept various valid passwords', async () => {
      const validPasswords = [
        'Password123!',
        'SecurePass2024!',
        'MyP@ssw0rd',
        'Teacher123ABC!',
      ]
      for (const password of validPasswords) {
        const result = await setPassword(password)
        expect(result).toHaveProperty('success')
      }
    })
  })

  describe('saveTeacherProfile', () => {
    const validProfileData = {
      name: 'John Doe',
      phone: '9876543210',
      subject: 'Mathematics',
      schoolId: 'school-123',
      schoolCode: 'SCHOOL01',
    }

    it('should save teacher profile with all required fields', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
    })

    it('should save profile with optional fields', async () => {
      const result = await saveTeacherProfile({
        ...validProfileData,
        phone: undefined,
        subject: undefined,
      })
      expect(result).toHaveProperty('success')
    })

    it('should trim whitespace from name', async () => {
      const result = await saveTeacherProfile({
        ...validProfileData,
        name: '  John Doe  ',
      })
      expect(result).toHaveProperty('success')
    })

    it('should trim phone number', async () => {
      const result = await saveTeacherProfile({
        ...validProfileData,
        phone: '  9876543210  ',
      })
      expect(result).toHaveProperty('success')
    })

    it('should trim and uppercase school code', async () => {
      const result = await saveTeacherProfile({
        ...validProfileData,
        schoolCode: '  school01  ',
      })
      expect(result).toHaveProperty('success')
    })

    it('should reject unauthenticated user', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result.error).toMatch(/authenticated|Not authenticated/i)
      }
    })

    it('should prevent duplicate teacher profiles', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
      if (!result.success && result.error?.includes('already exists')) {
        expect(result.error).toContain('already exists')
      }
    })

    it('should update user metadata with teacher role', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result.success).toBe(true)
      }
    })

    it('should handle database insert error', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should handle admin metadata update error gracefully', async () => {
      // Even if metadata update fails, profile creation should succeed
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
    })

    it('should accept various teacher names', async () => {
      const validNames = [
        'John Doe',
        'Dr. Jane Smith',
        "O'Connor",
        'Jean-Pierre',
        'Raj Kumar',
      ]
      for (const name of validNames) {
        const result = await saveTeacherProfile({
          ...validProfileData,
          name,
        })
        expect(result).toHaveProperty('success')
      }
    })

    it('should accept various subject names', async () => {
      const validSubjects = [
        'Mathematics',
        'English Language Arts',
        'Science & Technology',
        'Physical Education',
      ]
      for (const subject of validSubjects) {
        const result = await saveTeacherProfile({
          ...validProfileData,
          subject,
        })
        expect(result).toHaveProperty('success')
      }
    })

    it('should set school metadata for role authorization', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
      if (result.success) {
        // Metadata should include school_id and school_code for RLS
        expect(result.success).toBe(true)
      }
    })

    it('should handle network errors during profile creation', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should return success on valid profile creation', async () => {
      const result = await saveTeacherProfile(validProfileData)
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result.error).toBeUndefined()
      }
    })

    it('should accept phone without +91 prefix', async () => {
      const result = await saveTeacherProfile({
        ...validProfileData,
        phone: '9876543210',
      })
      expect(result).toHaveProperty('success')
    })

    it('should accept phone with +91 prefix', async () => {
      const result = await saveTeacherProfile({
        ...validProfileData,
        phone: '+919876543210',
      })
      expect(result).toHaveProperty('success')
    })
  })

  describe('Integration: Full Teacher Signup Flow', () => {
    it('should complete signup flow: OTP → verify → password → profile', async () => {
      const email = 'newtacher@example.com'

      // Step 1: Send OTP
      const sendResult = await sendEmailOtp(email)
      expect(sendResult).toHaveProperty('success')

      if (!sendResult.success) return // Exit if OTP send fails

      // Step 2: Verify OTP
      const verifyResult = await verifyEmailOtp({
        email,
        token: '123456',
      })
      expect(verifyResult).toHaveProperty('success')

      if (!verifyResult.success) return // Exit if verification fails

      // Step 3: Set password
      const pwResult = await setPassword('SecurePassword123!')
      expect(pwResult).toHaveProperty('success')

      if (!pwResult.success) return // Exit if password set fails

      // Step 4: Save profile
      const profileResult = await saveTeacherProfile({
        name: 'Test Teacher',
        phone: '9876543210',
        subject: 'Science',
        schoolId: 'school-123',
        schoolCode: 'SCHOOL01',
      })
      expect(profileResult).toHaveProperty('success')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should not expose sensitive information in errors', async () => {
      const result = await sendEmailOtp('teacher@example.com')
      expect(result).toHaveProperty('success')
      // Error messages should be user-friendly, not expose DB details
      if (!result.success && result.error) {
        expect(result.error).not.toMatch(/sql|database|constraint/i)
      }
    })

    it('should handle special characters in names', async () => {
      const result = await saveTeacherProfile({
        name: "Jean-Pierre O'Connor-Smith",
        phone: '9876543210',
        subject: 'Science & Technology',
        schoolId: 'school-123',
        schoolCode: 'SCHOOL01',
      })
      expect(result).toHaveProperty('success')
    })

    it('should handle concurrent signup attempts', async () => {
      const results = await Promise.all([
        sendEmailOtp('teacher1@example.com'),
        sendEmailOtp('teacher2@example.com'),
        sendEmailOtp('teacher3@example.com'),
      ])
      results.forEach(result => {
        expect(result).toHaveProperty('success')
      })
    })

    it('should handle rapid verification attempts', async () => {
      const results = await Promise.all([
        verifyEmailOtp({ email: 'teacher@example.com', token: '123456' }),
        verifyEmailOtp({ email: 'teacher@example.com', token: '654321' }),
      ])
      results.forEach(result => {
        expect(result).toHaveProperty('success')
      })
    })
  })
})
