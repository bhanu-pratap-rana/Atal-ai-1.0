"use server";

import { createAdminClient, verifySuperAdminAuth } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { isAdmin } from "@/lib/auth/role-utils";
import {
  AdminEmailSchema,
  AdminPasswordSchema,
} from "@/lib/validation-schemas";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { checkRateLimit as checkDistributedRateLimit } from "@/lib/rate-limiter-distributed";
import { validateInput, handleActionError } from "./action-utils";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";

export interface CreateAdminUserResult {
  success: boolean;
  error?: string;
  message?: string;
  userId?: string;
}

export interface AdminExistsResult {
  exists: boolean;
  error?: string;
}

/**
 * Check if any admin user exists in the system
 * Used to determine if bootstrap mode is available
 */
export async function checkAdminExists(): Promise<AdminExistsResult> {
  try {
    const adminClient = await createAdminClient();
    const { data: users, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      authLogger.error("[checkAdminExists] Failed to list users", error);
      return { exists: true, error: "Failed to check admin status" }; // Fail closed
    }

    const hasAdmin = users?.users.some((u) => {
      const role = u.app_metadata?.role;
      return isAdmin(role);
    });

    return { exists: hasAdmin || false };
  } catch (error) {
    authLogger.error("[checkAdminExists] Unexpected error", error);
    return { exists: true, error: "Failed to check admin status" }; // Fail closed
  }
}

/**
 * Create a new admin user account (BOOTSTRAP ONLY)
 *
 * SECURITY:
 * - If NO admin exists: Allows creation (first-time bootstrap)
 * - If admin exists: Requires super_admin authentication
 * - Rate limited to prevent brute force
 * - Input validated with Zod schemas
 */
export async function createAdminUser(
  email: string,
  password: string,
): Promise<CreateAdminUserResult> {
  try {
    // Validate inputs using Zod schemas
    const emailValidation = validateInput(email, AdminEmailSchema);
    if (!emailValidation.success || !emailValidation.data) {
      return { success: false, error: emailValidation.error ?? "Invalid input" };
    }
    const normalizedEmail = emailValidation.data;

    const passwordValidation = validateInput(password, AdminPasswordSchema);
    if (!passwordValidation.success) {
      return { success: false, error: passwordValidation.error };
    }

    // Rate limiting - prevents brute force attacks
    const rateLimitKey = `admin:bootstrap:${normalizedEmail}`;
    const isAllowed = await checkDistributedRateLimit(
      rateLimitKey,
      RATE_LIMITS.adminOperations,
    );
    if (!isAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const adminClient = await createAdminClient();

    // SECURITY: Check if any admin already exists
    const { data: users, error: listError } =
      await adminClient.auth.admin.listUsers();

    if (listError) {
      authLogger.error("[createAdminUser] Failed to list users", listError);
      return {
        success: false,
        error: "Failed to access user database",
      };
    }

    const hasExistingAdmin = users?.users.some((u) => {
      const role = u.app_metadata?.role;
      return isAdmin(role);
    });

    // SECURITY: If admin exists, require super_admin authentication
    if (hasExistingAdmin) {
      const auth = await verifySuperAdminAuth("createAdminUser");
      if (!auth.authorized) {
        authLogger.warn(
          "[createAdminUser] Unauthorized: Admin exists but caller is not super_admin",
        );
        return {
          success: false,
          error:
            "An admin already exists. Only super admins can create new admin accounts.",
        };
      }
    }

    // Check if user already exists
    const existingUser = users?.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );

    if (existingUser) {
      authLogger.warn("[createAdminUser] User already exists", {
        email: normalizedEmail,
      });
      return {
        success: false,
        error: `User with email ${email} already exists. Use the admin panel to manage roles.`,
      };
    }

    // TOCTOU protection: re-check admin existence right before creation
    // Narrows the race window between initial check and user creation
    if (!hasExistingAdmin) {
      const { data: recheck } = await adminClient.auth.admin.listUsers();
      const nowHasAdmin = recheck?.users.some((u) => isAdmin(u.app_metadata?.role));
      if (nowHasAdmin) {
        authLogger.warn("[createAdminUser] Race condition detected: admin created between checks");
        return {
          success: false,
          error: "An admin was just created by another request. Please refresh and use the admin panel.",
        };
      }
    }

    // Create new user with password
    const { data, error: createError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true, // Auto-confirm email
      });

    if (createError || !data.user) {
      authLogger.error("[createAdminUser] Failed to create user", createError);
      return {
        success: false,
        error: createError?.message || "Failed to create user account",
      };
    }

    const userId = data.user.id;

    // Set admin role (first admin becomes super_admin, subsequent become admin)
    const roleToSet = hasExistingAdmin ? "admin" : "super_admin";
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        app_metadata: {
          role: roleToSet,
        },
      },
    );

    if (updateError) {
      authLogger.error(
        "[createAdminUser] Failed to set admin role",
        updateError,
      );
      return {
        success: false,
        error: "Failed to set admin role",
      };
    }

    authLogger.success("[createAdminUser] Admin user created successfully", {
      email: normalizedEmail,
      role: roleToSet,
      isBootstrap: !hasExistingAdmin,
    });

    return {
      success: true,
      message: `${roleToSet === "super_admin" ? "Super Admin" : "Admin"} user ${email} created successfully!`,
      userId,
    };
  } catch (error) {
    return handleActionError("createAdminUser", error);
  }
}
