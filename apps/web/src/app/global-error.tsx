"use client";

// Global Error Handler for Next.js App Router
// This component catches unhandled errors in the root layout and reports them to Sentry
// NOTE: Uses CSS variables with fallbacks since this renders outside the theme provider

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Theme constants (fallbacks for when CSS variables aren't available)
// These match the Jyoti theme defined in globals.css
const THEME = {
  surface: "#FFFBF7", // --color-surface
  white: "#FFFFFF", // --color-white
  textPrimary: "#2D2A26", // --color-text-primary
  textSecondary: "#57534E", // --color-text-secondary
  textMuted: "#A8A29E", // --color-text-muted
  primary: "#F98819", // --color-primary
  primaryDark: "#E07510", // --color-primary-dark
  primaryLightest: "#FFF5EB", // --color-primary-lightest
} as const;

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Report error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorType: "global-error",
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: `var(--color-surface, ${THEME.surface})`,
          }}
        >
          <div
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "2rem",
              backgroundColor: `var(--color-white, ${THEME.white})`,
              borderRadius: "var(--radius-xl, 1.25rem)",
              boxShadow: "var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12))",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>😔</div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: `var(--color-text-primary, ${THEME.textPrimary})`,
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong!
            </h1>
            <p
              style={{
                color: `var(--color-text-secondary, ${THEME.textSecondary})`,
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
              }}
            >
              We apologize for the inconvenience. Our team has been notified and
              is working on a fix.
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: `var(--color-primary, ${THEME.primary})`,
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md, 0.75rem)",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = `var(--color-primary-dark, ${THEME.primaryDark})`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = `var(--color-primary-dark, ${THEME.primaryDark})`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = `var(--color-primary, ${THEME.primary})`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = `var(--color-primary, ${THEME.primary})`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => (globalThis.location.href = "/")}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "transparent",
                  color: `var(--color-primary, ${THEME.primary})`,
                  border: `2px solid var(--color-primary, ${THEME.primary})`,
                  borderRadius: "var(--radius-md, 0.75rem)",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = `var(--color-primary-lightest, ${THEME.primaryLightest})`;
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = `var(--color-primary-lightest, ${THEME.primaryLightest})`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Go Home
              </button>
            </div>

            {/* Error digest for debugging (only show in development) */}
            {process.env.NODE_ENV === "development" && error.digest && (
              <p
                style={{
                  marginTop: "1.5rem",
                  fontSize: "0.75rem",
                  color: `var(--color-text-muted, ${THEME.textMuted})`,
                  fontFamily: "monospace",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
