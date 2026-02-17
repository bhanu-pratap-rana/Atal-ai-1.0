"use server";

import { z } from "zod";
import {
  createAdminClient,
  verifySuperAdminAuth,
  verifyAdminAuth,
  getCurrentUser,
} from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";
import { checkRateLimit as checkDistributedRateLimit } from "@/lib/rate-limiter-distributed";
import { isSuperAdmin, isAdmin } from "@/lib/auth/role-utils";
import {
  AdminEmailSchema,
  AdminPasswordSchema,
  UserIdSchema,
} from "@/lib/validation-schemas";
import { fetchAllAuthUsers, findAuthUserById, findAuthUserByEmail } from "@/lib/admin-utils";
import { handleZodError } from "@/lib/action-error-handler";

// Use centralized rate limit config for admin operations
const ADMIN_RATE_LIMIT = RATE_LIMITS.adminOperations;

/**
 * Validate input using Zod schema and return AdminActionResult on error
 * Eliminates duplicated try/catch blocks for Zod validation
 */
function validateAdminInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { valid: true; data: T } | { valid: false; error: AdminActionResult } {
  try {
    return { valid: true, data: schema.parse(data) };
  } catch (error) {
    const zodError = handleZodError(error);
    return {
      valid: false,
      error: {
        success: false,
        error: zodError.error || "Invalid input",
      },
    };
  }
}

export interface AdminUser {
  id: string;
  email: string;
  role: "super_admin" | "admin";
  created_at: unknown;
  last_sign_in_at?: unknown;
}

export interface AdminActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/**
 * Check if current user is super admin
 * SECURITY: Uses getCurrentUser() to get authenticated user from session
 *
 * @internal Reserved for future UI conditional rendering
 * @returns true if current user has super_admin role
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const role = currentUser.app_metadata?.role;
    return isSuperAdmin(role);
  } catch (error) {
    authLogger.error(
      "[isCurrentUserSuperAdmin] Error checking super admin status",
      error,
    );
    return false;
  }
}

/**
 * Get current user's admin role
 * SECURITY: Uses getCurrentUser() to get authenticated user from session
 *
 * @internal Reserved for future role-based UI rendering
 * @returns 'super_admin', 'admin', or null if not an admin
 */
export async function getCurrentAdminRole(): Promise<
  "super_admin" | "admin" | null
> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const role = currentUser.app_metadata?.role;
    if (isAdmin(role)) {
      return role as "admin" | "super_admin";
    }
    return null;
  } catch (error) {
    authLogger.error("[getCurrentAdminRole] Error getting admin role", error);
    return null;
  }
}

/**
 * Helper: Check if user can be promoted to admin (not a student-only account)
 */
