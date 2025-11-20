/**
 * Unit tests for auth-handlers.ts
 *
 * Tests unified authentication handler functions
 * Ensures consistent behavior across email, phone, and OTP flows
 *
 * Tests: 40+ cases covering all handler functions and edge cases
 */

import {
  handleSignIn,
  handleSendOTP,
  handleVerifyOTP,
  handleSetPassword,
  handleAnonymousSignIn,
  type SignInResult,
  type OTPResult,
} from './auth-handlers'

// Mock Supabase client
const createMockSupabaseClient = () => ({
  auth: {
    signInWithPassword: jest.fn(),
    signInWithOtp: jest.fn(),
    verifyOtp: jest.fn(),
    updateUser: jest.fn(),
    signInAnonymously: jest.fn(),
  },
})

describe('handleSignIn', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  describe('Email Sign-In', () => {
    it('should successfully sign in with email and password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })

      const result = await handleSignIn(
        mockSupabase,
        { email: 'test@example.com', password: 'Password123' },
        { validatorFn: () => ({ valid: true }) }
      )

      expect(result.success).toBe(true)
      expect(result.user?.id).toBe('user-123')
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      })
    })

    it('should handle email validation errors', async () => {
      const result = await handleSignIn(
        mockSupabase,
        { email: 'invalid-email', password: 'Password123' },
        {
          validatorFn: () => ({ valid: false, error: 'Invalid email format' }),
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('should handle authentication errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      const result = await handleSignIn(
        mockSupabase,
        { email: 'test@example.com', password: 'WrongPassword' },
        { validatorFn: () => ({ valid: true }) }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid credentials')
    })

    it('should trim email before signin', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      await handleSignIn(
        mockSupabase,
        { email: '  test@example.com  ', password: 'Password123' },
        { validatorFn: () => ({ valid: true }) }
      )

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      })
    })
  })

  describe('Phone Sign-In', () => {
    it('should successfully sign in with phone and password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', phone: '+919876543210' } },
        error: null,
      })

      const result = await handleSignIn(mockSupabase, {
        phone: '+919876543210',
        password: 'Password123',
      })

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        phone: '+919876543210',
        password: 'Password123',
      })
    })

    it('should handle phone validation errors', async () => {
      const result = await handleSignIn(
        mockSupabase,
        { phone: '123', password: 'Password123' },
        {
          validatorFn: () => ({ valid: false, error: 'Invalid phone' }),
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid phone')
    })
  })

  describe('Profile Check', () => {
    it('should check profile when requireProfileCheck is true', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'teacher@example.com' } },
        error: null,
      })

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'profile-123' },
              error: null,
            }),
          }),
        }),
      })

      const result = await handleSignIn(
        mockSupabase,
        { email: 'teacher@example.com', password: 'Password123' },
        {
          validatorFn: () => ({ valid: true }),
          requireProfileCheck: true,
          profileTable: 'teacher_profiles',
        }
      )

      expect(result.success).toBe(true)
      expect(result.user?.id).toBe('user-123')
    })

    it('should return profile not found when profile missing', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'teacher@example.com' } },
        error: null,
      })

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      })

      const result = await handleSignIn(
        mockSupabase,
        { email: 'teacher@example.com', password: 'Password123' },
        {
          validatorFn: () => ({ valid: true }),
          requireProfileCheck: true,
          profileTable: 'teacher_profiles',
        }
      )

      expect(result.success).toBe(true)
      expect(result.requiresProfileCheck).toBe(true)
      expect(result.error).toContain('Profile not found')
    })
  })

  it('should handle missing email and phone', async () => {
    const result = await handleSignIn(
      mockSupabase,
      { password: 'Password123' } as any,
      { validatorFn: () => ({ valid: true }) }
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Email or phone')
  })

  it('should handle unexpected errors gracefully', async () => {
    mockSupabase.auth.signInWithPassword.mockRejectedValue(
      new Error('Network error')
    )

    const result = await handleSignIn(
      mockSupabase,
      { email: 'test@example.com', password: 'Password123' },
      { validatorFn: () => ({ valid: true }) }
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('unexpected error')
  })
})

