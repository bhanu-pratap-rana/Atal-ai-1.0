/**
 * Custom hook for managing authentication state
 * Consolidates 64+ useState hooks into a single state machine pattern
 * Supports email, phone, and guest authentication flows
 */

import { useState, useCallback } from 'react'

export type AuthStep = 'signin' | 'signup' | 'forgot-password'
export type SignInTab = 'email' | 'phone'
export type SignUpTab = 'email' | 'phone' | 'guest'
export type PhoneOtpStep = 'phone' | 'verify'

export interface AuthState {
  // Main navigation
  mainStep: AuthStep
  signinTab: SignInTab
  signupTab: SignUpTab

  // Sign In - Email
  signinEmailAddress: string
  signinEmailPassword: string
  signinEmailError: string | null

  // Sign In - Phone
  signinPhoneNumber: string
  signinPhonePassword: string
  signinPhoneError: string | null

  // Sign Up - Email
  signupEmailAddress: string
  signupEmailPassword: string
  signupEmailPasswordConfirm: string
  signupEmailError: string | null
  signupEmailOtpSent: boolean

  // Sign Up - Email OTP
  signupEmailOtp: string
  signupEmailOtpError: string | null

  // Sign Up - Phone
  signupPhoneNumber: string
  signupPhoneOtpStep: PhoneOtpStep
  signupPhoneOtp: string
  signupPhonePassword: string
  signupPhonePasswordConfirm: string
  signupPhoneOtpError: string | null
  signupPhoneError: string | null

  // Sign Up - Guest
  guestClassCode: string
  guestRollNumber: string
  guestPin: string
  guestError: string | null

  // Forgot Password
  forgotPasswordEmail: string
  forgotPasswordOtp: string
  forgotPasswordNewPassword: string
  forgotPasswordNewPasswordConfirm: string
  forgotPasswordStep: 'email' | 'otp' | 'reset'
  forgotPasswordError: string | null

  // Global loading state
  isLoading: boolean
}

export interface AuthActions {
  // Main navigation
  setMainStep: (step: AuthStep) => void
  setSigninTab: (tab: SignInTab) => void
  setSignupTab: (tab: SignUpTab) => void

  // Sign In - Email
  setSigninEmailAddress: (value: string) => void
  setSigninEmailPassword: (value: string) => void
  setSigninEmailError: (error: string | null) => void
  resetSigninEmail: () => void

  // Sign In - Phone
  setSigninPhoneNumber: (value: string) => void
  setSigninPhonePassword: (value: string) => void
  setSigninPhoneError: (error: string | null) => void
  resetSigninPhone: () => void

  // Sign Up - Email
  setSignupEmailAddress: (value: string) => void
  setSignupEmailPassword: (value: string) => void
  setSignupEmailPasswordConfirm: (value: string) => void
  setSignupEmailError: (error: string | null) => void
  setSignupEmailOtpSent: (sent: boolean) => void
  resetSignupEmail: () => void

  // Sign Up - Email OTP
  setSignupEmailOtp: (value: string) => void
  setSignupEmailOtpError: (error: string | null) => void

  // Sign Up - Phone
  setSignupPhoneNumber: (value: string) => void
  setSignupPhoneOtp: (value: string) => void
  setSignupPhonePassword: (value: string) => void
  setSignupPhonePasswordConfirm: (value: string) => void
  setSignupPhoneOtpStep: (step: PhoneOtpStep) => void
  setSignupPhoneOtpError: (error: string | null) => void
  setSignupPhoneError: (error: string | null) => void
  resetSignupPhone: () => void

  // Sign Up - Guest
  setGuestClassCode: (value: string) => void
  setGuestRollNumber: (value: string) => void
  setGuestPin: (value: string) => void
  setGuestError: (error: string | null) => void
  resetGuest: () => void

  // Forgot Password
  setForgotPasswordEmail: (value: string) => void
  setForgotPasswordOtp: (value: string) => void
  setForgotPasswordNewPassword: (value: string) => void
  setForgotPasswordNewPasswordConfirm: (value: string) => void
  setForgotPasswordStep: (step: 'email' | 'otp' | 'reset') => void
  setForgotPasswordError: (error: string | null) => void
  resetForgotPassword: () => void

