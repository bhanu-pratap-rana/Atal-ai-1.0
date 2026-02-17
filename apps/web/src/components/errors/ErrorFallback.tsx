"use client";

/**
 * Shared Error Fallback Component
 *
 * Used by Next.js route-level error.tsx boundaries.
 * Provides a consistent error UI with retry and navigation options.
 */

import Link from "next/link";
import { clientLogger } from "@/lib/client-logger";

interface ErrorFallbackProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  readonly context?: string;
}

export function ErrorFallback({ error, reset, context }: ErrorFallbackProps) {
  clientLogger.error(`[ErrorBoundary:${context || "unknown"}] Caught error`, {
    message: error.message,
    digest: error.digest,
  });

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl" role="img" aria-label="Error">!</span>
        </div>

        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-text-secondary mb-6 text-sm">
          An error occurred while loading this page. Your data is safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
          <Link
            href="/app/dashboard"
            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium inline-flex items-center justify-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
