"use server";

import { getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";

/**
 * Check if current user is an admin (admin or super_admin role)
 *
 * NOTE: This is a lightweight client-side authorization check.
 * For server actions that need full user data, use verifyAdminAuth() from supabase-server.ts.
 * This function is intentionally simpler for client-side use cases like conditional UI rendering.
 */
export async function checkAdminAuth(): Promise<{
  authorized: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { authorized: false, error: "Not authenticated" };
    }

    const userRole = user.app_metadata?.role;
    if (userRole === "admin" || userRole === "super_admin") {
      return { authorized: true };
    }

    return { authorized: false, error: "Admin access required" };
  } catch (error) {
    authLogger.error(
      "[checkAdminAuth] Error checking admin authorization",
      error,
    );
    return {
      authorized: false,
      error: "An error occurred while checking authorization",
    };
  }
}