async function canPromoteToAdmin(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
): Promise<{ canPromote: true } | { canPromote: false; error: string }> {
  const [studentProfileResult, teacherProfileResult] = await Promise.all([
    adminClient
      .from("student_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
    adminClient
      .from("teacher_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const studentProfile = studentProfileResult.data;
  const teacherProfile = teacherProfileResult.data;

  if (studentProfile && !teacherProfile) {
    authLogger.warn(
      "[createAdminAccount] Blocked: Cannot promote student to admin",
      {
        userId,
      },
    );
    return {
      canPromote: false,
      error:
        "This email is registered as a student account. Only teachers can be promoted to admin.",
    };
  }

  return { canPromote: true };
}

/**
 * Helper: Promote existing user to admin role
 */
async function promoteExistingUserToAdmin(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  email: string,
  role: "admin" | "super_admin",
  currentRole: string | undefined,
): Promise<AdminActionResult> {
  const { data, error: recheckError } =
    await adminClient.auth.admin.getUserById(userId);
  const recheck = data?.user;

  if (recheckError || !recheck) {
    authLogger.warn("[createAdminAccount] User disappeared during operation", {
      userId,
    });
    return {
      success: false,
      error: "User no longer exists. Please try again.",
    };
  }

  const recheckRole = recheck.app_metadata?.role;
  if (recheckRole === "admin" || recheckRole === "super_admin") {
    authLogger.warn(
      "[createAdminAccount] User already promoted by concurrent request",
      {
        email,
        userId,
        role: recheckRole,
      },
    );
    return {
      success: true,
      message: `${email} is already an ${recheckRole === "super_admin" ? "Super Admin" : "Admin"}`,
      data: { userId, promoted: false },
    };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    userId,
    {
      app_metadata: {
        ...recheck.app_metadata,
        role: role,
      },
    },
  );

  if (updateError) {
    authLogger.error(
      "[createAdminAccount] Failed to promote user to admin",
      updateError,
    );
    return {
      success: false,
      error: "Failed to promote user to admin",
    };
  }

  authLogger.success("[createAdminAccount] User promoted to admin", {
    email,
    role,
    previousRole: currentRole || "user",
  });
  return {
    success: true,
    message: `${email} has been promoted to ${role === "super_admin" ? "Super Admin" : "Admin"}`,
    data: { userId, promoted: true },
  };
}

/**
 * Helper: Create new admin user account
 */
async function createNewAdminUser(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  email: string,
  password: string,
  role: "admin" | "super_admin",
): Promise<AdminActionResult> {
  const { data, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !data.user) {
    authLogger.error("[createAdminAccount] Failed to create user", createError);
    return {
      success: false,
      error: createError?.message || "Failed to create user account",
    };
  }

  const newUserId = data.user.id;

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    newUserId,
    {
      app_metadata: {
        role: role,
      },
    },
  );

  if (updateError) {
    authLogger.error(
      "[createAdminAccount] Failed to set admin role, initiating rollback",
      updateError,
    );

    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(newUserId);
    if (deleteError) {
      authLogger.error(
        "[createAdminAccount] CRITICAL: Rollback failed, orphaned user created",
        {
          userId: newUserId,
          email,
          deleteError: deleteError.message,
        },
      );
      return {
        success: false,
        error:
          "Failed to configure admin account and rollback failed. Manual intervention required.",
      };
    }

    authLogger.warn("[createAdminAccount] Rollback successful, user deleted", {
      userId: newUserId,
    });
    return {
      success: false,
      error: "Failed to set admin role. Account creation rolled back.",
    };
  }

  authLogger.success("[createAdminAccount] Admin account created", {
    email,
    role,
  });
  return {
    success: true,
    message: `Admin account created for ${email}`,
    data: { userId: newUserId },
  };
}

/**
 * Create a new admin account (refactored to reduce cognitive complexity)
 * SECURITY: Only super_admin can create new admins
 * CRITICAL FIX: Reduced complexity from 29 to <15 by extracting helper functions
 */
export async function createAdminAccount(
  email: string,
  password: string,
  role: "admin" | "super_admin" = "admin",
): Promise<AdminActionResult> {
  try {
    const emailValidation = validateAdminInput(AdminEmailSchema, email);
    if (!emailValidation.valid) {
      return emailValidation.error;
    }
    const normalizedEmail = emailValidation.data;

    const passwordValidation = validateAdminInput(
      AdminPasswordSchema,
      password,
    );
    if (!passwordValidation.valid) {
      return passwordValidation.error;
    }

    const auth = await verifySuperAdminAuth("createAdminAccount");
    if (!auth.authorized) {
      return auth.error;
    }

    const rateLimitKey = `admin:create:${normalizedEmail}`;
    const isAllowed = await checkDistributedRateLimit(
      rateLimitKey,
      ADMIN_RATE_LIMIT,
    );
    if (!isAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const adminClient = await createAdminClient();
    // PERFORMANCE: Use helper function for email lookup
    const existingUser = await findAuthUserByEmail(adminClient, normalizedEmail);

    if (existingUser) {
      const currentRole = existingUser.app_metadata?.role as
        | string
        | undefined;
      if (currentRole === "admin" || currentRole === "super_admin") {
        return {
          success: false,
          error: `User ${email} is already an ${currentRole === "super_admin" ? "Super Admin" : "Admin"}`,
        };
      }

      const promotionCheck = await canPromoteToAdmin(
        adminClient,
        existingUser.id,
      );
      if (!promotionCheck.canPromote) {
        return {
          success: false,
          error: promotionCheck.error,
        };
      }

      return await promoteExistingUserToAdmin(
        adminClient,
        existingUser.id,
        email,
        role,
        currentRole,
      );
    }

    return await createNewAdminUser(
      adminClient,
      normalizedEmail,
      password,
      role,
    );
  } catch (error) {
    authLogger.error("[createAdminAccount] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * List all admin accounts
 * SECURITY: Only super_admin can see this list
 */
export async function listAdminAccounts(): Promise<AdminActionResult> {
  try {
    // SECURITY: Verify caller is authenticated and authorized as super_admin
    const auth = await verifySuperAdminAuth("listAdminAccounts");
    if (!auth.authorized) {
      return auth.error;
    }

    const adminClient = await createAdminClient();
    // List all users with full pagination support
    const allUsers = await fetchAllAuthUsers(adminClient);

    if (!allUsers || allUsers.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Filter for admins only (skip anonymous users — only email-based accounts can be admins)
    const admins: AdminUser[] = allUsers
      .filter((user) => {
        if (!user.email) return false;
        const role = user.app_metadata?.role as string | null | undefined;
        return isAdmin(role);
      })
      .map((user) => ({
        id: user.id,
        email: user.email!,
        role: ((user.app_metadata?.role) || "admin") as
          | "admin"
          | "super_admin",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      }));

    return {
      success: true,
      data: admins,
    };
  } catch (error) {
    authLogger.error("[listAdminAccounts] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Delete an admin account
 * SECURITY: Only super_admin can delete, cannot delete themselves or other super admins
 */
export async function deleteAdminAccount(
  adminId: string,
): Promise<AdminActionResult> {
  try {
    // Validate input
    const idValidation = validateAdminInput(UserIdSchema, adminId);
    if (!idValidation.valid) {
      return idValidation.error;
    }
    const validatedId = idValidation.data;

    // SECURITY: Verify caller is authenticated and authorized as super_admin
    const auth = await verifySuperAdminAuth("deleteAdminAccount");
    if (!auth.authorized) {
      return auth.error;
    }

    // SECURITY: Prevent self-deletion
    if (validatedId === auth.user.id) {
      authLogger.warn(
        "[deleteAdminAccount] Forbidden: Cannot delete own account",
        {
          userId: auth.user.id,
        },
      );
      return {
        success: false,
        error: "Cannot delete your own account",
      };
    }

    // Rate limiting using distributed rate limiter
    const isAllowed = await checkDistributedRateLimit(
      `admin:delete:${validatedId}`,
      ADMIN_RATE_LIMIT,
    );
    if (!isAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS,
      };
    }

    const adminClient = await createAdminClient();

    // PERFORMANCE: Use direct ID lookup - O(1) instead of O(n) pagination
    const userToDelete = await findAuthUserById(adminClient, validatedId);

    if (!userToDelete) {
      return {
        success: false,
        error: "Admin account not found",
      };
    }

    const role = userToDelete.app_metadata?.role as
      | string
      | null
      | undefined;

    // Prevent deletion of super admins
    if (isSuperAdmin(role)) {
      return {
        success: false,
        error: "Cannot delete super admin accounts",
      };
    }

    // Delete the user
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(validatedId);

    if (deleteError) {
      authLogger.error(
        "[deleteAdminAccount] Failed to delete user",
        deleteError,
      );
      return {
        success: false,
        error: deleteError.message || "Failed to delete admin account",
      };
    }

    authLogger.success("[deleteAdminAccount] Admin account deleted", {
      adminId: validatedId,
    });
    return {
      success: true,
      message: `Admin account deleted successfully`,
    };
  } catch (error) {
    authLogger.error("[deleteAdminAccount] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Reset admin password
 * SECURITY: Super_admin can reset any admin's password, regular admins only their own
 */
export async function resetAdminPassword(
  adminId: string,
  newPassword: string,
): Promise<AdminActionResult> {
  try {
    // Validate inputs using Zod schemas
    const idValidation = validateAdminInput(UserIdSchema, adminId);
    if (!idValidation.valid) {
      return idValidation.error;
    }
    const validatedId = idValidation.data;

    const passwordValidation = validateAdminInput(
      AdminPasswordSchema,
      newPassword,
    );
    if (!passwordValidation.valid) {
      return passwordValidation.error;
    }

    // SECURITY: Verify caller is authenticated and is an admin
    const auth = await verifyAdminAuth("resetAdminPassword");
    if (!auth.authorized) {
      return auth.error;
    }

    // Regular admins can only reset their own password
    const currentRole = auth.user.app_metadata?.role;
    if (currentRole === "admin" && validatedId !== auth.user.id) {
      authLogger.warn(
        "[resetAdminPassword] Forbidden: Admin cannot reset other passwords",
        {
          userId: auth.user.id,
          targetId: validatedId,
        },
      );
      return {
        success: false,
        error: "You can only reset your own password",
      };
    }

    // Rate limiting using distributed rate limiter
    const isAllowed = await checkDistributedRateLimit(
      `admin:reset:${validatedId}`,
      ADMIN_RATE_LIMIT,
    );
    if (!isAllowed) {
      return {
        success: false,
        error: RATE_LIMIT_ERRORS.WAIT_BEFORE_RETRY,
      };
    }

    const adminClient = await createAdminClient();

    // Update password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      validatedId,
      {
        password: newPassword,
      },
    );

    if (updateError) {
      authLogger.error(
        "[resetAdminPassword] Failed to reset password",
        updateError,
      );
      return {
        success: false,
        error: updateError.message || "Failed to reset password",
      };
    }

    authLogger.success("[resetAdminPassword] Admin password reset", {
      adminId: validatedId,
    });
    return {
      success: true,
      message: "Password reset successfully",
    };
  } catch (error) {
    authLogger.error("[resetAdminPassword] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Check if email is super admin
 */
export async function isSuperAdminEmail(email: string): Promise<boolean> {
  try {
    // Validate email input
    const emailValidation = validateAdminInput(AdminEmailSchema, email);
    if (!emailValidation.valid) {
      return false;
    }
    const normalizedEmail = emailValidation.data;

    const adminClient = await createAdminClient();
    // PERFORMANCE: Use helper function for email lookup
    const user = await findAuthUserByEmail(adminClient, normalizedEmail);

    if (!user) {
      return false;
    }

    const role = user.app_metadata?.role as string | null | undefined;
    return isSuperAdmin(role);
  } catch (error) {
    authLogger.error(
      "[isSuperAdminEmail] Error checking super admin email",
      error,
    );
    return false;
  }
}

/**
 * Get admin details by ID
 * SECURITY: Requires super_admin role
 */
export async function getAdminById(
  adminId: string,
): Promise<AdminActionResult> {
  try {
    // Validate input
    const idValidation = validateAdminInput(UserIdSchema, adminId);
    if (!idValidation.valid) {
      return idValidation.error;
    }
    const validatedId = idValidation.data;

    // SECURITY: Verify caller is authenticated and authorized as super_admin
    const auth = await verifySuperAdminAuth("getAdminById");
    if (!auth.authorized) {
      return auth.error;
    }

    const adminClient = await createAdminClient();
    // PERFORMANCE: Use direct ID lookup - O(1) instead of O(n) pagination
    const user = await findAuthUserById(adminClient, validatedId);

    if (!user) {
      return {
        success: false,
        error: "Admin not found",
      };
    }

    const admin: AdminUser = {
      id: user.id,
      email: user.email || "",
      role: ((user.app_metadata?.role) || "admin") as
        | "admin"
        | "super_admin",
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    };

    return {
      success: true,
      data: admin,
    };
  } catch (error) {
    authLogger.error("[getAdminById] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
