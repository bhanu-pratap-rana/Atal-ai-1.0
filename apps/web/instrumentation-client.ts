// Sentry Client-Side Instrumentation
// This file initializes Sentry for client-side error tracking and performance monitoring

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development'
const SENTRY_SAMPLE_RATE = parseFloat(process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE || '0.1')

// Only initialize Sentry if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: SENTRY_ENVIRONMENT,

    // Performance Monitoring
    // Capture 10% of transactions for performance monitoring in production
    // Set to 1.0 in development for more visibility
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? SENTRY_SAMPLE_RATE : 1.0,

    // Session Replay Configuration
    // Capture 10% of all sessions for replay
    // Capture 100% of sessions with errors
    replaysSessionSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    // Debug mode for development
    debug: SENTRY_ENVIRONMENT === 'development',

    // Integrations
    integrations: [
      // Session Replay for debugging user issues
      Sentry.replayIntegration({
        maskAllText: true, // Privacy: mask all text by default
        blockAllMedia: true, // Privacy: block media by default
      }),
    ],

    // Filter out known non-critical errors
    beforeSend(event, _hint) {
      // Ignore ResizeObserver errors (common browser noise)
      if (event.message?.includes('ResizeObserver')) {
        return null
      }

      // Ignore network errors that are expected (offline, etc.)
      if (event.message?.includes('Failed to fetch') && !navigator.onLine) {
        return null
      }

      // Ignore cancelled requests
      if (event.message?.includes('AbortError')) {
        return null
      }

      return event
    },

    // Additional context for debugging
    initialScope: {
      tags: {
        app: 'atal-ai',
        platform: 'web',
      },
    },
  })
}

// Export router transition capture for Next.js App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
