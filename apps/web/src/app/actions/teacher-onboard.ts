'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'
import { checkEmailExistsInAuth } from '@/app/actions/auth'

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
 * Send Email OTP for teacher registration
 * Step 1A: Email field → "Send code"
 * Now includes check if email already exists using reliable auth check
 */
export async function sendEmailOtp(email: string): Promise<SendEmailOtpResult> {
  try {
    const trimmedEmail = email.trim().toLowerCase()
    const supabase = await createClient()

    // First check if email already exists using the reliable auth check
    // This works without service role key by checking the users table with RLS
    const emailCheck = await checkEmailExistsInAuth(trimmedEmail)

    if (emailCheck.exists) {
      authLogger.info('[sendEmailOtp] Email already registered', { role: emailCheck.role })
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

    authLogger.success('[sendEmailOtp] OTP sent successfully')
    return { success: true }
  } catch (error) {
    authLogger.error('[sendEmailOtp] Unexpected error', error)
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
