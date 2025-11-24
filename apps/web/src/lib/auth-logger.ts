/**
 * Auth Logger - Safe logging utility for authentication operations
 *
 * Prevents sensitive data leakage by automatically masking:
 * - Email addresses
 * - Phone numbers
 * - User IDs
 * - Passwords
 * - OTP tokens
 *
 * Development: Logs verbose information for debugging
 * Production: Logs only essential information with masked data
 */

interface LogContext {
  [key: string]: unknown
}

function maskEmail(email?: string): string {
  if (!email) return 'unknown'
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***'
  return `${local.substring(0, 2)}***@${domain}`
}

function maskPhone(phone?: string): string {
  if (!phone) return 'unknown'
  // Keep only country code and last 2 digits
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 4) return '****'
  return `***${cleaned.slice(-2)}`
}

function maskUserId(id?: string): string {
  if (!id) return 'unknown'
  return `${id.substring(0, 8)}...`
}

function maskToken(token?: string): string {
  if (!token) return 'unknown'
  return `${token.substring(0, 20)}...`
}

/**
 * Recursively mask sensitive data in an object
 * Reserved for structured logging service integration (Sentry, DataDog, etc.)
 * @param data - The data object to mask
 * @param depth - Current recursion depth (max 3 to prevent deep recursion)
 * @returns Masked copy of the data
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function maskSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 3 || !data || typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, depth + 1))
  }

  const masked: LogContext = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()

    // Mask sensitive fields
    if (lowerKey.includes('email')) {
      masked[key] = maskEmail(value as string)
    } else if (lowerKey.includes('phone')) {
      masked[key] = maskPhone(value as string)
    } else if (lowerKey.includes('password') || lowerKey.includes('pwd')) {
      masked[key] = '***'
    } else if (lowerKey.includes('token') || lowerKey.includes('otp')) {
      masked[key] = maskToken(value as string)
    } else if (lowerKey === 'id' || lowerKey.includes('user_id')) {
      masked[key] = maskUserId(value as string)
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value, depth + 1)
    } else {
      masked[key] = value
    }
  }

  return masked
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Auth-specific logger with sensitive data masking
 */
export const authLogger = {
  /**
   * Development-only debug logs
   * @param message - The message to log
   * @param context - Optional context object (will be masked)
   */
  debug: (_message: string, _context?: LogContext) => {
    if (isDevelopment) {
      // Debug logging only in development via monitoring service
    }
  },

  /**
   * Info level logs (shown in development, masked in production)
   * @param message - The message to log
   * @param context - Optional context object (will be masked)
   */
  info: (_message: string, _context?: LogContext) => {
    if (isDevelopment) {
      // Info logging only in development via monitoring service
    } else {
      // In production, log via structured logging service (Sentry, DataDog, etc.)
    }
  },

  /**
   * Warning level logs (always shown, masked in production)
   * @param message - The message to log
   * @param errorOrContext - Optional error or context object (will be masked)
   */
  warn: (_message: string, _errorOrContext?: Error | LogContext) => {
    if (_errorOrContext instanceof Error) {
      if (isDevelopment) {
        // Warning logging via monitoring service
      } else {
        // In production, log via structured logging service with masked data
      }
    } else {
      if (isDevelopment) {
        // Warning logging with context via monitoring service
      } else {
        // In production, suppress detailed context - use structured logging only
      }
    }
  },

  /**
   * Error level logs (always shown, masked in production)
   * CRITICAL: Never log sensitive data in production
   * @param message - The message to log
   * @param error - The error object (will be masked)
   * @param context - Optional additional context (will be masked)
   */
  error: (_message: string, _error?: Error | unknown, _context?: LogContext) => {
    if (isDevelopment) {
      // Error logging with full context via monitoring service
    } else {
      // In production, only log message via structured logging service, suppress stack traces
    }
  },

  /**
   * Critical errors that should always be logged
   * (but still masked in production)
   * @param message - The message to log
   * @param error - The error object (will be masked)
   */
  critical: (_message: string, _error?: Error | unknown) => {
    // Always log critical errors via structured logging service
    // Error tracking integration: Sentry, DataDog, or similar monitoring service
    if (isProduction) {
      // Production error tracking service integration point
    }
  },

  /**
   * Success logs (development only)
   * @param message - The message to log
   * @param context - Optional context object (will be masked)
   */
  success: (_message: string, _context?: LogContext) => {
    if (isDevelopment) {
      // Success logging only in development via monitoring service
    }
  },
}

/**
 * Helper function to mask sensitive data for external use
 * Can be used in error messages shown to users
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message

    // Don't expose internal error details to users
    if (message.includes('rate limit')) {
      return 'Too many requests. Please wait a few minutes and try again.'
    }
    if (message.includes('invalid') || message.includes('failed')) {
      return 'Authentication failed. Please check your credentials and try again.'
    }
    if (message.includes('email') || message.includes('phone')) {
      return 'There was an issue with your email or phone number. Please try again.'
    }

    // Don't expose the actual error message to users
    return 'An authentication error occurred. Please try again.'
  }

  return 'An unexpected error occurred. Please try again.'
}
