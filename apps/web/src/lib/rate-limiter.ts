/**
 * Rate Limiter - Server-side request rate limiting
 *
 * Implements token bucket algorithm for rate limiting auth operations
 * Prevents brute force attacks, DoS, and excessive API calls
 *
 * Supports:
 * - OTP request limiting (5 requests per hour per email/phone)
 * - Password reset limiting (3 requests per hour per email)
 * - IP-based limiting (10 requests per minute per IP)
 *
 * Storage:
 * - Development: In-memory map (for local testing)
 * - Production: For distributed rate limiting, integrate with Redis
 *   This requires Redis client and distributed coordination
 */

interface RateLimitEntry {
  tokens: number
  lastRefill: number
}

interface RateLimitConfig {
  maxTokens: number // Maximum tokens in bucket
  refillRate: number // Tokens per second (e.g., 1 token per 600 seconds = 6 per hour)
  refillInterval: number // Refill check interval in milliseconds
}

/**
 * In-memory rate limiter for development
 * WARNING: This is NOT suitable for production with multiple server instances
 * For production, use Redis-backed rate limiting
 */
class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()

  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if a request should be allowed
   * @param key - Unique identifier (email, phone, IP, etc.)
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now()
    const entry = this.store.get(key)

    // Initialize new entry if doesn't exist
    if (!entry) {
      this.store.set(key, {
        tokens: this.config.maxTokens - 1, // Use one token for this request
        lastRefill: now,
      })
      return true
    }

    // Calculate tokens to add based on time elapsed
    const timePassed = (now - entry.lastRefill) / 1000 // Convert to seconds
    const tokensToAdd = timePassed * this.config.refillRate

    // Update tokens and last refill time
    entry.tokens = Math.min(
      this.config.maxTokens,
      entry.tokens + tokensToAdd
    )
    entry.lastRefill = now

    // Check if we have tokens available
    if (entry.tokens >= 1) {
      entry.tokens -= 1
      return true
    }

    return false
  }

  /**
   * Get remaining tokens for a key (for debugging)
   * @param key - Unique identifier
   * @returns Number of remaining tokens
   */
  getRemainingTokens(key: string): number {
    const entry = this.store.get(key)
    if (!entry) return this.config.maxTokens
    return Math.floor(entry.tokens)
  }

  /**
   * Reset rate limit for a key (admin operation)
   * @param key - Unique identifier
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Clear all entries (for testing)
   */
  clearAll(): void {
    this.store.clear()
  }

  /**
   * Get size of store (for monitoring)
   */
  getSize(): number {
    return this.store.size
  }
}

/**
 * OTP Request Rate Limiter
 * Allows 5 OTP requests per hour per email/phone
 * This prevents brute force attacks on OTP verification
 */
export const otpRateLimiter = new RateLimiter({
  maxTokens: 5,
  refillRate: 5 / 3600, // 5 tokens per 3600 seconds (1 hour)
  refillInterval: 1000,
})

/**
 * Password Reset Rate Limiter
 * Allows 3 password reset requests per hour per email
 * This prevents account takeover via password reset spam
 */
export const passwordResetRateLimiter = new RateLimiter({
  maxTokens: 3,
  refillRate: 3 / 3600, // 3 tokens per 3600 seconds (1 hour)
  refillInterval: 1000,
})

/**
 * IP-based Rate Limiter
 * Allows 10 requests per minute per IP
 * This is a general-purpose limiter for all auth endpoints
 */
export const ipRateLimiter = new RateLimiter({
  maxTokens: 10,
  refillRate: 10 / 60, // 10 tokens per 60 seconds (1 minute)
  refillInterval: 1000,
})

/**
 * Check if an OTP request is allowed for an email/phone
 * @param identifier - Email or phone number
 * @returns true if allowed, false if rate limited
 */
export function checkOtpRateLimit(identifier: string): boolean {
  const key = `otp:${identifier.toLowerCase()}`
  return otpRateLimiter.isAllowed(key)
}

/**
 * Check if a password reset request is allowed for an email
 * @param email - Email address
 * @returns true if allowed, false if rate limited
 */
export function checkPasswordResetRateLimit(email: string): boolean {
  const key = `reset:${email.toLowerCase()}`
  return passwordResetRateLimiter.isAllowed(key)
}

/**
 * Check if a general auth request is allowed from an IP
 * @param ip - IP address (e.g., from req.ip or req.headers['x-forwarded-for'])
 * @returns true if allowed, false if rate limited
 */
export function checkIpRateLimit(ip: string): boolean {
  const key = `ip:${ip}`
  return ipRateLimiter.isAllowed(key)
}

/**
 * Get remaining OTP requests for an identifier
 * Useful for showing users how many attempts they have left
 * @param identifier - Email or phone number
 * @returns Number of remaining requests
 */
export function getOtpRateLimitRemaining(identifier: string): number {
  const key = `otp:${identifier.toLowerCase()}`
  return otpRateLimiter.getRemainingTokens(key)
}

/**
 * Reset OTP rate limit for an identifier (admin operation)
 * @param identifier - Email or phone number
 */
export function resetOtpRateLimit(identifier: string): void {
  const key = `otp:${identifier.toLowerCase()}`
  otpRateLimiter.reset(key)
}

/**
 * Reset password reset rate limit for an email (admin operation)
 * @param email - Email address
 */
export function resetPasswordResetRateLimit(email: string): void {
  const key = `reset:${email.toLowerCase()}`
  passwordResetRateLimiter.reset(key)
}

/**
 * Reset IP rate limit (admin operation)
 * @param ip - IP address
 */
export function resetIpRateLimit(ip: string): void {
  const key = `ip:${ip}`
  ipRateLimiter.reset(key)
}

/**
 * Get monitoring stats for rate limiters
 * Useful for debugging and monitoring
 */
export function getRateLimiterStats() {
  return {
    otp: {
      entries: otpRateLimiter.getSize(),
      config: 'Max 5 requests per hour per email/phone',
    },
    passwordReset: {
      entries: passwordResetRateLimiter.getSize(),
      config: 'Max 3 requests per hour per email',
    },
    ip: {
      entries: ipRateLimiter.getSize(),
      config: 'Max 10 requests per minute per IP',
    },
  }
}
