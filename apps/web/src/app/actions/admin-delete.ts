'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

export interface DeleteUserResult {
  success: boolean
  error?: string
  message?: string
}

/**
 * Delete a user by email
 * WARNING: This is destructive and cannot be undone
 */
export async function deleteUserByEmail(email: string): Promise<DeleteUserResult> {
  try {
    const adminClient = await createAdminClient()

    // 1. Find user by email
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      authLogger.error('[deleteUserByEmail] Failed to list users', listError)
      return {
        success: false,
        error: 'Failed to access user database',
      }
    }

    const user = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      authLogger.warn('[deleteUserByEmail] User not found', { email })
      return {
        success: false,
        error: `User with email ${email} not found`,
      }
    }

    // 2. Delete the user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      authLogger.error('[deleteUserByEmail] Failed to delete user', deleteError)
      return {
        success: false,
        error: deleteError.message || 'Failed to delete user',
      }
    }

    authLogger.success('[deleteUserByEmail] User deleted successfully', { email })
    return {
      success: true,
      message: `User ${email} has been deleted. You can now create a new account with this email.`,
    }
  } catch (error) {
    authLogger.error('[deleteUserByEmail] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
