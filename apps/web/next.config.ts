import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// NOTE: next-pwa v5.6.0 removed — generates middleware incompatible with Next.js 16 edge runtime
// causing MIDDLEWARE_INVOCATION_FAILED on Vercel. Even with disable:true, the wrapper still
// injects middleware code. TODO: Migrate to @ducanh2912/next-pwa or serwist for Next.js 16 support

const nextConfig: NextConfig = {
  // Next.js 16 has Turbopack enabled by default
  // Empty turbopack config silences the webpack/turbopack conflict warning
  // This allows the build to proceed while Sentry uses its webpack plugin
  turbopack: {},

  // Next.js 16 has instrumentation enabled by default
  // No experimental flags needed for Sentry integration

  // Image optimization configuration
  // Allow images from Supabase storage (lesson-assets bucket)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hnlsqznoviwnyrkskfay.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // Optimize package imports for faster builds and smaller bundles
  // Per Vercel React Best Practices: https://vercel.com/blog/introducing-react-best-practices
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-slot',
      'sonner',
      'date-fns',
    ],
  },

  // Security headers configuration (disabled in development for hot reload)
  async headers() {
    // Skip CSP in development - Next.js needs inline scripts for hot reload
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy - prevent XSS and injection attacks
          // Note: 'unsafe-inline' for style-src is acceptable with proper Content-Type
          // 'unsafe-inline' for script-src is required because Next.js injects inline <script>
          // tags for hydration data, route manifests, and chunk loading even in production builds
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Script src: self + unsafe-inline (required for Next.js hydration scripts)
              "script-src 'self' 'unsafe-inline' fonts.googleapis.com",
              // Style src: self + unsafe-inline for Tailwind/CSS-in-JS generated styles
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co",
              // Restrict connections to known API domains only
              "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://api.groq.com https://texttospeech.googleapis.com https://*.aiplatform.googleapis.com https://*.ingest.sentry.io wss://*.supabase.co",
              // No embedding in iframes
              "frame-ancestors 'self'",
              // Form submissions only to same origin
              "form-action 'self'",
              // Base URI restricted to prevent injection
              "base-uri 'self'",
              // Prevent object/embed elements (Flash, Java, etc.)
              "object-src 'none'",
              // Frame src for embedded iframes
              "frame-src 'self'",
              // Upgrade insecure requests to HTTPS
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Enable XSS filter in older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // HTTP Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Referrer Policy - privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy - control browser features
          {
            key: 'Permissions-Policy',
            value: [
              'accelerometer=()',
              'camera=()',
              'geolocation=()',
              'gyroscope=()',
              'magnetometer=()',
              'microphone=(self)',
              'payment=()',
              'usb=()'
            ].join(', ')
          },
          // Disable caching for sensitive content
          {
            key: 'Cache-Control',
            value: 'private, no-cache, must-revalidate'
          }
        ],
      }
    ]
  }
}

// Export config with Sentry wrapper (only if Sentry is configured)
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      // For all available options, see:
      // https://www.npmjs.com/package/@sentry/webpack-plugin#options

      org: process.env.SENTRY_ORG || "atal-ai",
      project: process.env.SENTRY_PROJECT || "javascript-nextjs",

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // Upload a larger set of source maps for prettier stack traces
      widenClientFileUpload: true,

      // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
      tunnelRoute: "/monitoring",

      // Webpack plugin options
      webpack: {
        // Automatically tree-shake Sentry logger statements to reduce bundle size
        treeshake: {
          removeDebugLogging: true,
        },
        // Enables automatic instrumentation of Vercel Cron Monitors
        automaticVercelMonitors: true,
      },
    })
  : nextConfig;