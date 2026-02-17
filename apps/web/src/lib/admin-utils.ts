/**
 * Admin and authentication utility functions
 * @internal - Server-side only
 */

import { createAdminClient, verifyAdminAuth } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { validateSupabaseAuthUsers } from "@/lib/validation/rpc-schemas";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import type { RateLimitConfig } from "@/lib/constants/rate-limits";

/**
 * Supabase Admin API User type wrapper
 * Uses flexible typing for compatibility with Supabase SDK
 * @internal
 */
export type SupabaseAuthUser = Record<string, unknown> & {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

/**
 * Fetch all auth users with pagination support
 * Handles unlimited users without memory overflow
 *
 * @param adminClient - Supabase admin client
 * @returns Array of all auth users across all pages
 */
export async function fetchAllAuthUsers(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
) {
  const allUsers: SupabaseAuthUser[] = [];
  let page = 1;
  const perPage = 1000;

  try {
    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        perPage,
        page,
      });

      if (error) {
        authLogger.error("[fetchAllAuthUsers] Error fetching auth users page", {
          page,
          error: error.message,
        });
        break;
      }

      if (!data?.users || data.users.length === 0) {
        break;
      }

      // Validate and type-check users from Supabase admin API
      try {
        const validatedUsers = validateSupabaseAuthUsers(data.users);
        allUsers.push(...validatedUsers);
      } catch (error) {
        authLogger.error("[fetchAllAuthUsers] Failed to validate users", {
          error: error instanceof Error ? error.message : String(error),
          page,
        });
        // Continue with next page instead of failing completely
        break;
      }

      // Break if we got fewer users than requested (reached end)
      if (data.users.length < perPage) {
        break;
      }

      page++;
    }

    return allUsers;
  } catch (error) {
    authLogger.error("[fetchAllAuthUsers] Unexpected error", error);
    return allUsers; // Return what we got so far
  }
}

/**
 * Find user by email with pagination support
 * Safely searches across all auth users
 *
 * @param adminClient - Supabase admin client
 * @param email - Email to search for (will be lowercased)
 * @returns User object or undefined if not found
 */
export async function findAuthUserByEmail(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  email: string,
) {
  const normalizedEmail = email.toLowerCase();
  const allUsers = await fetchAllAuthUsers(adminClient);
  return allUsers.find((u) => u.email?.toLowerCase() === normalizedEmail);
}

/**
 * Find user by ID using direct API call - O(1) instead of O(n)
 * PERFORMANCE: Uses getUserById directly instead of paginating all users
 *
 * @param adminClient - Supabase admin client
 * @param userId - User ID to search for
 * @returns User object or undefined if not found
 */
export async function findAuthUserById(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
): Promise<SupabaseAuthUser | undefined> {
  try {
    const { data, error } = await adminClient.auth.admin.getUserById(userId);
    if (error || !data.user) {
      // User not found is not an error worth logging at error level
      if (error && error.message !== "User not found") {
        authLogger.warn("[findAuthUserById] Error fetching user", {
          userId,
          error: error.message,
        });
      }
      return undefined;
    }

    // Convert to our flexible type
    const user = data.user;
    return {
      ...user,
      id: user.id,
      email: user.email,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    } as SupabaseAuthUser;
  } catch (error) {
    authLogger.error("[findAuthUserById] Unexpected error", error);
    return undefined;
  }
}

/**
 * Verify admin authentication and check rate limits in one call
 * Consolidates repeated auth + rate limit pattern across admin action files
 *
 * @param actionName - Name of action for logging (e.g., "getDashboardMetrics")
 * @param rateLimit - Rate limit configuration to check
 * @returns Object with authorization status, user, or error response
 *
 * @example
 * ```typescript
 * const authResult = await verifyAdminAuthAndRateLimit(
 *   "getDashboardMetrics",
 *   RATE_LIMITS.adminMetrics
 * );
 * if (!authResult.authorized) {
 *   return authResult.error;
 * }
 * // Now use authResult.user
 * ```
 */
export async function verifyAdminAuthAndRateLimit(
  actionName: string,
  rateLimit: RateLimitConfig,
) {

  // Step 1: Verify admin authorization
  const authCheck = await verifyAdminAuth(actionName);
  if (!authCheck.authorized) {
    return {
      authorized: false,
      error: authCheck.error,
    } as const;
  }

  // Step 2: Check rate limits
  const userId = authCheck.user.id;
  const rateLimitKey = `admin-${actionName}:${userId}`;
  const isAllowed = await checkRateLimit(rateLimitKey, rateLimit);

  if (!isAllowed) {
    authLogger.warn(`[${actionName}] Rate limit exceeded`, { userId });
    return {
      authorized: false,
      error: {
        success: false,
        error: "Too many requests. Please wait before trying again.",
      },
    } as const;
  }

  // Both auth and rate limit check passed
  return {
    authorized: true,
    user: authCheck.user,
  } as const;
}
