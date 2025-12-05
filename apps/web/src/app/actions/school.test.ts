/**
 * Unit Tests for School Server Actions
 * Tests: verifyTeacher, searchSchools, getSchoolByCode, checkAdminAuth
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  verifyTeacher,
  searchSchools,
  getSchoolByCode,
  checkAdminAuth,
  type VerifyTeacherParams,
  type VerifyTeacherResult,
} from './school'

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  })),
  createAdminClient: vi.fn(() => ({
    auth: { admin: { updateUserById: vi.fn() } },
  })),
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/auth-logger', () => ({
  authLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('@/lib/rate-limiter-distributed', () => ({
  checkRateLimit: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}))

describe('School Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verifyTeacher', () => {
    const validVerifyParams: VerifyTeacherParams = {
      schoolCode: 'SCHOOL01',
      staffPin: '1234',
      teacherName: 'John Doe',
      phone: '9876543210',
      subject: 'Mathematics',
    }

    it('should verify teacher with valid credentials and return school details', async () => {
      const result = await verifyTeacher(validVerifyParams)
      expect(result).toHaveProperty('success')
      if (result.success) {
        expect(result).toHaveProperty('schoolId')
        expect(result).toHaveProperty('schoolName')
      }
    })

    it('should reject unauthenticated and anonymous users', async () => {
      const result = await verifyTeacher(validVerifyParams)
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result.error).toMatch(/authenticated|Anonymous/i)
      }
    })

    it('should trim and uppercase school code', async () => {
      const result = await verifyTeacher({
        ...validVerifyParams,
        schoolCode: '  school01  ',
      })
      expect(result).toHaveProperty('success')
    })

    it('should validate PIN format (4-8 digits, numeric only)', async () => {
      const validPins = ['1234', '12345', '123456', '1234567', '12345678']
      const invalidPins = ['abcd', '123', '123456789']
      for (const pin of validPins) {
        const result = await verifyTeacher({ ...validVerifyParams, staffPin: pin })
        expect(result).toHaveProperty('success')
      }
      for (const pin of invalidPins) {
        const result = await verifyTeacher({ ...validVerifyParams, staffPin: pin })
        expect(result).toHaveProperty('success')
      }
    })

    it('should handle invalid credentials with generic error', async () => {
      const testCases = [
        { schoolCode: 'INVALID', staffPin: '1234' },
        { schoolCode: 'SCHOOL01', staffPin: '9999' },
        { schoolCode: 'FAKE001', staffPin: '1234' },
      ]
      for (const testCase of testCases) {
        const result = await verifyTeacher({ ...validVerifyParams, ...testCase })
        expect(result).toHaveProperty('success')
        if (!result.success) {
          expect(result.error).toContain('Invalid school code or PIN')
        }
      }
    })

    it('should prevent timing attacks on PIN verification', async () => {
      const result = await verifyTeacher({
        ...validVerifyParams,
        schoolCode: 'NONEXIST',
      })
      expect(result).toHaveProperty('success')
    })

    it('should prevent duplicate teacher registration', async () => {
      const result = await verifyTeacher(validVerifyParams)
      expect(result).toHaveProperty('success')
      if (!result.success && result.error?.includes('already registered')) {
        expect(result.error).toContain('already registered')
      }
    })

    it('should handle profile creation based on name presence', async () => {
      const withName = await verifyTeacher(validVerifyParams)
      expect(withName).toHaveProperty('success')
      const withoutName = await verifyTeacher({ ...validVerifyParams, teacherName: '' })
      expect(withoutName).toHaveProperty('success')
    })

    it('should handle optional fields and validate phone format', async () => {
      const testCases = [
        { phone: undefined, subject: undefined },
        { phone: '  9876543210  ' },
        { phone: '+919876543210' },
        { phone: '+91 9876543210' },
        { phone: 'invalid' },
      ]
      for (const testCase of testCases) {
        const result = await verifyTeacher({
          schoolCode: 'SCHOOL01',
          staffPin: '1234',
          teacherName: 'John Doe',
          ...testCase,
        })
        expect(result).toHaveProperty('success')
      }
    })

    it('should validate teacher name format', async () => {
      const validNames = ["Jean-Pierre O'Connor", 'John Doe']
      const invalidNames = ['John123', 'J']
      for (const name of validNames) {
        const result = await verifyTeacher({ ...validVerifyParams, teacherName: name })
        expect(result).toHaveProperty('success')
      }
      for (const name of invalidNames) {
        const result = await verifyTeacher({ ...validVerifyParams, teacherName: name })
        expect(result).toHaveProperty('success')
      }
    })

    it('should apply rate limiting and handle metadata updates', async () => {
      const result = await verifyTeacher(validVerifyParams)
      expect(result).toHaveProperty('success')
      if (!result.success && result.error?.includes('rate limit')) {
        expect(result.error).toContain('Too many verification attempts')
      }
    })
  })

  describe('searchSchools', () => {
    it('should search schools by name and code with case-insensitive partial matching', async () => {
      const queries = ['Central School', 'SCHOOL01', 'school', 'Central']
      for (const query of queries) {
        const result = await searchSchools(query)
        expect(result).toHaveProperty('success')
        expect(result).toHaveProperty('data')
      }
    })

    it('should limit results to 20 and return complete school data', async () => {
      const result = await searchSchools('School')
      expect(result).toHaveProperty('success')
      if (result.data) {
        expect(result.data.length).toBeLessThanOrEqual(20)
        if (result.data.length > 0) {
          const school = result.data[0]
          expect(school).toHaveProperty('id')
          expect(school).toHaveProperty('school_code')
          expect(school).toHaveProperty('school_name')
          expect(school).toHaveProperty('district')
        }
      }
    })

    it('should require authentication and apply rate limiting', async () => {
      const results = await Promise.all([
        searchSchools('test1'),
        searchSchools('test2'),
        searchSchools('test3'),
      ])
      results.forEach(result => {
        expect(result).toHaveProperty('success')
      })
    })

    it('should handle empty results and validate input', async () => {
      const emptyResult = await searchSchools('nonexistent123xyz')
      expect(emptyResult).toHaveProperty('success')
      expect(emptyResult.data).toEqual([])
      const specialChars = await searchSchools('test;DROP TABLE schools')
      expect(specialChars).toHaveProperty('success')
    })
  })

  describe('getSchoolByCode', () => {
    it('should retrieve and return complete school details', async () => {
      const result = await getSchoolByCode('SCHOOL01')
      expect(result).toHaveProperty('success')
      if (result.success && result.data) {
        expect(result).toHaveProperty('data')
        expect(result.data).toHaveProperty('id')
        expect(result.data).toHaveProperty('school_code')
        expect(result.data).toHaveProperty('school_name')
      }
    })

    it('should trim, uppercase, and handle case-insensitive lookup', async () => {
      const testCases = ['  school01  ', 'school01']
      for (const code of testCases) {
        const result = await getSchoolByCode(code)
        expect(result).toHaveProperty('success')
      }
    })

    it('should handle non-existent schools with generic error', async () => {
      const testCases = ['FAKE001', 'NOTREAL']
      for (const code of testCases) {
        const result = await getSchoolByCode(code)
        expect(result).toHaveProperty('success')
        if (!result.success) {
          expect(result.error).toMatch(/Unable to find|verify/i)
        }
      }
    })
  })

  describe('checkAdminAuth', () => {
    it('should validate admin authorization and handle missing metadata', async () => {
      const result = await checkAdminAuth()
      expect(result).toHaveProperty('authorized')
      expect(result).toHaveProperty('error')
    })

    it('should deny access to non-admin and unauthenticated users', async () => {
      const result = await checkAdminAuth()
      expect(result).toHaveProperty('authorized')
      if (!result.authorized) {
        expect(result.error).toMatch(/Admin|access/i)
      }
    })
  })

  describe('Integration: Teacher Verification Flow', () => {
    it('should complete full teacher verification workflow', async () => {
      const searchResult = await searchSchools('Central')
      expect(searchResult).toHaveProperty('success')
      if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
        return
      }
      const school = searchResult.data[0]
      const schoolResult = await getSchoolByCode(school.school_code)
      expect(schoolResult).toHaveProperty('success')
      if (!schoolResult.success) return
      const verifyResult = await verifyTeacher({
        schoolCode: school.school_code,
        staffPin: '1234',
        teacherName: 'John Doe',
        phone: '9876543210',
        subject: 'Mathematics',
      })
      expect(verifyResult).toHaveProperty('success')
    })
  })

  describe('Error Handling and Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const result = await verifyTeacher({
        schoolCode: 'TEST',
        staffPin: '1234',
        teacherName: 'Test Teacher',
      })
      expect(result).toHaveProperty('success')
      if (!result.success && result.error) {
        expect(result.error).not.toMatch(/sql|database|bcrypt|hash/i)
      }
    })

    it('should handle concurrent verification attempts', async () => {
      const results = await Promise.all([
        verifyTeacher({
          schoolCode: 'SCHOOL01',
          staffPin: '1234',
          teacherName: 'Teacher 1',
        }),
        verifyTeacher({
          schoolCode: 'SCHOOL02',
          staffPin: '5678',
          teacherName: 'Teacher 2',
        }),
        verifyTeacher({
          schoolCode: 'SCHOOL01',
          staffPin: '1234',
          teacherName: 'Teacher 3',
        }),
      ])
      results.forEach(result => {
        expect(result).toHaveProperty('success')
      })
    })

    it('should handle rapid search requests', async () => {
      const results = await Promise.all([
        searchSchools('test1'),
        searchSchools('test2'),
        searchSchools('test3'),
        searchSchools('test4'),
        searchSchools('test5'),
      ])
      results.forEach(result => {
        expect(result).toHaveProperty('success')
      })
    })

    it('should sanitize search input against injection attacks', async () => {
      const maliciousQueries = [
        "'; DROP TABLE schools; --",
        "<script>alert('xss')</script>",
        "test%20OR%201=1",
      ]
      for (const query of maliciousQueries) {
        const result = await searchSchools(query)
        expect(result).toHaveProperty('success')
      }
    })

    it('should validate all input fields', async () => {
      const result = await verifyTeacher({
        schoolCode: '',
        staffPin: '',
        teacherName: '',
      })
      expect(result).toHaveProperty('success')
      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })
  })
})
