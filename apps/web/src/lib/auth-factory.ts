/**
 * Authentication verification factory
 * Eliminates duplication in role-based authorization checks
 */

import { getCurrentUser } from "./supabase-server";
import { authLogger } from "./auth-logger";

export type AuthUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AuthCheckResult<T = {}> =
  | {
      authorized: true;
      user: AuthUser;
    } & T
  | {
      authorized: false;
      error: { success: false; error: string };
    };

interface RoleCheckOptions {
  functionName: string;
  requiredRoles: string[];
  errorMessage: string;
  logContext?: Record<string, unknown>;
}

interface ProfileCheckOptions {
  functionName: string;
  profileCheckFn: (user: AuthUser) => Promise<boolean>;
  notFoundMessage: string;
  errorMessage: string;
  logContext?: Record<string, unknown>;
}

/**
 * Create a role-based auth verifier
 * Checks if user has one of the required roles
 */
export async function verifyRoleAuth(
  options: RoleCheckOptions,
): Promise<AuthCheckResult> {
  const { functionName, requiredRoles, errorMessage, logContext } = options;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    authLogger.warn(`[${functionName}] Unauthorized: No authenticated user`);
    return {
      authorized: false,
      error: { success: false, error: "Authentication required" },
    };
  }

  const role = currentUser.app_metadata?.role;
  if (!role || !requiredRoles.includes(role)) {
    authLogger.warn(`[${functionName}] Forbidden: Role check failed`, {
      userId: currentUser.id,
      requiredRoles,
      actualRole: role,
      ...logContext,
    });
    return {
      authorized: false,
      error: { success: false, error: errorMessage },
    };
  }

  return { authorized: true, user: currentUser };
}

/**
 * Create a profile-based auth verifier
 * Checks if user has a required database profile/record
 */
export async function verifyProfileAuth<T extends Record<string, unknown>>(
  options: ProfileCheckOptions & { profileData?: T },
): Promise<
  AuthCheckResult<{
    profile: T;
  }>
> {
  const {
    functionName,
    profileCheckFn,
    notFoundMessage,
    errorMessage,
    logContext,
  } = options;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    authLogger.warn(`[${functionName}] Unauthorized: No authenticated user`);
    return {
      authorized: false,
      error: { success: false, error: "Authentication required" },
    };
  }

  try {
    const hasProfile = await profileCheckFn(currentUser);

    if (!hasProfile) {
      authLogger.warn(`[${functionName}] Forbidden: User profile not found`, {
        userId: currentUser.id,
        ...logContext,
      });
      return {
        authorized: false,
        error: { success: false, error: notFoundMessage },
      };
    }

    return {
      authorized: true,
      user: currentUser,
      profile: (options.profileData ?? {}) as T,
    };
  } catch (error) {
    authLogger.error(
      `[${functionName}] Failed to verify user profile`,
      error instanceof Error ? error : { error: String(error) },
    );
    return {
      authorized: false,
      error: { success: false, error: errorMessage },
    };
  }
}
