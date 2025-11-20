/**
 * useSignUpForm - Sign-up form management hook
 *
 * Manages sign-up state for both email and phone authentication with OTP flow.
 * Extracted from the monolithic useAuthState hook (440 lines → 6 focused hooks).
 *
 * Handles:
 * - Email signup with OTP verification
 * - Phone signup with OTP verification
 * - Multi-step signup flows (email → OTP → password → account creation)
 *
 * Follows rule.md: ARCHITECTURAL CONSISTENCY - single responsibility principle
 */

import { useState, useCallback } from 'react'

export type SignUpTab = 'email' | 'phone'
export type PhoneOtpStep = 'phone' | 'verify'

export interface SignUpFormState {
  // Tab selection
  tab: SignUpTab

  // Email signup
  emailAddress: string
  emailOtpSent: boolean
  emailOtp: string
  emailPassword: string
  emailPasswordConfirm: string
  emailError: string | null

  // Phone signup
  phoneOtpStep: PhoneOtpStep
  phoneOtp: string
  phonePassword: string
  phonePasswordConfirm: string
  phoneError: string | null
}

export interface SignUpFormActions {
  // Tab management
  setTab: (tab: SignUpTab) => void

  // Email signup setters
  setEmailAddress: (value: string) => void
  setEmailOtpSent: (sent: boolean) => void
  setEmailOtp: (value: string) => void
  setEmailPassword: (value: string) => void
  setEmailPasswordConfirm: (value: string) => void
  setEmailError: (error: string | null) => void
  resetEmail: () => void

  // Phone signup setters
  setPhoneOtpStep: (step: PhoneOtpStep) => void
  setPhoneOtp: (value: string) => void
  setPhonePassword: (value: string) => void
  setPhonePasswordConfirm: (value: string) => void
  setPhoneError: (error: string | null) => void
  resetPhone: () => void

  // Reset everything
  reset: () => void
}

const initialState: SignUpFormState = {
  tab: 'email',
  emailAddress: '',
  emailOtpSent: false,
  emailOtp: '',
  emailPassword: '',
  emailPasswordConfirm: '',
  emailError: null,
  phoneOtpStep: 'phone',
  phoneOtp: '',
  phonePassword: '',
  phonePasswordConfirm: '',
  phoneError: null,
}

/**
 * useSignUpForm Hook
 *
 * Manages email and phone sign-up form state with OTP flows.
 * Phone input handling is delegated to usePhoneInput hook.
 * Password validation is delegated to usePasswordValidation hook.
 *
 * Typically used alongside:
 * - usePhoneInput: For phone number formatting
 * - useOTPInput: For OTP digit input
 * - usePasswordValidation: For password validation
 *
 * @returns Object with state and actions for sign-up form
 *
 * Usage:
 * ```tsx
 * const { state, actions } = useSignUpForm()
 * const phoneInput = usePhoneInput()
 * const otpInput = useOTPInput()
 * const passwordInput = usePasswordValidation()
 *
 * // Email OTP sent
 * const result = await requestOtp(state.emailAddress)
 * if (result.success) {
 *   actions.setEmailOtpSent(true)
 * }
 *
 * // Phone OTP verification
 * const verifyResult = await handleVerifyOTP(
 *   supabase,
 *   { phone: phoneInput.fullValue },
 *   state.phoneOtp,
 *   'sms'
 * )
 *
 * // Complete signup
 * if (verifyResult.success) {
 *   await handleSetPassword(supabase, state.phonePassword)
 *   actions.resetPhone()
 * }
 * ```
 */
export function useSignUpForm() {
  const [state, setState] = useState<SignUpFormState>(initialState)

  const setTab = useCallback((tab: SignUpTab) => {
    setState(prev => ({ ...prev, tab }))
  }, [])

  // Email signup actions
  const setEmailAddress = useCallback((value: string) => {
    setState(prev => ({ ...prev, emailAddress: value }))
  }, [])

  const setEmailOtpSent = useCallback((sent: boolean) => {
    setState(prev => ({ ...prev, emailOtpSent: sent }))
  }, [])

  const setEmailOtp = useCallback((value: string) => {
    setState(prev => ({ ...prev, emailOtp: value }))
  }, [])

  const setEmailPassword = useCallback((value: string) => {
    setState(prev => ({ ...prev, emailPassword: value }))
  }, [])

  const setEmailPasswordConfirm = useCallback((value: string) => {
    setState(prev => ({ ...prev, emailPasswordConfirm: value }))
  }, [])

  const setEmailError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, emailError: error }))
  }, [])

  const resetEmail = useCallback(() => {
    setState(prev => ({
      ...prev,
      emailAddress: '',
      emailOtpSent: false,
      emailOtp: '',
      emailPassword: '',
      emailPasswordConfirm: '',
      emailError: null,
    }))
  }, [])

  // Phone signup actions
  const setPhoneOtpStep = useCallback((step: PhoneOtpStep) => {
    setState(prev => ({ ...prev, phoneOtpStep: step }))
  }, [])

  const setPhoneOtp = useCallback((value: string) => {
    setState(prev => ({ ...prev, phoneOtp: value }))
  }, [])

  const setPhonePassword = useCallback((value: string) => {
    setState(prev => ({ ...prev, phonePassword: value }))
  }, [])

  const setPhonePasswordConfirm = useCallback((value: string) => {
    setState(prev => ({ ...prev, phonePasswordConfirm: value }))
  }, [])

  const setPhoneError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, phoneError: error }))
  }, [])

  const resetPhone = useCallback(() => {
    setState(prev => ({
      ...prev,
      phoneOtpStep: 'phone',
      phoneOtp: '',
      phonePassword: '',
      phonePasswordConfirm: '',
      phoneError: null,
    }))
  }, [])

  // Reset all
  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const actions: SignUpFormActions = {
    setTab,
    setEmailAddress,
    setEmailOtpSent,
    setEmailOtp,
    setEmailPassword,
    setEmailPasswordConfirm,
    setEmailError,
    resetEmail,
    setPhoneOtpStep,
    setPhoneOtp,
    setPhonePassword,
    setPhonePasswordConfirm,
    setPhoneError,
    resetPhone,
    reset,
  }

  return { state, actions }
}
