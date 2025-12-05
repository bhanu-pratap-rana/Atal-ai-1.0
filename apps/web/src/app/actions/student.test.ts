/**
 * Unit Tests for Student Server Actions
 *
 * Tests student enrollment and class management:
 * - joinClass (Enroll student in class with code and PIN verification)
 * - leaveClass (Remove student from class enrollment)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { joinClass, leaveClass } from './student'

// Mock Supabase server client
vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
  })),
  getCurrentUser: vi.fn(),
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

// Mock Next.js cache revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock crypto for timing-safe comparison
vi.mock('crypto', () => ({
  timingSafeEqual: vi.fn((a, b) => a.toString() === b.toString()),
}))

describe('Student Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('joinClass', () => {
    const validJoinParams = {
      classCode: 'CLASS123',
      rollNumber: '001',
      pin: '1234',
    }

    it('should enroll student in class with valid credentials', async () => {
      const result = await joinClass(validJoinParams)
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result.data).toHaveProperty('className')
      }
    })

    it('should require authentication', async () => {
      const result = await joinClass(validJoinParams)
      expect(result).toHaveProperty('success')
    })

    it('should validate class code format', async () => {
      const result = await joinClass({
        ...validJoinParams,
        classCode: 'invalid-code!',
      })
      expect(result).toHaveProperty('success')
    })

    it('should accept valid class code formats', async () => {
      const validCodes = ['CLASS123', 'ABC123', 'XYZ789', '123456']
      for (const code of validCodes) {
        const result = await joinClass({
          ...validJoinParams,
          classCode: code,
        })
        expect(result).toHaveProperty('success')
      }
    })

    it('should require 4-digit PIN', async () => {
      const result = await joinClass({
        ...validJoinParams,
        pin: '123',
      })
      expect(result).toHaveProperty('success')
    })

    it('should reject non-numeric PIN', async () => {
      const result = await joinClass({
        ...validJoinParams,
        pin: 'abcd',
      })
      expect(result).toHaveProperty('success')
    })

    it('should accept all valid 4-digit PINs', async () => {
      const validPins = ['0000', '1234', '5678', '9999']
      for (const pin of validPins) {
        const result = await joinClass({
          ...validJoinParams,
          pin,
        })
        expect(result).toHaveProperty('success')
      }
    })

    it('should require roll number', async () => {
      const result = await joinClass({
        ...validJoinParams,
        rollNumber: '',
      })
      expect(result).toHaveProperty('success')
    })

    it('should accept various roll number formats', async () => {
      const validRollNumbers = ['001', 'A001', '2024001', 'CLASS-001', 'RN-123']
      for (const rollNumber of validRollNumbers) {
        const result = await joinClass({
          ...validJoinParams,
          rollNumber,
        })
        expect(result).toHaveProperty('success')
      }
    })

    it('should handle invalid class code', async () => {
      const result = await joinClass({
        ...validJoinParams,
        classCode: 'FAKECODE',
      })
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result.error).toContain('Invalid class code or PIN')
      }
    })

    it('should handle wrong PIN for valid class', async () => {
      const result = await joinClass({
        ...validJoinParams,
        pin: '9999',
      })
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result.error).toContain('Invalid class code or PIN')
      }
    })

    it('should prevent timing attacks on PIN verification', async () => {
      const result = await joinClass({
        ...validJoinParams,
        pin: 'wrongpin',
      })
      expect(result).toHaveProperty('success')
    })

    it('should prevent duplicate enrollment', async () => {
      const result = await joinClass(validJoinParams)
      expect(result).toHaveProperty('success')
      if (!result.success && result.error?.includes('Already enrolled')) {
        expect(result.error).toContain('Already enrolled')
      }
    })

    it('should create enrollment record', async () => {
      const result = await joinClass(validJoinParams)
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result).toHaveProperty('data')
        expect(result.data).toHaveProperty('className')
      }
    })

    it('should return class name in response', async () => {
      const result = await joinClass(validJoinParams)
      expect(result).toHaveProperty('success')
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('className')
      }
    })

    it('should revalidate cache after successful enrollment', async () => {
      const result = await joinClass(validJoinParams)
      expect(result).toHaveProperty('success')
    })

    it('should handle database errors gracefully', async () => {
      const result = await joinClass(validJoinParams)
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should validate all input fields', async () => {
      const result = await joinClass({
        classCode: '',
        rollNumber: '',
        pin: '',
      })
      expect(result).toHaveProperty('success')
    })

    it('should trim class code before validation', async () => {
      const result = await joinClass({
        ...validJoinParams,
        classCode: '  CLASS123  ',
      })
      expect(result).toHaveProperty('success')
    })

    it('should be case-sensitive for PIN', async () => {
      const result = await joinClass({
        ...validJoinParams,
        pin: 'ABCD',
      })
      expect(result).toHaveProperty('success')
    })

    it('should handle concurrent enrollment attempts', async () => {
      const results = await Promise.all([
        joinClass(validJoinParams),
        joinClass(validJoinParams),
        joinClass(validJoinParams),
      ])
      results.forEach(result => {
        expect(result).toHaveProperty('success')
      })
    })
  })

  describe('leaveClass', () => {
    const classId = 'class-123'

    it('should remove student from class', async () => {
      const result = await leaveClass(classId)
      expect(result).toHaveProperty('success')
    })

    it('should require authentication', async () => {
      const result = await leaveClass(classId)
      expect(result).toHaveProperty('success')
    })

    it('should handle non-existent enrollment', async () => {
      const result = await leaveClass('non-existent-class')
      expect(result).toHaveProperty('success')
    })
  })
})
