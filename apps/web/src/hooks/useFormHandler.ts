/**
 * useFormHandler Hook
 *
 * Eliminates 130+ duplicate useState patterns across 18+ components.
 * Provides consistent form state management (loading, error, message).
 *
 * Rule.md Compliance:
 * - DRY: Single source of truth for form state logic
 * - Consistent state management patterns
 * - Type-safe component state
 * - Reusable across all form components
 *
 * Usage:
 * const { loading, error, message, setLoading, setError, setMessage, reset } = useFormHandler()
 */

"use client";

import { useCallback, useState } from "react";

/**
 * Message types for form feedback
 */
export type MessageType = "success" | "error" | "info" | "warning";

/**
 * Form message structure
 */
export interface FormMessage {
  type: MessageType;
  text: string;
}

/**
 * Return type for useFormHandler hook
 */
export interface UseFormHandlerReturn {
  loading: boolean;
  error: string | null;
  message: FormMessage | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMessage: (message: FormMessage | null) => void;
  clearMessages: () => void;
  reset: () => void;
  showSuccess: (text: string) => void;
  showError: (text: string) => void;
  showInfo: (text: string) => void;
}

/**
 * Custom hook for managing form state (loading, error, message)
 *
 * @param initialLoading - Initial loading state (default: false)
 * @returns Form state and handlers
 */
export function useFormHandler(initialLoading = false): UseFormHandlerReturn {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<FormMessage | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setMessage(null);
  }, []);

  const showSuccess = useCallback((text: string) => {
    setMessage({ type: "success", text });
    setError(null);
  }, []);

  const showError = useCallback((text: string) => {
    setMessage({ type: "error", text });
    setError(text);
  }, []);

  const showInfo = useCallback((text: string) => {
    setMessage({ type: "info", text });
    setError(null);
  }, []);

  return {
    loading,
    error,
    message,
    setLoading,
    setError,
    setMessage,
    clearMessages,
    reset,
    showSuccess,
    showError,
    showInfo,
  };
}