  // Global
  setIsLoading: (loading: boolean) => void
  resetAll: () => void
}

const initialState: AuthState = {
  mainStep: 'signin',
  signinTab: 'email',
  signupTab: 'email',

  signinEmailAddress: '',
  signinEmailPassword: '',
  signinEmailError: null,

  signinPhoneNumber: '',
  signinPhonePassword: '',
  signinPhoneError: null,

  signupEmailAddress: '',
  signupEmailPassword: '',
  signupEmailPasswordConfirm: '',
  signupEmailError: null,
  signupEmailOtpSent: false,

  signupEmailOtp: '',
  signupEmailOtpError: null,

  signupPhoneNumber: '',
  signupPhoneOtpStep: 'phone',
  signupPhoneOtp: '',
  signupPhonePassword: '',
  signupPhonePasswordConfirm: '',
  signupPhoneOtpError: null,
  signupPhoneError: null,

  guestClassCode: '',
  guestRollNumber: '',
  guestPin: '',
  guestError: null,

  forgotPasswordEmail: '',
  forgotPasswordOtp: '',
  forgotPasswordNewPassword: '',
  forgotPasswordNewPasswordConfirm: '',
  forgotPasswordStep: 'email',
  forgotPasswordError: null,

  isLoading: false,
}

/**
 * Custom hook for authentication state management
 * Replaces 64+ useState hooks with a single state machine
 * @returns { state, actions } - Current auth state and action creators
 */
