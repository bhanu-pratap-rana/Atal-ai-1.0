/**
 * Form utility functions for common patterns
 * Reduces duplication across form components
 *
 * CLEANUP: Removed unused exports (Phase 5 code quality scan):
 * - getConfidenceLevel: Duplicate of thresholds.ts - use getConfidenceLevel from there
 * - createErrorHandler: Never imported by any consumer
 * - createFieldResetters: Never imported by any consumer
 * - parseApiError: Never imported by any consumer
 */

/**
 * Get the aria-describedby ID for form inputs based on error/helper text priority
 * Error messages take priority over helper text
 */
export function getInputDescriptionId(
  fieldId: string,
  error?: string,
  helperText?: string,
): string | undefined {
  if (error) return `${fieldId}-error`;
  if (helperText) return `${fieldId}-helper`;
  return undefined;
}

/**
 * Get language label for AI service prompts
 * Maps language codes to display names
 */
export function getLanguageLabelForAI(language: string): string {
  if (language === "hi") return "Hindi";
  if (language === "as") return "Assamese";
  return "English";
}

/**
 * Get masked context for error logging
 * Handles type checking and conditional data masking
 */
export function getMaskedContext(
  context: unknown,
  maskFn?: (data: unknown) => unknown,
): unknown {
  if (context instanceof Error) return context;
  if (context && maskFn) return maskFn(context);
  return undefined;
}
