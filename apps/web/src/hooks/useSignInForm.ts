/**
 * useSignInForm - Sign-in form management hook
 *
 * Manages sign-in state for both email and phone authentication.
 * Extracted from the monolithic useAuthState hook (440 lines → 6 focused hooks).
 *
 * Follows rule.md: ARCHITECTURAL CONSISTENCY - single responsibility principle
 * Each hook handles one auth flow to keep code focused and testable.
 *
 * WHY: useAuthState was 440 lines managing 64+ useState hooks across
 * email signin, phone signin, email signup, phone signup, and forgot password.
 * This made it:
 * - Hard to test (too many paths)
 * - Hard to reuse (all-or-nothing import)
 * - Hard to understand (lots of unrelated state)
 *
 * Solution: Split into 6 focused hooks:
 * 1. useSignInForm (this) - Email/phone signin
 * 2. useSignUpForm - Email/phone signup with OTP
 * 3. useForgotPasswordForm - Password recovery
 * + The original input hooks (usePhoneInput, useOTPInput, usePasswordValidation)
 */

import { useState, useCallback } from 'react'

export type SignInTab = 'email' | 'phone'

export interface SignInFormState {
  // Tab selection
  tab: SignInTab

  // Email sign-in
  emailAddress: string
  emailPassword: string
  emailError: string | null

  // Phone sign-in
  phonePassword: string
  phoneError: string | null
}

export interface SignInFormActions {
  // Tab management
  setTab: (tab: SignInTab) => void

  // Email sign-in setters
  setEmailAddress: (value: string) => void
  setEmailPassword: (value: string) => void
  setEmailError: (error: string | null) => void
  resetEmail: () => void

  // Phone sign-in setters
  setPhonePassword: (value: string) => void
  setPhoneError: (error: string | null) => void
  resetPhone: () => void

  // Reset everything
  reset: () => void
}

const initialState: SignInFormState = {
  tab: 'email',
  emailAddress: '',
  emailPassword: '',
  emailError: null,
  phonePassword: '',
  phoneError: null,
}

/**
 * useSignInForm Hook
 *
 * Manages email and phone sign-in form state and actions.
 * Phone input handling is delegated to usePhoneInput hook.
 *
 * @returns Object with state and actions for sign-in form
 *
 * Usage:
 * ```tsx
 * const { state, actions } = useSignInForm()
 *
 * // In email signin handler:
 * const validation = validateEmail(state.emailAddress)
 * if (!validation.valid) {
 *   actions.setEmailError(validation.errors.join(', '))
 *   return
 * }
 *
 * // After successful signin:
 * actions.reset()
 *
 * // Switch to phone tab:
 * actions.setTab('phone')
 * ```
 */
export function useSignInForm() {
  const [state, setState] = useState<SignInFormState>(initialState)

  const setTab = useCallback((tab: SignInTab) => {
    setState(prev => ({ ...prev, tab }))
  }, [])

  // Email sign-in actions
  const setEmailAddress = useCallback((value: string) => {
    setState(prev => ({ ...prev, emailAddress: value }))
  }, [])

  const setEmailPassword = useCallback((value: string) => {
    setState(prev => ({ ...prev, emailPassword: value }))
  }, [])

  const setEmailError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, emailError: error }))
  }, [])

  const resetEmail = useCallback(() => {
    setState(prev => ({
      ...prev,
      emailAddress: '',
      emailPassword: '',
      emailError: null,
    }))
  }, [])

  // Phone sign-in actions
  const setPhonePassword = useCallback((value: string) => {
    setState(prev => ({ ...prev, phonePassword: value }))
  }, [])

  const setPhoneError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, phoneError: error }))
  }, [])

  const resetPhone = useCallback(() => {
    setState(prev => ({
      ...prev,
      phonePassword: '',
      phoneError: null,
    }))
  }, [])

  // Reset all
  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const actions: SignInFormActions = {
    setTab,
    setEmailAddress,
    setEmailPassword,
    setEmailError,
    resetEmail,
    setPhonePassword,
    setPhoneError,
    resetPhone,
    reset,
  }

  return { state, actions }
}
