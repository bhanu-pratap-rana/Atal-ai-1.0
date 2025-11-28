/**
 * Client Logger - Safe logging utility for browser/client-side operations
 *
 * Prevents sensitive data leakage by automatically masking:
 * - Email addresses
 * - Phone numbers
 * - User IDs
 * - Passwords
 * - OTP tokens
 *
 * Development: Logs to console for debugging
 * Production: Logs to Sentry (when configured)
 */

const isDevelopment = process.env.NODE_ENV === 'development'

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
 * @param data - The data object to mask
 * @param depth - Current recursion depth (max 3 to prevent deep recursion)
 * @returns Masked copy of the data
 */
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

/**
 * Client logger instance with development and production support
 */
export const clientLogger = {
  /**
   * Log debug information (development only)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined
      console.log(`[DEBUG] ${message}`, maskedContext)
    }
  },

  /**
   * Log informational messages
   */
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined
      console.info(`[INFO] ${message}`, maskedContext)
    }
  },

  /**
   * Log warning messages
   */
  warn: (message: string, context?: LogContext) => {
    const maskedContext = context ? maskSensitiveData(context) : undefined
    console.warn(`[WARN] ${message}`, maskedContext)

    // In production, send to Sentry (when configured)
    if (!isDevelopment && typeof window !== 'undefined') {
      try {
        if ((window as any).Sentry) {
          (window as any).Sentry.captureMessage(message, 'warning')
        }
      } catch {
        // Silently fail if Sentry not available
      }
    }
  },

  /**
   * Log error messages
   */
  error: (message: string, context?: LogContext | Error) => {
    const maskedContext = context instanceof Error ? context : (context ? maskSensitiveData(context) : undefined)
    console.error(`[ERROR] ${message}`, maskedContext)

    // In production, send to Sentry (when configured)
    if (!isDevelopment && typeof window !== 'undefined') {
      try {
        if ((window as any).Sentry) {
          (window as any).Sentry.captureException(context instanceof Error ? context : new Error(message))
        }
      } catch {
        // Silently fail if Sentry not available
      }
    }
  },

  /**
   * Log critical errors that need immediate attention
   */
  critical: (message: string, context?: LogContext | Error) => {
    const maskedContext = context instanceof Error ? context : (context ? maskSensitiveData(context) : undefined)
    console.error(`[CRITICAL] ${message}`, maskedContext)

    // Always send critical errors to Sentry
    if (typeof window !== 'undefined') {
      try {
        if ((window as any).Sentry) {
          (window as any).Sentry.captureException(
            context instanceof Error ? context : new Error(message),
            { level: 'fatal' }
          )
        }
      } catch {
        // Silently fail if Sentry not available
      }
    }
  },

  /**
   * Log success messages
   */
  success: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined
      console.log(`[SUCCESS] ${message}`, maskedContext)
    }
  },
}
