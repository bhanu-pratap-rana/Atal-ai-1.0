/**
 * Unit tests for rate-limiter.ts
 *
 * Tests token bucket rate limiting algorithm
 * Ensures DoS protection and brute-force prevention
 *
 * Tests: 20+ cases covering token bucket mechanics, rate limits, and edge cases
 */

import {
  checkOtpRateLimit,
  checkPasswordResetRateLimit,
  checkIpRateLimit,
  getOtpRateLimitRemaining,
  resetOtpRateLimit,
  resetPasswordResetRateLimit,
  resetIpRateLimit,
  getRateLimiterStats,
  otpRateLimiter,
  passwordResetRateLimiter,
  ipRateLimiter,
} from './rate-limiter'

describe('OTP Rate Limiter', () => {
  afterEach(() => {
    // Clean up after each test
    otpRateLimiter.clearAll()
  })

  it('should allow first OTP request', () => {
    const result = checkOtpRateLimit('test@example.com')
    expect(result).toBe(true)
  })

  it('should allow multiple requests within rate limit', () => {
    const email = 'test@example.com'
    expect(checkOtpRateLimit(email)).toBe(true)
    expect(checkOtpRateLimit(email)).toBe(true)
    expect(checkOtpRateLimit(email)).toBe(true)
    expect(checkOtpRateLimit(email)).toBe(true)
    expect(checkOtpRateLimit(email)).toBe(true)
  })

  it('should block OTP request after reaching limit (5 per hour)', () => {
    const email = 'test@example.com'
    // Use up all 5 tokens
    for (let i = 0; i < 5; i++) {
      expect(checkOtpRateLimit(email)).toBe(true)
    }
    // 6th request should be blocked
    expect(checkOtpRateLimit(email)).toBe(false)
  })

  it('should allow different emails to have independent limits', () => {
    const email1 = 'user1@example.com'
    const email2 = 'user2@example.com'

    // Max out email1
    for (let i = 0; i < 5; i++) {
      checkOtpRateLimit(email1)
    }

    // email1 should be blocked
    expect(checkOtpRateLimit(email1)).toBe(false)

    // email2 should still be allowed
    expect(checkOtpRateLimit(email2)).toBe(true)
  })

  it('should track remaining tokens correctly', () => {
    const email = 'test@example.com'
    checkOtpRateLimit(email)
    checkOtpRateLimit(email)

    const remaining = getOtpRateLimitRemaining(email)
    expect(remaining).toBe(3) // 5 - 2 = 3
  })

  it('should return max tokens for unknown email', () => {
    const remaining = getOtpRateLimitRemaining('unknown@example.com')
    expect(remaining).toBe(5)
  })

  it('should reset rate limit when explicitly called', () => {
    const email = 'test@example.com'

    // Max out the limit
    for (let i = 0; i < 5; i++) {
      checkOtpRateLimit(email)
    }
    expect(checkOtpRateLimit(email)).toBe(false)

    // Reset
    resetOtpRateLimit(email)

    // Should be allowed again
    expect(checkOtpRateLimit(email)).toBe(true)
  })

  it('should be case-insensitive for email', () => {
    const result1 = checkOtpRateLimit('Test@Example.com')
    const result2 = checkOtpRateLimit('test@example.com')
    const result3 = checkOtpRateLimit('TEST@EXAMPLE.COM')

    // All should use the same key (lowercased)
    expect(result1).toBe(true)
    expect(result2).toBe(true)
    expect(result3).toBe(true)
    expect(getOtpRateLimitRemaining('test@example.com')).toBe(2) // 5 - 3
  })
})

describe('Password Reset Rate Limiter', () => {
  afterEach(() => {
    passwordResetRateLimiter.clearAll()
  })

  it('should allow first password reset request', () => {
    const result = checkPasswordResetRateLimit('test@example.com')
    expect(result).toBe(true)
  })

  it('should allow up to 3 password reset requests per hour', () => {
    const email = 'test@example.com'
    expect(checkPasswordResetRateLimit(email)).toBe(true)
    expect(checkPasswordResetRateLimit(email)).toBe(true)
    expect(checkPasswordResetRateLimit(email)).toBe(true)
  })

  it('should block 4th password reset request', () => {
    const email = 'test@example.com'
    for (let i = 0; i < 3; i++) {
      checkPasswordResetRateLimit(email)
    }
    expect(checkPasswordResetRateLimit(email)).toBe(false)
  })

  it('should reset password limit when explicitly called', () => {
    const email = 'test@example.com'
    for (let i = 0; i < 3; i++) {
      checkPasswordResetRateLimit(email)
    }
    expect(checkPasswordResetRateLimit(email)).toBe(false)

    resetPasswordResetRateLimit(email)
    expect(checkPasswordResetRateLimit(email)).toBe(true)
  })
})

