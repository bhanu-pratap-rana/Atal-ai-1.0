"use client";

/**
 * DialogContainer Component
 *
 * Eliminates 40+ duplicate dialog implementations across admin components.
 * Provides consistent dialog/modal styling with overlay, header, content, and actions.
 * Uses native <dialog> element for better accessibility (S6819 compliance).
 *
 * A11Y-001 FIX: Added focus trap to prevent keyboard focus from escaping the modal.
 *
 * Rule.md Compliance:
 * - Centralized dialog patterns
 * - Consistent Tailwind styling
 * - Proper accessibility (native <dialog> element + focus trap)
 * - Reusable across all admin dialogs
 */

import { ReactNode, useEffect, useRef, useCallback } from "react";

interface DialogContainerProps {
  readonly open: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

// Focusable element selector for focus trap
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function DialogContainer({
  open,
  title,
  children,
  onClose,
  className = "",
  size = "md",
}: DialogContainerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // A11Y-001 FIX: Focus trap handler for Tab key navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift+Tab from first element -> go to last element
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // Tab from last element -> go to first element
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      // Store the currently focused element to restore later
      previousActiveElement.current = document.activeElement as HTMLElement;
      dialog.showModal();
      // Focus the first focusable element in the dialog
      const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    } else {
      dialog.close();
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [open]);

  // Handle ESC key, backdrop click, and focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    const handleClick = (e: MouseEvent) => {
      // Close when clicking the backdrop (dialog element itself, not content)
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, handleKeyDown]);

  return (
    <dialog
      ref={dialogRef}
      className={`
        bg-white rounded-lg shadow-lg p-6 w-full mx-4
        backdrop:bg-black/50
        ${sizeClasses[size]}
        ${className}
      `}
      aria-labelledby="dialog-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          id="dialog-title"
          className="text-lg font-semibold text-text-primary"
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close dialog"
        >
          <span className="text-2xl">×</span>
        </button>
      </div>

      {/* Content */}
      {children}
    </dialog>
  );
}
