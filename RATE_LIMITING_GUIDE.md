# Rate Limiting Implementation Guide

## Overview

ATAL AI implements two rate limiting systems:

1. **In-Memory Rate Limiter** (`rate-limiter.ts`) - Development/current implementation
2. **Distributed Rate Limiter** (`rate-limiter-distributed.ts`) - Production-ready with Redis support

## Current Implementation (In-Memory)

### Location
`src/lib/rate-limiter.ts`

### Features
- Token bucket algorithm
- Three configurable limiters:
  - **OTP Limiter**: 5 requests per hour per email/phone
  - **Password Reset Limiter**: 3 requests per hour per email
  - **IP Limiter**: 10 requests per minute per IP

### Usage

```typescript
import {
  checkOtpRateLimit,
  checkPasswordResetRateLimit,
  checkIpRateLimit,
  getOtpRateLimitRemaining,
  getRateLimiterStats,
} from '@/lib/rate-limiter'

// Check if OTP request is allowed
if (!checkOtpRateLimit('user@example.com')) {
  // Rate limited - reject request
  return { error: 'Too many requests. Try again later.' }
}

// Get remaining requests for user feedback
const remaining = getOtpRateLimitRemaining('user@example.com')
console.log(`${remaining} attempts remaining`)

// Get monitoring stats
const stats = getRateLimiterStats()
```

### Configuration

```typescript
// OTP: 5 tokens per 3600 seconds (1 hour)
maxTokens: 5
refillRate: 5 / 3600  // ~0.00139 tokens/second

// Password Reset: 3 tokens per 3600 seconds
maxTokens: 3
refillRate: 3 / 3600  // ~0.00083 tokens/second

// IP: 10 tokens per 60 seconds
maxTokens: 10
refillRate: 10 / 60  // ~0.167 tokens/second
```

### Limitations
- ⚠️ **Not suitable for production with multiple server instances**
- Data is lost on server restart
- Cannot be shared across load balancers
- No persistence

---

## New Implementation (Distributed)

### Location
`src/lib/rate-limiter-distributed.ts`

### Features
- Same token bucket algorithm
- Dual backend support:
  - In-Memory (development)
  - Redis (production)
- Automatic backend selection
- Monitoring and statistics
- Configurable TTL (Time-to-Live)
- Error handling and fallback behavior

### Installation (Production)

#### 1. Install Redis Client

```bash
npm install redis
# or
npm install ioredis
```

#### 2. Configure Redis Connection

```typescript
// lib/redis-client.ts
import { createClient } from 'redis'

export const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
})

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err)
})

export default redisClient
```

#### 3. Update Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Usage

#### Development (In-Memory)
```typescript
import { createRateLimiter } from '@/lib/rate-limiter-distributed'

const otpLimiter = createRateLimiter({
  maxTokens: 5,
  refillRate: 5 / 3600,
  refillInterval: 1000,
})

const allowed = await otpLimiter.isAllowed('user@example.com')
```

#### Production (Redis)
```typescript
import { createRateLimiter } from '@/lib/rate-limiter-distributed'
import redisClient from '@/lib/redis-client'

const otpLimiter = createRateLimiter(
  {
    maxTokens: 5,
    refillRate: 5 / 3600,
    refillInterval: 1000,
    ttl: 3600, // 1 hour
  },
  redisClient
)

const allowed = await otpLimiter.isAllowed('user@example.com')
```

### RateLimitManager (Recommended)

High-level API for managing multiple limiters:

```typescript
import { RateLimitManager } from '@/lib/rate-limiter-distributed'
import redisClient from '@/lib/redis-client'

// Initialize manager
const manager = new RateLimitManager(redisClient)

// Check rate limit with detailed result
const result = await manager.checkLimit('otp', 'user@example.com', {
  maxTokens: 5,
  refillRate: 5 / 3600,
  refillInterval: 1000,
  ttl: 3600,
})

// Result contains:
// {
//   allowed: boolean,
//   remaining: number,
//   retryAfter?: number
// }

// Use in response
if (!result.allowed) {
  return {
    error: 'Too many requests',
    retryAfter: result.retryAfter,
  }
}
```

### Integration with Auth Actions

```typescript
import { RateLimitManager } from '@/lib/rate-limiter-distributed'
import redisClient from '@/lib/redis-client'

const rateLimitManager = new RateLimitManager(redisClient)

export async function requestOtp(email: string) {
  // Check rate limit
  const limit = await rateLimitManager.checkLimit('otp', email, {
    maxTokens: 5,
    refillRate: 5 / 3600,
    refillInterval: 1000,
    ttl: 3600,
  })

  if (!limit.allowed) {
    return {
      success: false,
      error: `Too many requests. Try again in ${limit.retryAfter} seconds.`,
    }
  }

  // Continue with OTP sending...
}
```

---

## Monitoring & Debugging

### Get Statistics

```typescript
const stats = await manager.getStats()
// Returns:
// {
//   'otp': { entries: 124, limiter: 'Redis' },
//   'password_reset': { entries: 45, limiter: 'Redis' },
//   'ip': { entries: 1023, limiter: 'Redis' }
// }
```

### Check Specific Key Status

```typescript
const limiter = createRateLimiter(config, redisClient)
const status = await limiter.getStatus('user@example.com')
// Returns:
// {
//   tokens: 3.5,
//   lastRefill: 1700000000000
// }
```

### Reset Rate Limit

```typescript
// For a specific key
await limiter.reset('user@example.com')

// For all keys
await limiter.clearAll()
```

---

## Migration Strategy (Development → Production)

