/**
 * Centralized role checking utilities
 * Eliminates duplicate role validation logic across the codebase
 *
 * Use these functions instead of inline role checks like:
 * - role === 'teacher' || role === 'admin' || role === 'super_admin'
 * - role === 'admin' || role === 'super_admin'
 * - role === 'super_admin'
 */

/**
 * Supported role types in the application
 */
export type UserRole = "student" | "teacher" | "admin" | "super_admin";

/**
 * Role hierarchy (higher roles have permissions of lower roles)
 * student < teacher < admin < super_admin
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 1,
  teacher: 2,
  admin: 3,
  super_admin: 4,
};

/**
 * Check if a role is a teacher or higher (teacher, admin, super_admin)
 *
 * @param role - The user's role
 * @returns true if user is a teacher or higher
 *
 * @example
 * const isTeacher = isTeacherOrHigher(user.app_metadata?.role)
 * if (isTeacher) {
 *   // Show teacher dashboard
 * }
 */
export function isTeacherOrHigher(role: string | undefined | null): boolean {
  return role === "teacher" || role === "admin" || role === "super_admin";
}

/**
 * Check if a role is an admin or super_admin
 *
 * @param role - The user's role
 * @returns true if user is an admin or super_admin
 *
 * @example
 * const isAdmin = isAdmin(user.app_metadata?.role)
 * if (isAdmin) {
 *   // Show admin panel
 * }
 */
export function isAdmin(role: string | undefined | null): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Check if a role is super_admin only
 *
 * @param role - The user's role
 * @returns true if user is a super_admin
 *
 * @example
 * const isSuperAdmin = isSuperAdmin(user.app_metadata?.role)
 * if (isSuperAdmin) {
 *   // Show super admin features
 * }
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === "super_admin";
}

/**
 * Check if a role is a teacher only (not admin or super_admin)
 *
 * @param role - The user's role
 * @returns true if user is exactly a teacher
 */
export function isTeacherOnly(role: string | undefined | null): boolean {
  return role === "teacher";
}

/**
 * Check if a role is a student
 *
 * @param role - The user's role
 * @returns true if user is a student
 */
export function isStudent(role: string | undefined | null): boolean {
  return role === "student";
}

/**
 * Check if a user has a minimum role level
 *
 * @param role - The user's role
 * @param minimumRole - The minimum required role
 * @returns true if user's role meets or exceeds the minimum
 *
 * @example
 * const hasTeacherAccess = hasMinimumRole(user.app_metadata?.role, 'teacher')
 * if (hasTeacherAccess) {
 *   // User is teacher, admin, or super_admin
 * }
 */
export function hasMinimumRole(
  role: string | undefined | null,
  minimumRole: UserRole,
): boolean {
  if (!isValidRole(role)) {
    return false;
  }

  const userLevel = ROLE_HIERARCHY[role];
  const minimumLevel = ROLE_HIERARCHY[minimumRole];

  return userLevel >= minimumLevel;
}

/**
 * Get the role from user metadata safely
 *
 * @param appMetadata - User's app_metadata object
 * @returns The role or null if not found
 *
 * @example
 * const role = getRoleFromMetadata(user.app_metadata)
 */
export function getRoleFromMetadata(
  appMetadata: Record<string, unknown> | undefined | null,
): UserRole | null {
  if (!appMetadata) {
    return null;
  }

  const role = appMetadata.role;
  if (typeof role === "string" && isValidRole(role)) {
    return role; // Type guard narrows to UserRole
  }

  return null;
}

/**
 * Validate that a role is a recognized role type
 *
 * @param role - The role to validate
 * @returns true if role is valid
 *
 * @example
 * if (isValidRole(userRole)) {
 *   // Safe to use role in role checks
 * }
 */
export function isValidRole(role: unknown): role is UserRole {
  return (
    typeof role === "string" &&
    ["student", "teacher", "admin", "super_admin"].includes(role)
  );
}

/**
 * List of roles that can perform administrative functions
 */
export const ADMIN_ROLES: readonly UserRole[] = [
  "admin",
  "super_admin",
] as const;

/**
 * List of roles that can create/manage classes
 */
export const TEACHER_ROLES: readonly UserRole[] = [
  "teacher",
  "admin",
  "super_admin",
] as const;

/**
 * Check if role is in a list of allowed roles
 *
 * @param role - The user's role
 * @param allowedRoles - Array of allowed roles
 * @returns true if user's role is in the allowed list
 *
 * @example
 * if (hasAllowedRole(userRole, ADMIN_ROLES)) {
 *   // User is admin or super_admin
 * }
 */
export function hasAllowedRole(
  role: string | undefined | null,
  allowedRoles: readonly UserRole[],
): boolean {
  return allowedRoles.includes(role as UserRole);
}

/**
 * Get display name for a role (for UI)
 *
 * @param role - The role to display
 * @returns Human-readable role name
 *
 * @example
 * const displayName = getRoleDisplayName('super_admin') // "Super Admin"
 */
export function getRoleDisplayName(role: string | undefined | null): string {
  switch (role) {
    case "student":
      return "Student";
    case "teacher":
      return "Teacher";
    case "admin":
      return "Administrator";
    case "super_admin":
      return "Super Administrator";
    default:
      return "Unknown";
  }
}

/**
 * Filter users by role
 *
 * @param users - Array of user objects with app_metadata
 * @param role - Role to filter by
 * @returns Array of users with the specified role
 *
 * @example
 * const admins = filterUsersByRole(allUsers, 'admin')
 */
export function filterUsersByRole(
  users: Array<{ app_metadata?: Record<string, unknown> }>,
  role: UserRole,
): typeof users {
  return users.filter((user) => {
    const userRole = getRoleFromMetadata(user.app_metadata);
    return userRole === role;
  });
}

/**
 * Filter users by minimum role
 *
 * @param users - Array of user objects with app_metadata
 * @param minimumRole - Minimum role level
 * @returns Array of users with role at or above minimum
 *
 * @example
 * const teachers = filterUsersByMinimumRole(allUsers, 'teacher')
 */
export function filterUsersByMinimumRole(
  users: Array<{ app_metadata?: Record<string, unknown> }>,
  minimumRole: UserRole,
): typeof users {
  return users.filter((user) => {
    const userRole = getRoleFromMetadata(user.app_metadata);
    return userRole ? hasMinimumRole(userRole, minimumRole) : false;
  });
}
