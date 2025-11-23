/**
 * Distributed Rate Limiter - Production-ready rate limiting with Redis support
 *
 * Implements token bucket algorithm for rate limiting auth operations
 * Supports both in-memory (development) and Redis (production) backends
 *
 * Features:
 * - Token bucket algorithm for fair rate limiting
 * - Redis support for distributed deployments
 * - Fallback to in-memory for development
 * - Configurable limits and refill rates
 * - Admin operations (reset, clear)
 * - Monitoring and statistics
 *
 * Usage:
 * ```typescript
 * // Development (in-memory)
 * const limiter = new RateLimiter({ maxTokens: 5, refillRate: 5/3600 })
 *
 * // Production (Redis)
 * const limiter = new RateLimiter({ maxTokens: 5, refillRate: 5/3600 }, redisClient)
 * ```
 */

interface RateLimitEntry {
  tokens: number
  lastRefill: number
}

interface RateLimitConfig {
  maxTokens: number // Maximum tokens in bucket
  refillRate: number // Tokens per second (e.g., 1 token per 600 seconds = 6 per hour)
  refillInterval: number // Refill check interval in milliseconds
  ttl?: number // TTL in seconds for Redis keys (default: 3600)
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number // Seconds until next request allowed
}

/**
 * Base rate limiter interface for both in-memory and Redis implementations
 */
interface IRateLimiter {
  isAllowed(key: string): Promise<boolean>
  getRemaining(key: string): Promise<number>
  reset(key: string): Promise<void>
  clearAll(): Promise<void>
  getSize(): Promise<number>
  getStatus(key: string): Promise<RateLimitEntry | null>
}

/**
 * In-memory rate limiter (development)
 * WARNING: Not suitable for production with multiple server instances
 */
class InMemoryRateLimiter implements IRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now()
    const entry = this.store.get(key)

    // Initialize new entry if doesn't exist
    if (!entry) {
      this.store.set(key, {
        tokens: this.config.maxTokens - 1,
        lastRefill: now,
      })
      return true
    }

    // Calculate tokens to add based on time elapsed
    const timePassed = (now - entry.lastRefill) / 1000
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

  async getRemaining(key: string): Promise<number> {
    const entry = this.store.get(key)
    if (!entry) return this.config.maxTokens
    return Math.floor(entry.tokens)
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clearAll(): Promise<void> {
    this.store.clear()
  }

  async getSize(): Promise<number> {
    return this.store.size
  }

  async getStatus(key: string): Promise<RateLimitEntry | null> {
    return this.store.get(key) || null
  }
}

/**
 * Redis-backed rate limiter (production)
 * Supports distributed rate limiting across multiple server instances
 */
class RedisRateLimiter implements IRateLimiter {
  private redisClient: any // Redis client type
  private config: RateLimitConfig
  private prefix: string

  constructor(config: RateLimitConfig, redisClient: any, prefix: string = 'ratelimit:') {
    this.config = config
    this.redisClient = redisClient
    this.prefix = prefix
  }

  private getRedisKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async isAllowed(key: string): Promise<boolean> {
    const redisKey = this.getRedisKey(key)
    const now = Date.now()

    try {
      // Get current entry from Redis
      const data = await this.redisClient.get(redisKey)
      let entry: RateLimitEntry

      if (!data) {
        // Initialize new entry
        entry = {
          tokens: this.config.maxTokens - 1,
          lastRefill: now,
        }
      } else {
        entry = JSON.parse(data)

        // Calculate tokens to add based on time elapsed
        const timePassed = (now - entry.lastRefill) / 1000
        const tokensToAdd = timePassed * this.config.refillRate

        // Update tokens
        entry.tokens = Math.min(
          this.config.maxTokens,
          entry.tokens + tokensToAdd
        )
        entry.lastRefill = now
      }

      // Check if we have tokens available
      if (entry.tokens >= 1) {
        entry.tokens -= 1

        // Store updated entry in Redis
        const ttl = this.config.ttl || 3600
        await this.redisClient.setex(
          redisKey,
          ttl,
          JSON.stringify(entry)
        )

        return true
      }

      // Rate limited - update expiry
      const ttl = this.config.ttl || 3600
      await this.redisClient.expire(redisKey, ttl)

      return false
    } catch (error) {
      console.error('[RedisRateLimiter] Error checking rate limit:', error)
      // Fail open - allow request if Redis is down
      return true
    }
  }

