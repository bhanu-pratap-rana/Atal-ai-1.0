/**
 * Security and Cryptography Constants
 * Centralized constants for security-related functionality
 *
 * SECURITY NOTICE: Never commit environment-specific values (actual API keys, secrets, etc.)
 * Only commit configuration constants that are safe to be public
 */

// ============================================================================
// CRYPTOGRAPHY CONSTANTS
// ============================================================================

/**
 * Bcrypt hashing salt rounds
 * Higher = more secure but slower
 * 10 rounds = ~10ms to hash, industry standard for passwords/PINs
 * Used in: PIN hashing, password hashing
 */
export const BCRYPT_ROUNDS = 10

// ============================================================================
// LOCKOUT & RATE LIMITING CONSTANTS
// ============================================================================

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
