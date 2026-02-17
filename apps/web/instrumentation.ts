// Next.js Instrumentation File
// This file is used to register instrumentation for the Next.js runtime
// It loads the appropriate Sentry config based on the runtime environment

import * as Sentry from '@sentry/nextjs'

export async function register() {
  // Load server config for Node.js runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  // Load edge config for Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Capture React Server Component errors in Next.js 15+
export const onRequestError = Sentry.captureRequestError