  async getRemaining(key: string): Promise<number> {
    const redisKey = this.getRedisKey(key)

    try {
      const data = await this.redisClient.get(redisKey)
      if (!data) return this.config.maxTokens

      const entry: RateLimitEntry = JSON.parse(data)
      return Math.floor(entry.tokens)
    } catch (error) {
      console.error('[RedisRateLimiter] Error getting remaining tokens:', error)
      return this.config.maxTokens
    }
  }

  async reset(key: string): Promise<void> {
    const redisKey = this.getRedisKey(key)

    try {
      await this.redisClient.del(redisKey)
    } catch (error) {
      console.error('[RedisRateLimiter] Error resetting rate limit:', error)
    }
  }

  async clearAll(): Promise<void> {
    try {
      const pattern = `${this.prefix}*`
      const keys = await this.redisClient.keys(pattern)

      if (keys.length > 0) {
        await this.redisClient.del(...keys)
      }
    } catch (error) {
      console.error('[RedisRateLimiter] Error clearing all:', error)
    }
  }

  async getSize(): Promise<number> {
    try {
      const pattern = `${this.prefix}*`
      const keys = await this.redisClient.keys(pattern)
      return keys.length
    } catch (error) {
      console.error('[RedisRateLimiter] Error getting size:', error)
      return 0
    }
  }

  async getStatus(key: string): Promise<RateLimitEntry | null> {
    const redisKey = this.getRedisKey(key)

    try {
      const data = await this.redisClient.get(redisKey)
      if (!data) return null
      return JSON.parse(data)
    } catch (error) {
      console.error('[RedisRateLimiter] Error getting status:', error)
      return null
    }
  }
}

/**
 * Factory function to create appropriate rate limiter
 * Uses Redis if available, falls back to in-memory
 */
export function createRateLimiter(
  config: RateLimitConfig,
  redisClient?: any
): IRateLimiter {
  if (redisClient) {
    return new RedisRateLimiter(config, redisClient)
  }
  return new InMemoryRateLimiter(config)
}

/**
 * High-level API for rate limiting
 * Provides convenient interface for common operations
 */
export class RateLimitManager {
  private limiters: Map<string, IRateLimiter> = new Map()
  private redisClient?: any

  constructor(redisClient?: any) {
    this.redisClient = redisClient
  }

  private getOrCreateLimiter(name: string, config: RateLimitConfig): IRateLimiter {
    if (!this.limiters.has(name)) {
      this.limiters.set(name, createRateLimiter(config, this.redisClient))
    }
    return this.limiters.get(name)!
  }

  /**
   * Check if a request is allowed and return detailed result
   */
  async checkLimit(
    limiterName: string,
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const limiter = this.getOrCreateLimiter(limiterName, config)
    const allowed = await limiter.isAllowed(key)
    const remaining = await limiter.getRemaining(key)

    return {
      allowed,
      remaining,
      retryAfter: allowed ? undefined : Math.ceil(1 / config.refillRate),
    }
  }

  /**
   * Get remaining quota for a key
   */
  async getRemaining(
    limiterName: string,
    key: string,
    config: RateLimitConfig
  ): Promise<number> {
    const limiter = this.getOrCreateLimiter(limiterName, config)
    return limiter.getRemaining(key)
  }

  /**
   * Reset rate limit for a key
   */
  async reset(limiterName: string, key: string, config: RateLimitConfig): Promise<void> {
    const limiter = this.getOrCreateLimiter(limiterName, config)
    return limiter.reset(key)
  }

  /**
   * Get detailed status for debugging
   */
  async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {}

    for (const [name, limiter] of this.limiters) {
      stats[name] = {
        entries: await limiter.getSize(),
        limiter: this.redisClient ? 'Redis' : 'In-Memory',
      }
    }

    return stats
  }
}

/**
 * Export singleton instance
 * Can be replaced with Redis-backed instance in production
 */
export const defaultRateLimitManager = new RateLimitManager()

/**
 * Convenience functions for backward compatibility
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<boolean> {
  const result = await defaultRateLimitManager.checkLimit('default', key, config)
  return result.allowed
}

export async function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return defaultRateLimitManager.checkLimit('default', key, config)
}

export async function resetRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<void> {
  return defaultRateLimitManager.reset('default', key, config)
}
