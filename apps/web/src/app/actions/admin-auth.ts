'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

export interface CreateAdminUserResult {
  success: boolean
  error?: string
  message?: string
  userId?: string
}

/**
 * Create a new admin user account
 * This creates both the user in Auth and sets the admin role
 */
export async function createAdminUser(
  email: string,
  password: string
): Promise<CreateAdminUserResult> {
  try {
    const adminClient = await createAdminClient()

    // 1. Check if user already exists
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      authLogger.error('[createAdminUser] Failed to list users', listError)
      return {
        success: false,
        error: 'Failed to access user database',
      }
    }

    const existingUser = users?.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      authLogger.warn('[createAdminUser] User already exists', { email })
      return {
        success: false,
        error: `User with email ${email} already exists. Use the admin setup page to set admin role.`,
      }
    }

    // 2. Create new user with password
    const { data, error: createError } = await adminClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (createError || !data.user) {
      authLogger.error('[createAdminUser] Failed to create user', createError)
      return {
        success: false,
        error: createError?.message || 'Failed to create user account',
      }
    }

    const userId = data.user.id

    // 3. Set admin role
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      app_metadata: {
        role: 'admin',
      },
    })

    if (updateError) {
      authLogger.error('[createAdminUser] Failed to set admin role', updateError)
      return {
        success: false,
        error: 'Failed to set admin role',
      }
    }

    authLogger.success('[createAdminUser] Admin user created successfully', { email })
    return {
      success: true,
      message: `Admin user ${email} created successfully!`,
      userId,
    }
  } catch (error) {
    authLogger.error('[createAdminUser] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
