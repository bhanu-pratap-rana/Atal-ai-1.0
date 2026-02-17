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

import { maskSensitiveData, type LogContext } from "./masking-utils";
import { getMaskedContext } from "./form-utils";
// DUP-8 FIX: Use shared Sentry types
import { getSentry } from "./types/sentry";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Client logger instance with development and production support
 */
export const clientLogger = {
  /**
   * Log debug information (development only)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined;
      console.log(`[DEBUG] ${message}`, maskedContext);
    }
  },

  /**
   * Log informational messages
   */
  info: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined;
      console.info(`[INFO] ${message}`, maskedContext);
    }
  },

  /**
   * Log warning messages
   */
  warn: (message: string, context?: LogContext) => {
    const maskedContext = context ? maskSensitiveData(context) : undefined;
    console.warn(`[WARN] ${message}`, maskedContext);

    // In production, send to Sentry (when configured)
    if (!isDevelopment) {
      try {
        const sentry = getSentry();
        if (sentry) {
          sentry.captureMessage(message, "warning");
        }
      } catch (sentryError) {
        // Sentry initialization failed, but primary logging succeeded
        if (isDevelopment && sentryError instanceof Error) {
          console.debug("[ClientLogger] Sentry initialization failed:", sentryError.message);
        }
      }
    }
  },

  /**
   * Log error messages
   */
  error: (message: string, context?: LogContext | Error) => {
    const maskedContext = getMaskedContext(context, maskSensitiveData);
    console.error(`[ERROR] ${message}`, maskedContext);

    // In production, send to Sentry (when configured)
    if (!isDevelopment) {
      try {
        const sentry = getSentry();
        if (sentry) {
          sentry.captureException(
            context instanceof Error ? context : new Error(message),
          );
        }
      } catch (sentryError) {
        // Sentry initialization failed, but primary logging succeeded
        if (isDevelopment && sentryError instanceof Error) {
          console.debug("[ClientLogger] Sentry initialization failed:", sentryError.message);
        }
      }
    }
  },

  /**
   * Log critical errors that need immediate attention
   */
  critical: (message: string, context?: LogContext | Error) => {
    const maskedContext = getMaskedContext(context, maskSensitiveData);
    console.error(`[CRITICAL] ${message}`, maskedContext);

    // Always send critical errors to Sentry
    try {
      const sentry = getSentry();
      if (sentry) {
        sentry.captureException(
          context instanceof Error ? context : new Error(message),
          { level: "fatal" },
        );
      }
    } catch (sentryError) {
      // Sentry initialization failed, but critical message already logged to console
      if (isDevelopment && sentryError instanceof Error) {
        console.debug("[ClientLogger] Sentry initialization failed for critical:", sentryError.message);
      }
    }
  },

  /**
   * Log success messages
   */
  success: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const maskedContext = context ? maskSensitiveData(context) : undefined;
      console.log(`[SUCCESS] ${message}`, maskedContext);
    }
  },
};