export function useAuthState(): { state: AuthState; actions: AuthActions } {
  const [state, setState] = useState<AuthState>(initialState)

  // Main navigation setters
  const setMainStep = useCallback((step: AuthStep) => {
    setState((prev) => ({ ...prev, mainStep: step }))
  }, [])

  const setSigninTab = useCallback((tab: SignInTab) => {
    setState((prev) => ({ ...prev, signinTab: tab }))
  }, [])

  const setSignupTab = useCallback((tab: SignUpTab) => {
    setState((prev) => ({ ...prev, signupTab: tab }))
  }, [])

  // Sign In - Email
  const setSigninEmailAddress = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinEmailAddress: value }))
  }, [])

  const setSigninEmailPassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinEmailPassword: value }))
  }, [])

  const setSigninEmailError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signinEmailError: error }))
  }, [])

  const resetSigninEmail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signinEmailAddress: '',
      signinEmailPassword: '',
      signinEmailError: null,
    }))
  }, [])

  // Sign In - Phone
  const setSigninPhoneNumber = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinPhoneNumber: value }))
  }, [])

  const setSigninPhonePassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signinPhonePassword: value }))
  }, [])

  const setSigninPhoneError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signinPhoneError: error }))
  }, [])

  const resetSigninPhone = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signinPhoneNumber: '',
      signinPhonePassword: '',
      signinPhoneError: null,
    }))
  }, [])

  // Sign Up - Email
  const setSignupEmailAddress = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailAddress: value }))
  }, [])

  const setSignupEmailPassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailPassword: value }))
  }, [])

  const setSignupEmailPasswordConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailPasswordConfirm: value }))
  }, [])

  const setSignupEmailError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupEmailError: error }))
  }, [])

  const setSignupEmailOtpSent = useCallback((sent: boolean) => {
    setState((prev) => ({ ...prev, signupEmailOtpSent: sent }))
  }, [])

  const resetSignupEmail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signupEmailAddress: '',
      signupEmailPassword: '',
      signupEmailPasswordConfirm: '',
      signupEmailError: null,
      signupEmailOtpSent: false,
    }))
  }, [])

  // Sign Up - Email OTP
  const setSignupEmailOtp = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupEmailOtp: value }))
  }, [])

  const setSignupEmailOtpError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupEmailOtpError: error }))
  }, [])

  // Sign Up - Phone
  const setSignupPhoneNumber = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhoneNumber: value }))
  }, [])

  const setSignupPhoneOtp = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhoneOtp: value }))
  }, [])

  const setSignupPhonePassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhonePassword: value }))
  }, [])

  const setSignupPhonePasswordConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, signupPhonePasswordConfirm: value }))
  }, [])

  const setSignupPhoneOtpStep = useCallback((step: PhoneOtpStep) => {
    setState((prev) => ({ ...prev, signupPhoneOtpStep: step }))
  }, [])

  const setSignupPhoneOtpError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupPhoneOtpError: error }))
  }, [])

  const setSignupPhoneError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, signupPhoneError: error }))
  }, [])

  const resetSignupPhone = useCallback(() => {
    setState((prev) => ({
      ...prev,
      signupPhoneNumber: '',
      signupPhoneOtpStep: 'phone',
      signupPhoneOtp: '',
      signupPhonePassword: '',
      signupPhonePasswordConfirm: '',
      signupPhoneOtpError: null,
      signupPhoneError: null,
    }))
  }, [])

  // Sign Up - Guest
  const setGuestClassCode = useCallback((value: string) => {
    setState((prev) => ({ ...prev, guestClassCode: value }))
  }, [])

  const setGuestRollNumber = useCallback((value: string) => {
    setState((prev) => ({ ...prev, guestRollNumber: value }))
  }, [])

  const setGuestPin = useCallback((value: string) => {
    setState((prev) => ({ ...prev, guestPin: value }))
  }, [])

  const setGuestError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, guestError: error }))
  }, [])

  const resetGuest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      guestClassCode: '',
      guestRollNumber: '',
      guestPin: '',
      guestError: null,
    }))
  }, [])

  // Forgot Password
  const setForgotPasswordEmail = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordEmail: value }))
  }, [])

  const setForgotPasswordOtp = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordOtp: value }))
  }, [])

  const setForgotPasswordNewPassword = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordNewPassword: value }))
  }, [])

  const setForgotPasswordNewPasswordConfirm = useCallback((value: string) => {
    setState((prev) => ({ ...prev, forgotPasswordNewPasswordConfirm: value }))
  }, [])

  const setForgotPasswordStep = useCallback((step: 'email' | 'otp' | 'reset') => {
    setState((prev) => ({ ...prev, forgotPasswordStep: step }))
  }, [])

  const setForgotPasswordError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, forgotPasswordError: error }))
  }, [])

  const resetForgotPassword = useCallback(() => {
    setState((prev) => ({
      ...prev,
      forgotPasswordEmail: '',
      forgotPasswordOtp: '',
      forgotPasswordNewPassword: '',
      forgotPasswordNewPasswordConfirm: '',
      forgotPasswordStep: 'email',
      forgotPasswordError: null,
    }))
  }, [])

  // Global
  const setIsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }))
  }, [])

  const resetAll = useCallback(() => {
    setState(initialState)
  }, [])

  const actions: AuthActions = {
    setMainStep,
    setSigninTab,
    setSignupTab,
    setSigninEmailAddress,
    setSigninEmailPassword,
    setSigninEmailError,
    resetSigninEmail,
    setSigninPhoneNumber,
    setSigninPhonePassword,
    setSigninPhoneError,
    resetSigninPhone,
    setSignupEmailAddress,
    setSignupEmailPassword,
    setSignupEmailPasswordConfirm,
    setSignupEmailError,
    setSignupEmailOtpSent,
    resetSignupEmail,
    setSignupEmailOtp,
    setSignupEmailOtpError,
    setSignupPhoneNumber,
    setSignupPhoneOtp,
    setSignupPhonePassword,
    setSignupPhonePasswordConfirm,
    setSignupPhoneOtpStep,
    setSignupPhoneOtpError,
    setSignupPhoneError,
    resetSignupPhone,
    setGuestClassCode,
    setGuestRollNumber,
    setGuestPin,
    setGuestError,
    resetGuest,
    setForgotPasswordEmail,
    setForgotPasswordOtp,
    setForgotPasswordNewPassword,
    setForgotPasswordNewPasswordConfirm,
    setForgotPasswordStep,
    setForgotPasswordError,
    resetForgotPassword,
    setIsLoading,
    resetAll,
  }

  return { state, actions }
}
