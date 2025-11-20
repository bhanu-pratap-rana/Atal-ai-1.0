/**
 * Authentication and Security Constants
 * Centralized constants for auth-related functionality
 *
 * SECURITY NOTICE: Never commit environment-specific values (actual API keys, secrets, etc.)
 * Only commit configuration constants that are safe to be public
 */

// ============================================================================
// SECURITY & CRYPTOGRAPHY CONSTANTS
// ============================================================================

/**
 * Bcrypt hashing salt rounds
 * Higher = more secure but slower
 * 10 rounds = ~10ms to hash, industry standard for passwords/PINs
 * Used in: PIN hashing, password hashing
 */
export const BCRYPT_ROUNDS = 10

/**
 * Maximum PIN attempts before account lockout
 * Used in: Staff PIN verification
 */
export const MAX_PIN_ATTEMPTS = 5

/**
 * PIN lockout duration in milliseconds
 * Used in: Account lockout after failed PIN attempts
 */
export const PIN_LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// ============================================================================
// ANALYTICS & LEARNING METRICS CONSTANTS
// ============================================================================

/**
 * Analytics lookback window in days
 * Used to: Calculate engagement metrics, active user counts, learning patterns
 * Business logic: 7 days = 1 week, standard period for engagement analysis
 */
export const ANALYTICS_WINDOW_DAYS = 7

/**
 * Rapid response threshold in milliseconds
 * Used to: Flag potentially disengaged or rushing students
 * Business logic: Responses < 5 seconds indicate student is guessing/not reading content
 * Helps identify students at risk of poor learning outcomes
 */
export const RAPID_RESPONSE_THRESHOLD_MS = 5000

/**
 * At-risk indicator: rapid response percentage threshold
 * Used to: Flag students with excessive rapid responses as requiring intervention
 * Business logic: If >= 30% of responses are rapid, student is at-risk
 * Teachers use this to identify students needing support
 */
export const AT_RISK_RAPID_PERCENTAGE = 0.3 // 30%

/**
 * At-risk indicator: student inactivity threshold in days
 * Used to: Flag students who haven't submitted assessments recently
 * Business logic: No activity in 7+ days = potential dropout risk
 */
export const INACTIVITY_THRESHOLD_DAYS = 7

// ============================================================================
// API & NETWORK CONSTANTS
// ============================================================================

/**
 * Default application URL for development environment
 * Used when NEXT_PUBLIC_APP_URL environment variable is not set
 * Used in: Authentication redirects, CORS handling, callback URLs
 */
export const DEFAULT_DEV_ORIGIN = 'http://localhost:3000'

/**
 * Request timeout in milliseconds
 * Used to: Prevent hanging requests to external services
 */
export const REQUEST_TIMEOUT_MS = 30000 // 30 seconds

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Minimum password length
 * Used in: Password validation rules
 */
export const MIN_PASSWORD_LENGTH = 8

/**
 * Minimum PIN length
 * Used in: Staff PIN validation
 */
export const MIN_PIN_LENGTH = 4

/**
 * Maximum PIN length
 * Used in: Staff PIN validation
 */
export const MAX_PIN_LENGTH = 8

/**
 * OTP (One-Time Password) length in digits
 * Used in: Email/SMS OTP validation
 */
export const OTP_LENGTH = 6

/**
 * OTP validity duration in milliseconds
 * Used to: Invalidate OTP codes after this period
 */
export const OTP_VALIDITY_MS = 10 * 60 * 1000 // 10 minutes

// ============================================================================
// RATE LIMITING CONSTANTS
// ============================================================================

/**
 * Maximum OTP requests per hour per email
 * Used in: Rate limiting for OTP sending
 */
export const MAX_OTP_REQUESTS_PER_HOUR = 5

/**
 * Maximum failed login attempts before rate limit
 * Used in: Login rate limiting
 */
export const MAX_LOGIN_ATTEMPTS = 10

/**
 * Login rate limit window in milliseconds
 * Used to: Reset login attempt counter after this period
 */
export const LOGIN_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// ============================================================================
// SESSION CONSTANTS
// ============================================================================

/**
 * Session inactivity timeout in milliseconds
 * After this period of inactivity, user is automatically logged out
 * Used in: Session management
 */
export const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Session renewal threshold in milliseconds
 * Sessions refresh if older than this (refreshes on user activity)
 * Used in: Token refresh logic
 */
export const SESSION_RENEWAL_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours
