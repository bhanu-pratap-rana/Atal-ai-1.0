'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

export type AdminRole = 'super_admin' | 'admin' | 'user'

export interface AdminCapabilities {
  canManageAdmins: boolean
  canManageSchools: boolean
  canManagePins: boolean
  canViewDashboard: boolean
  canResetPasswords: boolean
  canDeleteAdmins: boolean
}

export interface AdminAuthInfo {
  isAuthenticated: boolean
  role: AdminRole
  email?: string
  capabilities: AdminCapabilities
}

/**
 * Get admin role for a specific user by email
 */
export async function getAdminRoleByEmail(email: string): Promise<AdminRole> {
  try {
    const adminClient = await createAdminClient()
    const { data: users } = await adminClient.auth.admin.listUsers()

    const user = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      return 'user'
    }

    const role = (user.app_metadata?.role as string) || 'user'
    return role as AdminRole
  } catch (error) {
    authLogger.error('[getAdminRoleByEmail] Error getting role', error)
    return 'user'
  }
}

/**
 * Get capabilities for a specific role
 */
export function getCapabilitiesByRole(role: AdminRole): AdminCapabilities {
  const baseCapabilities: AdminCapabilities = {
    canManageAdmins: false,
    canManageSchools: false,
    canManagePins: false,
    canViewDashboard: false,
    canResetPasswords: false,
    canDeleteAdmins: false,
  }

  switch (role) {
    case 'super_admin':
      return {
        canManageAdmins: true,
        canManageSchools: true,
        canManagePins: true,
        canViewDashboard: true,
        canResetPasswords: true,
        canDeleteAdmins: true,
      }
    case 'admin':
      return {
        canManageAdmins: false,
        canManageSchools: false,
        canManagePins: true,
        canViewDashboard: false,
        canResetPasswords: false,
        canDeleteAdmins: false,
      }
    default:
      return baseCapabilities
  }
}

/**
 * Check if user has specific capability
 */
export async function hasCapability(email: string, capability: keyof AdminCapabilities): Promise<boolean> {
  const role = await getAdminRoleByEmail(email)
  const capabilities = getCapabilitiesByRole(role)
  return capabilities[capability]
}

/**
 * Check if user is super admin
 */
export async function isSuperAdminByEmail(email: string): Promise<boolean> {
  const role = await getAdminRoleByEmail(email)
  return role === 'super_admin'
}

/**
 * Check if user is any type of admin
 */
export async function isAnyAdmin(email: string): Promise<boolean> {
  const role = await getAdminRoleByEmail(email)
  return role === 'admin' || role === 'super_admin'
}

/**
 * Get full admin auth info for a user
 */
export async function getAdminAuthInfo(email: string): Promise<AdminAuthInfo> {
  try {
    const role = await getAdminRoleByEmail(email)
    const capabilities = getCapabilitiesByRole(role)
    const isAuthenticated = role !== 'user'

    return {
      isAuthenticated,
      role,
      email,
      capabilities,
    }
  } catch (error) {
    authLogger.error('[getAdminAuthInfo] Error getting auth info', error)
    return {
      isAuthenticated: false,
      role: 'user',
      capabilities: getCapabilitiesByRole('user'),
    }
  }
}

/**
 * Verify admin authorization for an operation
 */
export async function verifyAdminAuthorization(
  email: string,
  requiredCapability: keyof AdminCapabilities
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const role = await getAdminRoleByEmail(email)

    if (role === 'user') {
      return {
        authorized: false,
        error: 'Not authorized. Admin access required.',
      }
    }

    const capabilities = getCapabilitiesByRole(role)
    if (!capabilities[requiredCapability]) {
      return {
        authorized: false,
        error: `Your role (${role}) does not have permission for this operation.`,
      }
    }

    return { authorized: true }
  } catch (error) {
    authLogger.error('[verifyAdminAuthorization] Error verifying authorization', error)
    return {
      authorized: false,
      error: 'An error occurred while checking authorization',
    }
  }
}
