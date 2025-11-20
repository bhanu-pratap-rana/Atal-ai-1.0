import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  requestOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from '@/app/actions/auth'
import { authLogger } from '@/lib/auth-logger'
import { validateEmail, validatePassword } from '@/lib/auth-validation'
import { AUTH_MESSAGES } from '@/lib/auth-ui-messages'

interface UseAuthHandlersParams {
  supabase: SupabaseClient
}

interface AuthHandlerResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Consolidated auth handlers hook
 * Extracts common authentication logic used by both student and teacher flows
 * Provides unified error handling and logging
 */
export function useAuthHandlers({ supabase }: UseAuthHandlersParams) {
  const router = useRouter()

  /**
   * Sign in with email and password
   * Common handler for both student and teacher sign-in
   */
  const handleSignInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthHandlerResult> => {
      try {
        // Validate email format
        const emailValidation = validateEmail(email)
        if (!emailValidation.valid) {
          return {
            success: false,
            error: emailValidation.error || AUTH_MESSAGES.VALIDATION.INVALID_EMAIL,
          }
        }

        authLogger.debug('[Auth] Attempting password sign-in')
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          authLogger.error('[Auth] Password sign-in failed', error)
          toast.error(AUTH_MESSAGES.SIGNIN.FAILED)
          return { success: false, error: AUTH_MESSAGES.SIGNIN.FAILED }
        }

        if (data.user) {
          authLogger.success('[Auth] Password sign-in successful')
          toast.success(AUTH_MESSAGES.SIGNIN.SUCCESS)
          return { success: true, data: data.user }
        }

        return {
          success: false,
          error: AUTH_MESSAGES.SIGNIN.FAILED,
        }
      } catch (error) {
        authLogger.error('[Auth] Unexpected error during sign-in', error)
        toast.error(AUTH_MESSAGES.SIGNIN.UNEXPECTED_ERROR)
        return { success: false, error: AUTH_MESSAGES.SIGNIN.UNEXPECTED_ERROR }
      }
    },
    [supabase]
  )

  /**
   * Send OTP to email for verification
   * Consolidates logic for email OTP requests
   */
  const handleSendEmailOtp = useCallback(
    async (email: string): Promise<AuthHandlerResult> => {
      try {
        const emailValidation = validateEmail(email)
        if (!emailValidation.valid) {
          return {
            success: false,
            error: emailValidation.error || AUTH_MESSAGES.VALIDATION.INVALID_EMAIL,
          }
        }

        authLogger.debug('[Auth] Sending email OTP')
        const result = await requestOtp(email.trim())

        if (result.success) {
          authLogger.success('[Auth] Email OTP sent')
          toast.success(AUTH_MESSAGES.SIGNUP.EMAIL_OTP_SENT)
          return { success: true }
        }

        authLogger.error('[Auth] Failed to send email OTP', result.error)
        toast.error(result.error || AUTH_MESSAGES.SIGNUP.OTP_FAILED)
        return { success: false, error: result.error }
      } catch (error) {
        authLogger.error('[Auth] Unexpected error sending email OTP', error)
        toast.error(AUTH_MESSAGES.SIGNUP.OTP_FAILED)
        return { success: false, error: AUTH_MESSAGES.SIGNUP.OTP_FAILED }
      }
    },
    []
  )

  /**
   * Send OTP for password reset
   */
  const handleSendPasswordResetOtp = useCallback(
    async (email: string): Promise<AuthHandlerResult> => {
      try {
        const emailValidation = validateEmail(email)
        if (!emailValidation.valid) {
          return {
            success: false,
            error: emailValidation.error || AUTH_MESSAGES.VALIDATION.INVALID_EMAIL,
          }
        }

        authLogger.debug('[Auth] Sending password reset OTP')
        const result = await sendForgotPasswordOtp(email.trim())

        if (result.success) {
          authLogger.success('[Auth] Password reset OTP sent')
          toast.success(AUTH_MESSAGES.PASSWORD_RESET.CODE_SENT)
          return { success: true }
        }

        authLogger.error('[Auth] Failed to send password reset OTP', result.error)
        toast.error(result.error || AUTH_MESSAGES.PASSWORD_RESET.FAILED)
        return { success: false, error: result.error }
      } catch (error) {
        authLogger.error('[Auth] Unexpected error sending password reset OTP', error)
        toast.error(AUTH_MESSAGES.PASSWORD_RESET.FAILED)
        return { success: false, error: AUTH_MESSAGES.PASSWORD_RESET.FAILED }
      }
    },
    []
  )

  /**
   * Reset password with OTP verification
   */
  const handleResetPassword = useCallback(
    async (
      email: string,
      otp: string,
      newPassword: string
    ): Promise<AuthHandlerResult> => {
      try {
        // Validate password
        const passwordValidation = validatePassword(newPassword)
        if (!passwordValidation.valid) {
          return {
            success: false,
            error: passwordValidation.error || AUTH_MESSAGES.VALIDATION.MIN_PASSWORD,
          }
        }

        if (!otp || otp.length !== 6) {
          return {
            success: false,
            error: AUTH_MESSAGES.VALIDATION.INVALID_OTP,
          }
        }

        authLogger.debug('[Auth] Attempting password reset')
        const result = await resetPasswordWithOtp(email.trim(), otp, newPassword)

        if (result.success) {
          authLogger.success('[Auth] Password reset successful')
          toast.success(AUTH_MESSAGES.PASSWORD_RESET.SUCCESS)
          return { success: true }
        }

        authLogger.error('[Auth] Password reset failed', result.error)
        toast.error(result.error || AUTH_MESSAGES.PASSWORD_RESET.FAILED)
        return { success: false, error: result.error }
      } catch (error) {
        authLogger.error('[Auth] Unexpected error during password reset', error)
        toast.error(AUTH_MESSAGES.PASSWORD_RESET.FAILED)
        return { success: false, error: AUTH_MESSAGES.PASSWORD_RESET.FAILED }
      }
    },
    []
  )

  /**
   * Sign out and redirect to home
   */
  const handleSignOut = useCallback(async () => {
    try {
      authLogger.debug('[Auth] Signing out')
      await supabase.auth.signOut()
      authLogger.success('[Auth] Sign out successful')
      router.push('/')
    } catch (error) {
      authLogger.error('[Auth] Sign out failed', error)
      toast.error('Failed to sign out')
    }
  }, [supabase, router])

  return {
    handleSignInWithPassword,
    handleSendEmailOtp,
    handleSendPasswordResetOtp,
    handleResetPassword,
    handleSignOut,
  }
}
