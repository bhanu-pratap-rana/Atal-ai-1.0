/**
 * API Route Utilities
 *
 * Shared helpers for authentication, rate limiting, and request validation
 * across all API routes. Reduces boilerplate and ensures consistent behavior.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import type { RateLimitConfig } from "@/lib/constants/rate-limits";
import { authLogger } from "@/lib/auth-logger";

/**
 * Authenticate user and check rate limit in one call.
 *
 * @param rateLimitKeyFn - Function that takes userId and returns the rate limit key
 * @param rateLimitConfig - Rate limit configuration from RATE_LIMITS
 * @returns User object on success, or NextResponse error (401/429)
 *
 * @example
 * ```ts
 * const result = await authenticateAndRateLimit(
 *   (userId) => `lesson:download:${userId}`,
 *   RATE_LIMITS.lessonGeneration,
 * );
 * if (result instanceof NextResponse) return result;
 * const { user } = result;
 * ```
 */
export async function authenticateAndRateLimit(
  rateLimitKeyFn: (userId: string) => string,
  rateLimitConfig: RateLimitConfig,
): Promise<{ user: User } | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAllowed = await checkRateLimit(rateLimitKeyFn(user.id), rateLimitConfig);
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 },
    );
  }

  return { user };
}

/**
 * Validate request body against a Zod schema.
 *
 * @returns Validated data on success, or NextResponse 400 error
 *
 * @example
 * ```ts
 * const result = validateRequestBody(body, MySchema);
 * if (result instanceof NextResponse) return result;
 * const { data } = result;
 * ```
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
): { data: T } | NextResponse {
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message || "Invalid request" },
      { status: 400 },
    );
  }
  return { data: validation.data };
}

/**
 * Extract the correlation ID from the request (set by proxy middleware).
 * Falls back to generating a new ID if not present.
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

/**
 * Log an API request with structured context including correlation ID.
 *
 * @example
 * ```ts
 * const requestId = getRequestId(request);
 * logApiRequest("tutor/chat", request.method, requestId, user.id);
 * // ... process request ...
 * logApiResponse("tutor/chat", 200, requestId, startTime);
 * ```
 */
export function logApiRequest(
  route: string,
  method: string,
  requestId: string,
  userId?: string,
): void {
  authLogger.info(`[API] ${method} /api/${route}`, {
    requestId,
    userId,
  });
}

/**
 * Log an API response with duration.
 */
export function logApiResponse(
  route: string,
  status: number,
  requestId: string,
  startTime: number,
): void {
  const durationMs = Date.now() - startTime;
  authLogger.info(`[API] ${status} /api/${route} (${durationMs}ms)`, {
    requestId,
    status,
    durationMs,
  });
}