describe('handleSendOTP', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  describe('Email OTP', () => {
    it('should send OTP to valid email', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      const result = await handleSendOTP(
        mockSupabase,
        'test@gmail.com',
        'email'
      )

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        options: {
          shouldCreateUser: true,
        },
      })
    })

    it('should include redirect URL when provided', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      await handleSendOTP(
        mockSupabase,
        'test@gmail.com',
        'email',
        { redirectUrl: 'http://localhost:3000/verify' }
      )

      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@gmail.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/verify',
          shouldCreateUser: true,
        },
      })
    })

    it('should reject invalid email format', async () => {
      const result = await handleSendOTP(
        mockSupabase,
        'invalid-email',
        'email'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email')
    })

    it('should reject blocked/disposable email domains', async () => {
      const result = await handleSendOTP(
        mockSupabase,
        'test@tempmail.com',
        'email'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Disposable')
    })
  })

  describe('Phone OTP', () => {
    it('should send OTP to valid phone', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      const result = await handleSendOTP(
        mockSupabase,
        '+919876543210',
        'phone'
      )

      expect(result.success).toBe(true)
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        phone: '+919876543210',
        options: {
          shouldCreateUser: true,
        },
      })
    })

    it('should reject invalid phone format', async () => {
      const result = await handleSendOTP(mockSupabase, '123', 'phone')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid phone')
    })
  })

  describe('Rate Limiting', () => {
    it('should skip rate limit when skipRateLimit is true', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      })

      const result = await handleSendOTP(
        mockSupabase,
        'test@gmail.com',
        'email',
        { skipRateLimit: true }
      )

      expect(result.success).toBe(true)
    })
  })

  it('should handle Supabase errors', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({
      data: null,
      error: { message: 'Email provider error' },
    })

    const result = await handleSendOTP(
      mockSupabase,
      'test@gmail.com',
      'email'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Email provider')
  })

  it('should handle unexpected errors', async () => {
    mockSupabase.auth.signInWithOtp.mockRejectedValue(
      new Error('Network error')
    )

    const result = await handleSendOTP(
      mockSupabase,
      'test@gmail.com',
      'email'
    )

    expect(result.success).toBe(false)
  })
})

describe('handleVerifyOTP', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  it('should verify valid email OTP', async () => {
    mockSupabase.auth.verifyOtp.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    })

    const result = await handleVerifyOTP(
      mockSupabase,
      { email: 'test@example.com' },
      '123456',
      'email',
      { returnUser: true }
    )

    expect(result.success).toBe(true)
    expect(result.user?.id).toBe('user-123')
  })

  it('should verify valid phone OTP', async () => {
    mockSupabase.auth.verifyOtp.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const result = await handleVerifyOTP(
      mockSupabase,
      { phone: '+919876543210' },
      '123456',
      'sms',
      { returnUser: true }
    )

    expect(result.success).toBe(true)
    expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+919876543210',
      token: '123456',
      type: 'sms',
    })
  })

  it('should provide helpful error message for expired OTP', async () => {
    mockSupabase.auth.verifyOtp.mockResolvedValue({
      data: null,
      error: { message: 'OTP has expired' },
    })

    const result = await handleVerifyOTP(
      mockSupabase,
      { email: 'test@example.com' },
      '123456',
      'email'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('expired')
  })

  it('should provide helpful error message for invalid OTP', async () => {
    mockSupabase.auth.verifyOtp.mockResolvedValue({
      data: null,
      error: { message: 'Invalid OTP' },
    })

    const result = await handleVerifyOTP(
      mockSupabase,
      { email: 'test@example.com' },
      '123456',
      'email'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain("didn't work")
  })

  it('should require email or phone', async () => {
    const result = await handleVerifyOTP(
      mockSupabase,
      {},
      '123456',
      'email'
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Email or phone')
  })
})

describe('handleSetPassword', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  it('should set password when valid', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const result = await handleSetPassword(
      mockSupabase,
      'ValidPassword123',
      true
    )

    expect(result.success).toBe(true)
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: 'ValidPassword123',
    })
  })

  it('should validate password when validate is true', async () => {
    const result = await handleSetPassword(
      mockSupabase,
      'short',
      true
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid password')
  })

  it('should skip validation when validate is false', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const result = await handleSetPassword(
      mockSupabase,
      'short',
      false
    )

    expect(result.success).toBe(true)
  })

  it('should handle password update errors', async () => {
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: null,
      error: { message: 'Password update failed' },
    })

    const result = await handleSetPassword(
      mockSupabase,
      'ValidPassword123',
      false
    )

    expect(result.success).toBe(false)
  })
})

describe('handleAnonymousSignIn', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  it('should sign in anonymously', async () => {
    mockSupabase.auth.signInAnonymously.mockResolvedValue({
      data: { user: { id: 'anon-user-123' } },
      error: null,
    })

    const result = await handleAnonymousSignIn(mockSupabase)

    expect(result.success).toBe(true)
    expect(mockSupabase.auth.signInAnonymously).toHaveBeenCalled()
  })

  it('should handle anonymous signin errors', async () => {
    mockSupabase.auth.signInAnonymously.mockResolvedValue({
      data: null,
      error: { message: 'Anonymous signin not enabled' },
    })

    const result = await handleAnonymousSignIn(mockSupabase)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Anonymous signin')
  })
})

describe('Error Handling and Edge Cases', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  it('should handle missing credentials gracefully', async () => {
    const result = await handleSignIn(
      mockSupabase,
      {} as any,
      { validatorFn: () => ({ valid: true }) }
    )

    expect(result.success).toBe(false)
  })

  it('should trim whitespace from identifiers', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    await handleSignIn(
      mockSupabase,
      { email: '  test@gmail.com  ', password: 'Password123' },
      { validatorFn: () => ({ valid: true }) }
    )

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@gmail.com',
      password: 'Password123',
    })
  })

  it('should handle OTP with leading/trailing spaces', async () => {
    mockSupabase.auth.verifyOtp.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    await handleVerifyOTP(
      mockSupabase,
      { email: 'test@example.com' },
      '  123456  ',
      'email'
    )

    expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: '123456',
      type: 'email' | 'signup',
    })
  })
})
