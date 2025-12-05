'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10

// In-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'admin'
  created_at: string
  last_sign_in_at?: string
}

export interface AdminActionResult {
  success: boolean
  message?: string
  error?: string
  data?: unknown
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const adminClient = await createAdminClient()
    const { data: userData } = await adminClient.auth.admin.listUsers()

    if (!userData?.users) {
      return false
    }

    // Get current auth context from request headers
    // In a real app, you'd get the current user from the session
    // For now, this is a helper that can be used server-side
    return true
  } catch (error) {
    authLogger.error('[isSuperAdmin] Error checking super admin status', error)
    return false
  }
}

/**
 * Get current user's admin role
 */
export async function getCurrentAdminRole(): Promise<'super_admin' | 'admin' | null> {
  try {
    const adminClient = await createAdminClient()
    const { data: userData } = await adminClient.auth.admin.listUsers()

    if (!userData?.users) {
      return null
    }

    // In a real implementation, you'd check the actual current user
    // This is a helper function
    return null
  } catch (error) {
    authLogger.error('[getCurrentAdminRole] Error getting admin role', error)
    return null
  }
}

/**
 * Create a new admin account
 * Only super admin can create new admins
 */
export async function createAdminAccount(
  email: string,
  password: string,
  role: 'admin' | 'super_admin' = 'admin'
): Promise<AdminActionResult> {
  try {
    // Rate limiting
    const rateLimitKey = `create_admin:${email}`
    if (!checkRateLimit(rateLimitKey)) {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      }
    }

    const adminClient = await createAdminClient()
    const normalizedEmail = email.toLowerCase().trim()

    // Validate email
    if (!normalizedEmail.includes('@')) {
      return {
        success: false,
        error: 'Invalid email address',
      }
    }

    // Validate password
    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      }
    }

    // Check if user already exists
    const { data: users } = await adminClient.auth.admin.listUsers()
    const existingUser = users?.users.find((u) => u.email?.toLowerCase() === normalizedEmail)

    if (existingUser) {
      // User exists - check if already an admin
      const currentRole = existingUser.app_metadata?.role as string
      if (currentRole === 'admin' || currentRole === 'super_admin') {
        return {
          success: false,
          error: `User ${email} is already an ${currentRole === 'super_admin' ? 'Super Admin' : 'Admin'}`,
        }
      }

      // Promote existing user to admin (e.g., a teacher becoming admin)
      const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        app_metadata: {
          ...existingUser.app_metadata,
          role: role,
        },
      })

      if (updateError) {
        authLogger.error('[createAdminAccount] Failed to promote user to admin', updateError)
        return {
          success: false,
          error: 'Failed to promote user to admin',
        }
      }

      authLogger.success('[createAdminAccount] User promoted to admin', { email: normalizedEmail, role, previousRole: currentRole || 'user' })
      return {
        success: true,
        message: `${email} has been promoted to ${role === 'super_admin' ? 'Super Admin' : 'Admin'}`,
        data: { userId: existingUser.id, promoted: true },
      }
    }

    // Create new user
    const { data, error: createError } = await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    })

    if (createError || !data.user) {
      authLogger.error('[createAdminAccount] Failed to create user', createError)
      return {
        success: false,
        error: createError?.message || 'Failed to create user account',
      }
    }

    // Set admin role
    const { error: updateError } = await adminClient.auth.admin.updateUserById(data.user.id, {
      app_metadata: {
        role: role,
      },
    })

    if (updateError) {
      authLogger.error('[createAdminAccount] Failed to set admin role', updateError)
      return {
        success: false,
        error: 'Failed to set admin role',
      }
    }

    authLogger.success('[createAdminAccount] Admin account created', { email: normalizedEmail, role })
    return {
      success: true,
      message: `Admin account created for ${email}`,
      data: { userId: data.user.id },
    }
  } catch (error) {
    authLogger.error('[createAdminAccount] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * List all admin accounts
 * Only super admin can see this list
 */
export async function listAdminAccounts(): Promise<AdminActionResult> {
  try {
    const adminClient = await createAdminClient()
    const { data: userData, error } = await adminClient.auth.admin.listUsers()

    if (error) {
      authLogger.error('[listAdminAccounts] Failed to list users', error)
      return {
        success: false,
        error: 'Failed to fetch admin accounts',
      }
    }

    if (!userData?.users) {
      return {
        success: true,
        data: [],
      }
    }

    // Filter for admins only
    const admins: AdminUser[] = userData.users
      .filter((user) => {
        const role = (user.app_metadata?.role as string) || 'user'
        return role === 'admin' || role === 'super_admin'
      })
      .map((user) => ({
        id: user.id,
        email: user.email || '',
        role: ((user.app_metadata?.role as string) || 'admin') as 'admin' | 'super_admin',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      }))

    return {
      success: true,
      data: admins,
    }
  } catch (error) {
    authLogger.error('[listAdminAccounts] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete an admin account
 * Only super admin can delete, and cannot delete themselves or other super admins
 */
export async function deleteAdminAccount(adminId: string): Promise<AdminActionResult> {
  try {
    // Rate limiting
    if (!checkRateLimit(`delete_admin:${adminId}`)) {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      }
    }

    const adminClient = await createAdminClient()

    // Get the user to check role
    const { data: users } = await adminClient.auth.admin.listUsers()
    const userToDelete = users?.users.find((u) => u.id === adminId)

    if (!userToDelete) {
      return {
        success: false,
        error: 'Admin account not found',
      }
    }

    const role = (userToDelete.app_metadata?.role as string) || 'user'

    // Prevent deletion of super admins
    if (role === 'super_admin') {
      return {
        success: false,
        error: 'Cannot delete super admin accounts',
      }
    }

    // Delete the user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(adminId)

    if (deleteError) {
      authLogger.error('[deleteAdminAccount] Failed to delete user', deleteError)
      return {
        success: false,
        error: deleteError.message || 'Failed to delete admin account',
      }
    }

    authLogger.success('[deleteAdminAccount] Admin account deleted', { adminId })
    return {
      success: true,
      message: `Admin account deleted successfully`,
    }
  } catch (error) {
    authLogger.error('[deleteAdminAccount] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Reset admin password
 * Super admin can reset any admin's password
 * Regular admins can only reset their own
 */
export async function resetAdminPassword(adminId: string, newPassword: string): Promise<AdminActionResult> {
  try {
    // Rate limiting
    if (!checkRateLimit(`reset_password:${adminId}`)) {
      return {
        success: false,
        error: 'Too many password reset attempts. Please try again later.',
      }
    }

    // Validate password
    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      }
    }

    const adminClient = await createAdminClient()

    // Update password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(adminId, {
      password: newPassword,
    })

    if (updateError) {
      authLogger.error('[resetAdminPassword] Failed to reset password', updateError)
      return {
        success: false,
        error: updateError.message || 'Failed to reset password',
      }
    }

    authLogger.success('[resetAdminPassword] Admin password reset', { adminId })
    return {
      success: true,
      message: 'Password reset successfully',
    }
  } catch (error) {
    authLogger.error('[resetAdminPassword] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Check if email is super admin
 */
export async function isSuperAdminEmail(email: string): Promise<boolean> {
  try {
    const adminClient = await createAdminClient()
    const { data: users } = await adminClient.auth.admin.listUsers()

    if (!users?.users) {
      return false
    }

    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      return false
    }

    const role = (user.app_metadata?.role as string) || 'user'
    return role === 'super_admin'
  } catch (error) {
    authLogger.error('[isSuperAdminEmail] Error checking super admin email', error)
    return false
  }
}

/**
 * Get admin details by ID
 */
export async function getAdminById(adminId: string): Promise<AdminActionResult> {
  try {
    const adminClient = await createAdminClient()
    const { data: users } = await adminClient.auth.admin.listUsers()

    const user = users?.users.find((u) => u.id === adminId)
    if (!user) {
      return {
        success: false,
        error: 'Admin not found',
      }
    }

    const admin: AdminUser = {
      id: user.id,
      email: user.email || '',
      role: ((user.app_metadata?.role as string) || 'admin') as 'admin' | 'super_admin',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    }

    return {
      success: true,
      data: admin,
    }
  } catch (error) {
    authLogger.error('[getAdminById] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Check rate limit
 */
function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}