### Phase 1: Implement & Test (Current)
- ✅ Created `rate-limiter-distributed.ts`
- Ready for testing with in-memory backend
- No dependencies on external services

### Phase 2: Set Up Redis (Before Production)
1. Deploy Redis server/cluster
2. Configure connection in environment
3. Test Redis connectivity
4. Run load tests

### Phase 3: Gradual Rollout
```typescript
// Canary deployment
const redisClient = process.env.USE_REDIS_RATE_LIMIT
  ? createRedisClient()
  : undefined

const manager = new RateLimitManager(redisClient)
```

### Phase 4: Full Migration
- Remove in-memory dependency
- Monitor Redis performance
- Set up Redis monitoring/alerting

---

## Performance Characteristics

### In-Memory
- **Latency**: < 1ms
- **Scalability**: Single instance only
- **Memory**: ~100 bytes per entry
- **Best for**: Development, small deployments

### Redis
- **Latency**: 1-5ms (network dependent)
- **Scalability**: Infinite (distributed)
- **Memory**: Configurable with TTL
- **Best for**: Production, multi-instance deployments

---

## Security Considerations

### Token Bucket Algorithm
- ✅ Fair rate limiting (tokens refill gradually)
- ✅ Prevents burst attacks
- ✅ Allows brief spikes in legitimate traffic

### Implementation
- ✅ No shared secrets required
- ✅ IP-based and user-based limiting
- ✅ Automatic cleanup with TTL

### Redis Security
- 🔒 Use AUTH with strong passwords
- 🔒 Enable SSL/TLS for remote connections
- 🔒 Restrict network access to app servers
- 🔒 Enable Redis persistence (RDB/AOF)

---

## Troubleshooting

### Too Many Rate Limited Requests

**Cause**: Limits too strict
**Solution**:
```typescript
// Increase maxTokens or refillRate
{
  maxTokens: 10,  // Increased from 5
  refillRate: 10 / 3600,  // More tokens per hour
}
```

### Redis Connection Failures

**Cause**: Redis server down or network issue
**Solution**:
```typescript
// Automatic fallback - if Redis fails, allows requests
// (fail-open approach for availability)
const limiter = createRateLimiter(config, redisClient)
// Returns true if Redis unreachable (safe default)
```

### High Redis Memory Usage

**Cause**: TTL too long or keys not expiring
**Solution**:
```typescript
// Reduce TTL
{
  ttl: 1800,  // 30 minutes instead of 1 hour
  maxTokens: 5,
  refillRate: 5 / 3600,
}
```

### Uneven Distribution

**Cause**: Keys accumulating
**Solution**: Monitor with `getStats()` and adjust TTL accordingly

---

## API Reference

### RateLimiter Interface

```typescript
interface IRateLimiter {
  // Check if request allowed (uses 1 token)
  isAllowed(key: string): Promise<boolean>

  // Get remaining tokens
  getRemaining(key: string): Promise<number>

  // Reset rate limit
  reset(key: string): Promise<void>

  // Clear all entries
  clearAll(): Promise<void>

  // Get entry count
  getSize(): Promise<number>

  // Get detailed entry data
  getStatus(key: string): Promise<RateLimitEntry | null>
}
```

### Configuration

```typescript
interface RateLimitConfig {
  maxTokens: number     // Max tokens in bucket (e.g., 5)
  refillRate: number    // Tokens/second (e.g., 5/3600)
  refillInterval: number // Check interval in ms (1000)
  ttl?: number          // Redis TTL in seconds (3600)
}
```

### Result

```typescript
interface RateLimitResult {
  allowed: boolean      // Whether request allowed
  remaining: number     // Tokens remaining
  retryAfter?: number   // Seconds until allowed
}
```

---

## Examples

### Example 1: Simple OTP Limiting

```typescript
import { RateLimitManager } from '@/lib/rate-limiter-distributed'

const manager = new RateLimitManager()

export async function requestOtp(email: string) {
  const result = await manager.checkLimit('otp', email, {
    maxTokens: 5,
    refillRate: 5 / 3600,
    refillInterval: 1000,
  })

  if (!result.allowed) {
    throw new Error(
      `Rate limited. Try again in ${result.retryAfter} seconds`
    )
  }

  // Send OTP...
}
```

### Example 2: IP-Based Limiting

```typescript
export async function handleAuthRequest(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  const result = await manager.checkLimit('ip', ip, {
    maxTokens: 10,
    refillRate: 10 / 60,
    refillInterval: 1000,
  })

  if (!result.allowed) {
    return { error: 'Too many requests from your IP' }
  }

  // Handle request...
}
```

### Example 3: Combined Limiting

```typescript
export async function requestPassword Reset(email: string, ip: string) {
  // Check both email and IP limits
  const [emailLimit, ipLimit] = await Promise.all([
    manager.checkLimit('password_reset', email, emailConfig),
    manager.checkLimit('ip', ip, ipConfig),
  ])

  if (!emailLimit.allowed) {
    throw new Error('Too many reset requests for this email')
  }

  if (!ipLimit.allowed) {
    throw new Error('Too many requests from your IP')
  }

  // Reset password...
}
```

---

## Future Enhancements

- [ ] Sliding window rate limiting
- [ ] Distributed rate limiting across regions
- [ ] Machine learning for anomaly detection
- [ ] Custom callbacks for rate limit events
- [ ] GraphQL/WebSocket support
- [ ] Rate limit headers in responses

---

## References

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [OWASP Rate Limiting](https://owasp.org/www-community/attacks/Brute_force_attack)
- [Redis Documentation](https://redis.io/docs/)
- [NIST Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

