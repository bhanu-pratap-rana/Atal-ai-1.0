/**
 * Shared Sentry Types
 *
 * DUP-8 FIX: Extracted from auth-logger.ts and client-logger.ts
 * to eliminate duplication of WindowWithSentry interface.
 */

export interface WindowWithSentry extends Window {
  Sentry?: {
    captureMessage: (message: string, level: string) => void;
    captureException: (
      error: Error,
      options?: { level?: string; tags?: Record<string, string> },
    ) => void;
  };
}

export function getSentry(): WindowWithSentry["Sentry"] | undefined {
  if (typeof globalThis === "undefined") return undefined;
  const windowWithSentry = globalThis as unknown as WindowWithSentry;
  return windowWithSentry.Sentry;
}
