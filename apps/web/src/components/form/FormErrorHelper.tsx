"use client";

/**
 * Reusable FormErrorHelper component
 * Consolidates error/helper text pattern used in 4+ form components
 * Eliminates 40+ lines of duplicated error message rendering
 */

interface FormErrorHelperProps {
  readonly error?: string;
  readonly helperText?: string;
  readonly errorId: string;
  readonly helperId: string;
}

export function FormErrorHelper({
  error,
  helperText,
  errorId,
  helperId,
}: FormErrorHelperProps) {
  if (error) {
    return (
      <p id={errorId} className="text-sm text-error" role="alert">
        {error}
      </p>
    );
  }

  if (helperText) {
    return (
      <p id={helperId} className="text-xs text-text-secondary">
        {helperText}
      </p>
    );
  }

  return null;
}