describe('IP Rate Limiter', () => {
  afterEach(() => {
    ipRateLimiter.clearAll()
  })

  it('should allow first request from IP', () => {
    const result = checkIpRateLimit('192.168.1.1')
    expect(result).toBe(true)
  })

  it('should allow up to 10 requests per minute from an IP', () => {
    const ip = '192.168.1.1'
    for (let i = 0; i < 10; i++) {
      expect(checkIpRateLimit(ip)).toBe(true)
    }
  })

  it('should block 11th request from IP', () => {
    const ip = '192.168.1.1'
    for (let i = 0; i < 10; i++) {
      checkIpRateLimit(ip)
    }
    expect(checkIpRateLimit(ip)).toBe(false)
  })

  it('should allow different IPs to have independent limits', () => {
    const ip1 = '192.168.1.1'
    const ip2 = '192.168.1.2'

    // Max out ip1
    for (let i = 0; i < 10; i++) {
      checkIpRateLimit(ip1)
    }

    // ip1 should be blocked
    expect(checkIpRateLimit(ip1)).toBe(false)

    // ip2 should still be allowed
    expect(checkIpRateLimit(ip2)).toBe(true)
  })

  it('should reset IP rate limit when explicitly called', () => {
    const ip = '192.168.1.1'

    for (let i = 0; i < 10; i++) {
      checkIpRateLimit(ip)
    }
    expect(checkIpRateLimit(ip)).toBe(false)

    resetIpRateLimit(ip)
    expect(checkIpRateLimit(ip)).toBe(true)
  })
})

describe('Rate Limiter Statistics', () => {
  afterEach(() => {
    otpRateLimiter.clearAll()
    passwordResetRateLimiter.clearAll()
    ipRateLimiter.clearAll()
  })

  it('should return statistics for all rate limiters', () => {
    // Add some entries
    checkOtpRateLimit('test@example.com')
    checkPasswordResetRateLimit('test@example.com')
    checkIpRateLimit('192.168.1.1')

    const stats = getRateLimiterStats()

    expect(stats.otp).toBeDefined()
    expect(stats.otp.entries).toBe(1)
    expect(stats.otp.config).toContain('5')

    expect(stats.passwordReset).toBeDefined()
    expect(stats.passwordReset.entries).toBe(1)
    expect(stats.passwordReset.config).toContain('3')

    expect(stats.ip).toBeDefined()
    expect(stats.ip.entries).toBe(1)
  })

  it('should track multiple entries correctly', () => {
    checkOtpRateLimit('email1@example.com')
    checkOtpRateLimit('email2@example.com')
    checkOtpRateLimit('email3@example.com')

    const stats = getRateLimiterStats()
    expect(stats.otp.entries).toBe(3)
  })
})

describe('Edge Cases and Security', () => {
  afterEach(() => {
    otpRateLimiter.clearAll()
    passwordResetRateLimiter.clearAll()
    ipRateLimiter.clearAll()
  })

  it('should handle rapid-fire requests correctly', () => {
    const email = 'test@example.com'
    let allowedCount = 0

    // Simulate rapid requests
    for (let i = 0; i < 10; i++) {
      if (checkOtpRateLimit(email)) {
        allowedCount++
      }
    }

    expect(allowedCount).toBe(5) // Should allow exactly 5
  })

  it('should handle empty/null inputs safely', () => {
    expect(checkOtpRateLimit('')).toBe(true) // Empty string gets its own bucket
    expect(checkOtpRateLimit('test')).toBe(true)
  })

  it('should not share buckets between different limiters', () => {
    const identifier = 'test@example.com'

    // Each should have independent buckets
    for (let i = 0; i < 5; i++) {
      checkOtpRateLimit(identifier)
    }

    // OTP should be blocked
    expect(checkOtpRateLimit(identifier)).toBe(false)

    // Password reset should still work (different limiter)
    expect(checkPasswordResetRateLimit(identifier)).toBe(true)
  })

  it('should handle very long identifiers', () => {
    const longEmail = 'a'.repeat(1000) + '@example.com'
    expect(checkOtpRateLimit(longEmail)).toBe(true)
  })

  it('should be deterministic - same calls always succeed/fail identically', () => {
    const email = 'test@example.com'
    const results = []

    for (let i = 0; i < 10; i++) {
      results.push(checkOtpRateLimit(email))
    }

    // First 5 should be true, rest false
    expect(results.slice(0, 5).every(r => r === true)).toBe(true)
    expect(results.slice(5).every(r => r === false)).toBe(true)
  })
})

describe('Token Bucket Algorithm', () => {
  afterEach(() => {
    otpRateLimiter.clearAll()
  })

  it('should correctly implement token bucket algorithm', () => {
    const email = 'test@example.com'

    // Initial: 5 tokens available
    expect(checkOtpRateLimit(email)).toBe(true) // 5 -> 4
    expect(checkOtpRateLimit(email)).toBe(true) // 4 -> 3
    expect(checkOtpRateLimit(email)).toBe(true) // 3 -> 2
    expect(checkOtpRateLimit(email)).toBe(true) // 2 -> 1
    expect(checkOtpRateLimit(email)).toBe(true) // 1 -> 0

    // No tokens left
    expect(checkOtpRateLimit(email)).toBe(false)
  })

  it('should track remaining tokens accurately after partial consumption', () => {
    const email = 'test@example.com'

    checkOtpRateLimit(email) // Use 1
    checkOtpRateLimit(email) // Use 1
    checkOtpRateLimit(email) // Use 1

    expect(getOtpRateLimitRemaining(email)).toBe(2) // 5 - 3
  })
})
