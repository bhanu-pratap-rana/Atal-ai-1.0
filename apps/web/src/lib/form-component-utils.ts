/**
 * Shared utilities and types for form components
 * Consolidates duplicated patterns from OTP and password form components
 */

import React, { useCallback } from "react";
import { authLogger } from "@/lib/auth-logger";

/**
 * Base props interface for all OTP/password form components
 * Eliminates 32+ lines of duplicated prop definitions
 */
export interface BaseFormComponentProps {
  readonly isLoading: boolean;
  readonly error?: string;
  readonly onErrorChange: (error: string | null) => void;
  readonly submitButtonLabel?: string;
}

/**
 * Custom hook for handling form submission with standardized error handling
 * Eliminates 80+ lines of duplicated try/catch blocks across form components
 */
export function useFormSubmission<T>(
  onSubmitFn: () => Promise<T>,
  onErrorChange: (error: string | null) => void,
  loggerContext: string,
  onSuccess?: (data: T) => void,
) {
  return useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      onErrorChange(null);

      try {
        authLogger.debug(`[${loggerContext}] Submitting form`);
        const result = await onSubmitFn();
        authLogger.success(`[${loggerContext}] Form submission successful`);
        onSuccess?.(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        authLogger.error(`[${loggerContext}] Form submission failed`, error);
        onErrorChange(errorMessage);
      }
    },
    [onSubmitFn, onErrorChange, loggerContext, onSuccess],
  );
}

/**
 * Custom hook for managing password field visibility toggle
 * Eliminates 8+ lines of duplicated useState calls in password components
 */
export function usePasswordVisibility() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmVisibility = useCallback(() => {
    setShowConfirm((prev) => !prev);
  }, []);

  return {
    showPassword,
    showConfirm,
    togglePasswordVisibility,
    toggleConfirmVisibility,
  };
}

/**
 * Utility for toast notification messages
 * Consolidates repeated toast pattern across form components
 */
export const FORM_TOAST_MESSAGES = {
  EMAIL_OTP_SENT: "OTP sent to your email!",
  EMAIL_OTP_ERROR: "Failed to send OTP. Please try again.",
  PHONE_OTP_SENT: "OTP sent to your phone!",
  PHONE_OTP_ERROR: "Failed to send OTP. Please try again.",
  OTP_VERIFIED: "OTP verified successfully!",
  OTP_VERIFICATION_ERROR: "Invalid OTP. Please try again.",
  PASSWORD_RESET: "Password reset successfully!",
  PASSWORD_RESET_ERROR: "Failed to reset password. Please try again.",
  PASSWORD_UPDATED: "Password updated successfully!",
  PASSWORD_UPDATE_ERROR: "Failed to update password. Please try again.",
};

/**
 * Type for validation result from validation functions
 * Standardizes validation response pattern
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
