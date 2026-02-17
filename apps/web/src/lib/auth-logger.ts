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

import { maskSensitiveData, type LogContext } from "./masking-utils";
// DUP-8 FIX: Use shared Sentry types
import { getSentry } from "./types/sentry";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Helper: Log warning with Error object
 */
function logWarningError(message: string, error: Error): void {
  if (isDevelopment) {
    console.warn(`[AUTH:WARN] ${message}`, error);
  } else {
    // In production, log via structured logging service with error
    const sentry = getSentry();
    if (sentry) {
      sentry.captureException(error, { level: "warning" });
    }
  }
}

/**
 * Helper: Log warning with context object
 */
function logWarningContext(
  message: string,
  context?: LogContext,
): void {
  const maskedContext = context ? maskSensitiveData(context) : undefined;
  if (isDevelopment) {
    console.warn(`[AUTH:WARN] ${message}`, maskedContext);
  } else {
    // In production, suppress detailed context - use structured logging only
    const sentry = getSentry();
    if (sentry) {
      sentry.captureMessage(message, "warning");
    }
  }
}

/**
 * Auth-specific logger with sensitive data masking and console output
 */
export const authLogger = {
  /**
   * Development-only debug logs
   * @param message - The message to log
   * @param context - Optional context object (will be masked)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined;
      console.log(`[AUTH:DEBUG] ${message}`, maskedContext);
    }
  },

  /**
   * Info level logs (shown in development, masked in production)
   * @param message - The message to log
   * @param context - Optional context object (will be masked)
   */
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined;
      console.info(`[AUTH:INFO] ${message}`, maskedContext);
    } else {
      // In production, log via structured logging service (Sentry, DataDog, etc.)
      const sentry = getSentry();
      if (sentry) {
        sentry.captureMessage(message, "info");
      }
    }
  },

  /**
   * Warning level logs (always shown, masked in production)
   * REFACTORED: Reduced complexity from 16 to ~6 by extracting helper functions
   * @param message - The message to log
   * @param errorOrContext - Optional error or context object (will be masked)
   */
  warn: (message: string, errorOrContext?: Error | LogContext) => {
    if (errorOrContext instanceof Error) {
      logWarningError(message, errorOrContext);
    } else {
      logWarningContext(message, errorOrContext as LogContext);
    }
  },

  /**
   * Error level logs (always shown, masked in production)
   * CRITICAL: Never log sensitive data in production
   * @param message - The message to log
   * @param error - The error object (will be masked)
   * @param context - Optional additional context (will be masked)
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined;
      console.error(`[AUTH:ERROR] ${message}`, error, maskedContext);
    } else {
      // In production, only log message via structured logging service, suppress stack traces
      const sentry = getSentry();
      if (sentry) {
        sentry.captureException(
          error instanceof Error ? error : new Error(message),
          { tags: { source: "auth" } },
        );
      }
    }
  },

  /**
   * Critical errors that should always be logged
   * (but still masked in production)
   * @param message - The message to log
   * @param error - The error object (will be masked)
   */
  critical: (message: string, error?: unknown) => {
    // Log to console only in development to avoid exposing errors in production
    if (isDevelopment) {
      console.error(`[AUTH:CRITICAL] ${message}`, error);
    }

    // Always send to production error tracking service (Sentry handles masking)
    const sentry = getSentry();
    if (sentry) {
      sentry.captureException(
        error instanceof Error ? error : new Error(message),
        { level: "fatal", tags: { source: "auth" } },
      );
    }
  },

  /**
   * Success logs (development only)
   * @param message - The message to log
   * @param context - Optional context object (will be masked)
   */
  success: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined;
      console.log(`[AUTH:SUCCESS] ✓ ${message}`, maskedContext);
    }
  },
};
