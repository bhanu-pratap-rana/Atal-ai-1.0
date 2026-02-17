/**
 * Reusable form error display component
 * Eliminates 13+ instances of repeated error rendering pattern in auth pages
 *
 * Before:
 * {state.signinEmailError && (
 *   <p className="text-sm text-error">{state.signinEmailError}</p>
 * )}
 *
 * After:
 * <FormError error={state.signinEmailError} />
 */

import type { ReactNode } from "react";

export interface FormErrorProps {
  /** Error message to display (null/undefined to hide) */
  readonly error?: string | null;
  /** Additional CSS classes to apply */
  readonly className?: string;
  /** Custom error icon or prefix */
  readonly icon?: ReactNode;
  /** If true, shows a dismissible close button */
  readonly dismissible?: boolean;
  /** Called when close button is clicked */
  readonly onDismiss?: () => void;
  /** Test ID for testing */
  readonly testId?: string;
}

/**
 * Displays form validation errors consistently across the app
 *
 * @example
 * ```typescript
 * // Simple usage
 * <FormError error={emailError} />
 *
 * // With dismissible button
 * <FormError error={emailError} dismissible onDismiss={() => setEmailError(null)} />
 *
 * // Custom styling
 * <FormError error={emailError} className="my-2" />
 *
 * // With custom icon
 * <FormError error={emailError} icon="⚠️" />
 * ```
 */
export function FormError({
  error,
  className = "",
  icon,
  dismissible = false,
  onDismiss,
  testId,
}: FormErrorProps) {
  // Don't render if no error
  if (!error) {
    return null;
  }

  const defaultClassName = "text-sm text-error mt-1";
  const combinedClassName = className
    ? `${defaultClassName} ${className}`
    : defaultClassName;

  return (
    <div
      className={`flex items-center gap-2 ${combinedClassName}`}
      role="alert"
      aria-live="polite"
      data-testid={testId}
    >
      {icon === undefined ? (
        <span className="text-base leading-none">⚠️</span>
      ) : (
        icon
      )}
      <p className="flex-1">{error}</p>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="text-error hover:text-error-dark transition flex-shrink-0 ml-2"
          type="button"
          aria-label="Dismiss error"
          title="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * Form error with suggestion (used for email typo suggestions)
 *
 * @example
 * ```typescript
 * <FormErrorWithSuggestion
 *   error={emailError}
 *   suggestion="Did you mean john@gmail.com?"
 *   onSuggestionClick={() => setEmail('john@gmail.com')}
 * />
 * ```
 */
export interface FormErrorWithSuggestionProps extends FormErrorProps {
  /** Suggestion text to display below error */
  readonly suggestion?: string | null;
  /** Called when suggestion button is clicked */
  readonly onSuggestionClick?: () => void;
  /** Label for suggestion button */
  readonly suggestionLabel?: string;
}

export function FormErrorWithSuggestion({
  error,
  suggestion,
  onSuggestionClick,
  suggestionLabel = "Use suggestion",
  ...props
}: FormErrorWithSuggestionProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="space-y-2">
      <FormError error={error} {...props} />
      {suggestion && onSuggestionClick && (
        <button
          onClick={onSuggestionClick}
          className="text-xs text-primary hover:text-primary-dark underline transition"
          type="button"
        >
          {suggestionLabel}: {suggestion}
        </button>
      )}
    </div>
  );
}

/**
 * Form error with fade animation
 * Useful for error messages that should animate in/out
 */
export interface FormErrorWithAnimationProps extends FormErrorProps {
  /** If true, shows with fade animation */
  readonly animated?: boolean;
}

export function FormErrorAnimated({
  error,
  animated = true,
  className = "",
  ...props
}: FormErrorWithAnimationProps) {
  const animationClass =
    animated && error
      ? "animate-in fade-in duration-200"
      : "animate-out fade-out duration-200";

  return (
    <div className={animationClass}>
      <FormError error={error} className={className} {...props} />
    </div>
  );
}

/**
 * Multiple form errors display
 * Useful when a field has multiple validation errors
 *
 * @example
 * ```typescript
 * <FormErrorList errors={passwordErrors} title="Password requirements:" />
 * ```
 */
export interface FormErrorListProps {
  /** Array of error messages */
  readonly errors?: string[] | null;
  /** Title/header for the error list */
  readonly title?: string;
  /** Additional CSS classes */
  readonly className?: string;
  /** Test ID for testing */
  readonly testId?: string;
}

export function FormErrorList({
  errors,
  title,
  className = "",
  testId,
}: FormErrorListProps) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div
      className={`text-sm text-error space-y-1 ${className}`}
      role="alert"
      aria-live="polite"
      data-testid={testId}
    >
      {title && <p className="font-medium">{title}</p>}
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
