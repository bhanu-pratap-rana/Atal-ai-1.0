"use client";

/**
 * Global Error Boundary
 *
 * Catches all unhandled errors in the application.
 * Provides a generic fallback UI with recovery options.
 */

import React from "react";
import Link from "next/link";
import { clientLogger } from "@/lib/client-logger";

interface Props {
  readonly children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    clientLogger.error("[Global] Unhandled component error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    globalThis.location?.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center" role="alert" aria-labelledby="global-error-heading">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">😕</span>
            </div>

            {/* Error Message */}
            <h1 id="global-error-heading" className="text-3xl font-bold text-text-primary mb-3">
              Something Went Wrong
            </h1>
            <p className="text-text-secondary mb-8">
              We encountered an unexpected error. Don&apos;t worry, your data is
              safe. Please try reloading the page or go back to the dashboard.
            </p>

            {/* Error Details (collapsed by default) */}
            {this.state.error && (
              <details className="text-left mb-8 p-4 bg-surface rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-text-secondary mb-2">
                  Error Details
                </summary>
                <pre className="text-xs text-error overflow-auto max-h-40">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              >
                Reload Page
              </button>
              <Link
                href="/app/dashboard"
                className="flex-1 px-6 py-3 bg-white text-text-secondary border-2 border-border rounded-lg hover:bg-surface-dark transition-colors font-medium inline-flex items-center justify-center"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Support Link */}
            <div className="pt-6 border-t border-border">
              <p className="text-sm text-text-secondary mb-2">Need help?</p>
              <Link
                href="/app/settings"
                className="text-primary hover:underline text-sm font-medium"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
