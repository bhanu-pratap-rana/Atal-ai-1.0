/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * Implements secure CORS headers for API routes.
 * Only allows same-origin requests or explicitly whitelisted origins.
 *
 * SECURITY: In production, NEXT_PUBLIC_PRODUCTION_URL must be defined
 * to prevent CORS misconfiguration vulnerabilities
 */

// Build allowed origins list with production validation
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Development/default origin
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  origins.push(appUrl);

  // Production domain - REQUIRED in production
  const prodUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL;
  if (prodUrl) {
    origins.push(prodUrl);
  } else if (process.env.NODE_ENV === "production") {
    // SECURITY: Fail hard if production domain not configured
    throw new Error(
      "NEXT_PUBLIC_PRODUCTION_URL environment variable must be set in production. " +
        "This is required for secure CORS configuration.",
    );
  }

  return origins;
}

const ALLOWED_ORIGINS = getAllowedOrigins();

export interface CORSOptions {
  origin?: string;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Validates if origin is allowed
 */
export function isOriginAllowed(origin: string | undefined | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Creates CORS headers for a response
 */
export function createCORSHeaders(
  origin: string | undefined | null,
  options: CORSOptions = {},
): Record<string, string> {
  const {
    methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization", "Accept"],
    exposedHeaders = ["Content-Length", "Content-Range"],
    credentials = true,
    maxAge = 86400, // 24 hours
  } = options;

  const headers: Record<string, string> = {};

  // Only set CORS headers if origin is allowed
  if (isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
    headers["Access-Control-Allow-Methods"] = methods.join(", ");
    headers["Access-Control-Allow-Headers"] = allowedHeaders.join(", ");
    headers["Access-Control-Expose-Headers"] = exposedHeaders.join(", ");

    if (credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    headers["Access-Control-Max-Age"] = maxAge.toString();
  }

  // Security headers
  headers["Vary"] = "Origin";

  return headers;
}

/**
 * Handles CORS preflight requests (OPTIONS)
 */
export function handleCORSPreflight(
  request: Request,
  options: CORSOptions = {},
): Response {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: createCORSHeaders(origin, options),
    });
  }

  // For non-OPTIONS requests, return 405 if method not allowed
  return new Response("Method Not Allowed", {
    status: 405,
    headers: createCORSHeaders(origin, options),
  });
}

/**
 * Middleware to add CORS headers to API responses
 * Usage in API route:
 *
 * export async function GET(request: Request) {
 *   const origin = request.headers.get('origin');
 *
 *   // Handle preflight
 *   if (request.method === 'OPTIONS') {
 *     return handleCORSPreflight(request);
 *   }
 *
 *   // Your API logic
 *   const response = new Response(JSON.stringify(data), { status: 200 });
 *
 *   // Add CORS headers
 *   const corsHeaders = createCORSHeaders(origin);
 *   Object.entries(corsHeaders).forEach(([key, value]) => {
 *     response.headers.set(key, value);
 *   });
 *
 *   return response;
 * }
 */
