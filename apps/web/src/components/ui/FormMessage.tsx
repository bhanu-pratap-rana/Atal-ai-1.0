/**
 * FormMessage Component
 *
 * Eliminates 50+ duplicate form message implementations across components.
 * Provides consistent error/success message display with proper styling.
 *
 * Rule.md Compliance:
 * - Centralized message UI logic
 * - Consistent Tailwind styling across all forms
 * - Proper accessibility (ARIA roles)
 * - Type-safe message types
 */

import { MessageType } from "@/hooks/useFormHandler";

interface FormMessageProps {
  readonly type: MessageType;
  readonly text: string;
  readonly onClose?: () => void;
  readonly className?: string;
}

const messageStyles: Record<
  MessageType,
  { bg: string; text: string; border: string; icon: string }
> = {
  success: {
    bg: "bg-success/10",
    text: "text-success-dark",
    border: "border-success/30",
    icon: "✓",
  },
  error: {
    bg: "bg-error/10",
    text: "text-error",
    border: "border-error/30",
    icon: "✕",
  },
  info: {
    bg: "bg-info/10",
    text: "text-info-dark",
    border: "border-info/30",
    icon: "ℹ",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning-dark",
    border: "border-warning/30",
    icon: "⚠",
  },
};

export function FormMessage({
  type,
  text,
  onClose,
  className = "",
}: FormMessageProps) {
  const styles = messageStyles[type];

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 p-3 rounded-lg border-l-4
        ${styles.bg} ${styles.border} ${styles.text}
        ${className}
      `}
    >
      <span className="flex-shrink-0 text-lg font-bold">{styles.icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{text}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-lg opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close message"
        >
          ×
        </button>
      )}
    </div>
  );
}
