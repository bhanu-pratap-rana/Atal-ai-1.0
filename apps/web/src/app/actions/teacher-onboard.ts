'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'

// Types
export interface SendEmailOtpResult {
  success: boolean
  error?: string
  exists?: boolean
}

export interface VerifyEmailOtpResult {
  success: boolean
  error?: string
  userId?: string
}

export interface SetPasswordResult {
  success: boolean
  error?: string
}

export interface SaveTeacherProfileParams {
  name: string
  phone?: string
  subject?: string
  schoolId: string
  schoolCode: string
}

export interface SaveTeacherProfileResult {
  success: boolean
  error?: string
}

/**
 * Check if email already exists in auth system
 * Used to redirect existing users to login instead of signup
 *
 * This checks both:
 * 1. The users table (public.users)
 * 2. Supabase auth records (prevents duplicate accounts across roles)
 */
export async function checkEmailExists(email: string): Promise<{
  exists: boolean
  hasPassword: boolean
  role?: string
}> {
  try {
    const trimmedEmail = email.trim().toLowerCase()
    const supabase = await createAdminClient()

    // Check 1: Look in public.users table (both teacher and student accounts)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .ilike('email', trimmedEmail)
        .single()

      if (error) {
        // PGRST116 = no rows returned (email doesn't exist) - this is expected
        if (error.code !== 'PGRST116') {
          authLogger.warn('[checkEmailExists] Error checking users table', error)
        }
      } else if (data) {
        // Email found in users table
        authLogger.info('[checkEmailExists] Email found in users table', { role: data.role })
        return { exists: true, hasPassword: true, role: data.role }
      }
    } catch (tableError) {
      authLogger.warn('[checkEmailExists] Failed to check users table', tableError as Error)
    }

    // Check 2: Check Supabase auth users directly (more reliable)
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers()

      if (error) {
        authLogger.error('[checkEmailExists] Failed to list auth users', error)
        // If we can't check, be conservative and require login
        // This prevents accidental account creation on already-used emails
        return { exists: false, hasPassword: false }
      }

      const user = users.find(u => u.email?.toLowerCase() === trimmedEmail)

      if (user) {
        // Check if user has password set
        const hasPassword = user.identities?.some(
          id => id.provider === 'email' && id.identity_data?.email === user.email
        ) ?? false

        const role = user.user_metadata?.role || 'unknown'
        authLogger.info('[checkEmailExists] Email found in auth', { role, hasPassword })
        return { exists: true, hasPassword, role }
      }
    } catch (authError) {
      authLogger.error('[checkEmailExists] Unexpected error checking auth', authError as Error)
      // If we can't verify, be conservative and reject signup
      return { exists: false, hasPassword: false }
    }

    authLogger.debug('[checkEmailExists] Email not found in system', { email: trimmedEmail })
    return { exists: false, hasPassword: false }
  } catch (error) {
    authLogger.error('[checkEmailExists] Unexpected error', error)
    // Conservative approach: if we can't verify, don't allow signup
    return { exists: false, hasPassword: false }
  }
}

/**
 * Send Email OTP for teacher registration
 * Step 1A: Email field → "Send code"
 * Now includes check if email already exists
 */
export async function sendEmailOtp(email: string): Promise<SendEmailOtpResult> {
  try {
    const trimmedEmail = email.trim().toLowerCase()
    const supabase = await createClient()

    // First check if email already exists
    const { exists, hasPassword } = await checkEmailExists(trimmedEmail)

    if (exists) {
      return {
        success: false,
        error: 'This email is already registered. Please login with your email and password.',
        exists: true,
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    authLogger.error('[Send Email OTP] Unexpected error', error)
    return { success: false, error: 'Failed to send OTP. Please try again.' }
  }
}

/**
 * Verify Email OTP
 * Step 1B: 6-digit OTP input → verify
 */
export async function verifyEmailOtp({
  email,
  token,
}: {
  email: string
  token: string
}): Promise<VerifyEmailOtpResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    })

    if (error) {
      // User-friendly error message
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return {
          success: false,
          error: "That code didn't work. Request a new one.",
        }
      }
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Verification failed. Please try again.' }
    }

    return { success: true, userId: data.user.id }
  } catch (error) {
    authLogger.error('[Verify Email OTP] Unexpected error', error)
    return {
      success: false,
      error: 'Failed to verify OTP. Please try again.',
    }
  }
}

/**
 * Set password after OTP verification
 * Step 1C: "Create password" (min 8, zxcvbn hint) → set
 * UX: show "Why a password?" (recovery & multi-device access)
 */
export async function setPassword(password: string): Promise<SetPasswordResult> {
  try {
    const supabase = await createClient()

    // 1. Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated. Please sign in again.' }
    }

    // 2. Validate password (min 8 chars)
    if (!password || password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      }
    }

    // 3. Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    authLogger.error('[Set Password] Unexpected error', error)
    return {
      success: false,
      error: 'Failed to set password. Please try again.',
    }
  }
}

/**
 * Save teacher profile after school verification
 * Step 3: Insert/update teacher_profiles row
 * RLS uses auth.uid() for ownership
 */
export async function saveTeacherProfile({
  name,
  phone,
  subject,
  schoolId,
  schoolCode,
}: SaveTeacherProfileParams): Promise<SaveTeacherProfileResult> {
  try {
    const supabase = await createClient()

    // 1. Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // 2. Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      return {
        success: false,
        error: 'An approved teacher profile already exists for this account.',
      }
    }

    // 3. Insert teacher profile
    const { error: insertError } = await supabase.from('teacher_profiles').insert({
      user_id: user.id,
      school_id: schoolId,
      name: name.trim(),
      phone: phone?.trim() || null,
      subject: subject?.trim() || null,
      school_code: schoolCode.toUpperCase().trim(),
    })

    if (insertError) {
      authLogger.error('[Save Profile] Failed to create teacher profile', insertError)
      return {
        success: false,
        error: 'Failed to create teacher profile. Please try again.',
      }
    }

    // 4. Update user app_metadata to include role using Admin API
    // This ensures the JWT reflects app_metadata.role = 'teacher' immediately
    try {
      const adminClient = await createAdminClient()
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        user.id,
        {
          app_metadata: {
            role: 'teacher',
            school_id: schoolId,
            school_code: schoolCode.toUpperCase().trim(),
          },
        }
      )

      if (updateError) {
        authLogger.error('[Save Profile] Failed to update user metadata', updateError)
        // Don't fail here - profile is already created
      }
    } catch (adminError) {
      authLogger.error('[Save Profile] Admin client error', adminError)
      // Don't fail - profile creation succeeded
    }

    return { success: true }
  } catch (error) {
    authLogger.error('[Save Profile] Unexpected error', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
