"use server";

import { createAdminClient, verifySuperAdminAuth } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkAdminOperationRateLimit } from "@/lib/rate-limiter-distributed";
import { isAdmin } from "@/lib/auth/role-utils";
import { AdminEmailSchema } from "@/lib/validation-schemas";
import { findAuthUserByEmail } from "@/lib/admin-utils";
import { validateInput, handleActionError } from "./action-utils";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

export interface SetAdminRoleResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Set admin role for an existing user by email
 * SECURITY: Requires super_admin role
 *
 * Note: For creating new admin accounts with password, use createAdminAccount from admin-management.ts
 * This function is for promoting existing users to admin role (used by setup page).
 */
export async function setAdminRole(email: string): Promise<SetAdminRoleResult> {
  try {
    // Validate email input
    const validation = validateInput(email, AdminEmailSchema);
    if (!validation.success || !validation.data) {
      return { success: false, error: validation.error ?? "Invalid input" };
    }
    const normalizedEmail = validation.data;

    // SECURITY: Verify caller is authenticated and authorized as super_admin
    const auth = await verifySuperAdminAuth("setAdminRole");
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Rate limit admin operations to prevent abuse
    const roleChangeAllowed = await checkAdminOperationRateLimit(auth.user.id);
    if (!roleChangeAllowed) {
      authLogger.warn("[setAdminRole] Rate limit exceeded", {
        userId: auth.user.id,
      });
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const adminClient = await createAdminClient();

    // Find user by email (with pagination support for large user bases)
    const user = await findAuthUserByEmail(adminClient, normalizedEmail);

    if (!user) {
      authLogger.warn("[setAdminRole] User not found", {
        email: normalizedEmail,
      });
      return {
        success: false,
        error: `User with email ${email} not found`,
      };
    }

    // Check if already admin
    const existingRole = user.app_metadata?.role as
      | string
      | null
      | undefined;
    if (isAdmin(existingRole)) {
      return {
        success: true,
        message: `User ${email} already has ${existingRole} role`,
      };
    }

    // Update user with admin role
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          ...user.app_metadata,
          role: "admin",
        },
      },
    );

    if (updateError) {
      authLogger.error("[setAdminRole] Failed to update user", updateError);
      return {
        success: false,
        error: "Failed to set admin role",
      };
    }

    authLogger.success("[setAdminRole] Admin role set successfully", {
      email: normalizedEmail,
    });
    return {
      success: true,
      message: `Admin role successfully set for ${email}`,
    };
  } catch (error) {
    return handleActionError("setAdminRole", error);
  }
}

/**
 * Check if user has admin role
 * Lightweight check that doesn't require full admin operations
 */
export async function checkAdminRoleByEmail(email: string): Promise<{
  hasAdminRole: boolean;
  error?: string;
}> {
  try {
    // Validate email input
    const validation = validateInput(email, AdminEmailSchema);
    if (!validation.success || !validation.data) {
      return { hasAdminRole: false, error: validation.error ?? "Invalid input" };
    }
    const normalizedEmail = validation.data;

    // SECURITY: Require authentication to prevent email enumeration
    const auth = await verifySuperAdminAuth("checkAdminRoleByEmail");
    if (!auth.authorized) {
      return { hasAdminRole: false, error: "Authentication required" };
    }

    // SECURITY: Rate limit admin operations to prevent abuse
    const roleLookupAllowed = await checkAdminOperationRateLimit(
      auth.user.id,
    );
    if (!roleLookupAllowed) {
      authLogger.warn("[checkAdminRoleByEmail] Rate limit exceeded", {
        email: normalizedEmail,
      });
      return {
        hasAdminRole: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const adminClient = await createAdminClient();

    // Find user by email (with pagination support for large user bases)
    const user = await findAuthUserByEmail(adminClient, normalizedEmail);

    if (!user) {
      return { hasAdminRole: false, error: "User not found" };
    }

    const role = user.app_metadata?.role as string | null | undefined;
    return { hasAdminRole: isAdmin(role) };
  } catch (error) {
    authLogger.error("[checkAdminRoleByEmail] Error", error);
    return { hasAdminRole: false, error: "Failed to check role" };
  }
}
