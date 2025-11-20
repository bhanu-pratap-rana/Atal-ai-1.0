/**
 * useForgotPasswordForm - Forgot password form management hook
 *
 * Manages password recovery state for email-based password reset.
 * Extracted from the monolithic useAuthState hook (440 lines → 6 focused hooks).
 *
 * Handles multi-step password recovery:
 * 1. Enter email → Request OTP
 * 2. Receive OTP via email
 * 3. Enter OTP and new password → Reset password
 * 4. Return to sign-in
 *
 * Follows rule.md: ARCHITECTURAL CONSISTENCY - single responsibility principle
 */

import { useState, useCallback } from 'react'

export interface ForgotPasswordFormState {
  // Step 1: Request OTP
  email: string
  emailError: string | null

  // Step 2: Verify OTP & reset password
  otp: string
  newPassword: string
  newPasswordConfirm: string
  otpError: string | null
}

export interface ForgotPasswordFormActions {
  // Email setters
  setEmail: (value: string) => void
  setEmailError: (error: string | null) => void

  // OTP & password setters
  setOtp: (value: string) => void
  setNewPassword: (value: string) => void
  setNewPasswordConfirm: (value: string) => void
  setOtpError: (error: string | null) => void

  // Reset
  reset: () => void
}

const initialState: ForgotPasswordFormState = {
  email: '',
  emailError: null,
  otp: '',
  newPassword: '',
  newPasswordConfirm: '',
  otpError: null,
}

/**
 * useForgotPasswordForm Hook
 *
 * Manages forgot password flow with OTP verification.
 * Password validation is delegated to usePasswordValidation hook.
 * OTP input handling is delegated to useOTPInput hook.
 *
 * Typically used alongside:
 * - useOTPInput: For OTP digit input
 * - usePasswordValidation: For password validation
 *
 * @returns Object with state and actions for forgot password form
 *
 * Usage:
 * ```tsx
 * const { state, actions } = useForgotPasswordForm()
 * const otpInput = useOTPInput()
 * const passwordInput = usePasswordValidation()
 *
 * // Step 1: Send OTP to email
 * const result = await sendForgotPasswordOtp(state.email)
 * if (!result.success) {
 *   actions.setEmailError(result.error)
 * }
 *
 * // Step 2: User enters OTP from email
 * actions.setOtp(otpInput.value)
 *
 * // Step 3: Reset password with OTP
 * const resetResult = await resetPasswordWithOtp(
 *   state.email,
 *   state.otp,
 *   state.newPassword
 * )
 *
 * if (resetResult.success) {
 *   actions.reset()
 *   // Return to sign-in
 * }
 * ```
 */
export function useForgotPasswordForm() {
  const [state, setState] = useState<ForgotPasswordFormState>(initialState)

  // Email setters
  const setEmail = useCallback((value: string) => {
    setState(prev => ({ ...prev, email: value }))
  }, [])

  const setEmailError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, emailError: error }))
  }, [])

  // OTP & password setters
  const setOtp = useCallback((value: string) => {
    setState(prev => ({ ...prev, otp: value }))
  }, [])

  const setNewPassword = useCallback((value: string) => {
    setState(prev => ({ ...prev, newPassword: value }))
  }, [])

  const setNewPasswordConfirm = useCallback((value: string) => {
    setState(prev => ({ ...prev, newPasswordConfirm: value }))
  }, [])

  const setOtpError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, otpError: error }))
  }, [])

  // Reset all
  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const actions: ForgotPasswordFormActions = {
    setEmail,
    setEmailError,
    setOtp,
    setNewPassword,
    setNewPasswordConfirm,
    setOtpError,
    reset,
  }

  return { state, actions }
}
