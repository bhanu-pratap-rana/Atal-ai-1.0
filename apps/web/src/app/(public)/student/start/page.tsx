'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-browser'
import { requestOtp, sendForgotPasswordOtp, resetPasswordWithOtp } from '@/app/actions/auth'
import { joinClass } from '@/app/actions/student'
import { useAuthState } from '@/hooks/useAuthState'
import { useOTPInput } from '@/hooks/useOTPInput'
import { usePhoneInput } from '@/hooks/usePhoneInput'
import {
  sanitizePIN,
  sanitizeClassCode,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
  validatePIN,
  validateClassCode,
} from '@/lib/auth-validation'
import {
  PHONE_DIGIT_LENGTH,
  OTP_LENGTH,
  PIN_LENGTH,
  CLASS_CODE_LENGTH,
} from '@/lib/auth-constants'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authLogger } from '@/lib/auth-logger'

export default function StudentStartPage() {
  const router = useRouter()
  const supabase = createClient()
  const { state, actions } = useAuthState()

  // Initialize phone input hooks for all phone fields
  const signinPhoneInput = usePhoneInput(state.signinPhoneNumber)
  const signupPhoneInput = usePhoneInput(state.signupPhoneNumber)

  // Initialize OTP input hooks for all OTP fields
  const signupEmailOtpInput = useOTPInput(state.signupEmailOtp)
  const signupPhoneOtpInput = useOTPInput(state.signupPhoneOtp)
  const forgotPasswordOtpInput = useOTPInput(state.forgotPasswordOtp)

  // Check if already authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/app/dashboard')
      }
    }
    checkAuth()
  }, [supabase, router])

  // ========================================
  // SIGN IN - EMAIL HANDLER
  // ========================================
  async function handleSignInEmail(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setSigninEmailError(null)

    // Validate email
    const emailValidation = validateEmail(state.signinEmailAddress)
    if (!emailValidation.valid) {
      actions.setSigninEmailError(emailValidation.error || 'Invalid email')
      actions.setIsLoading(false)
      return
    }

    try {
      authLogger.debug('[SignIn Email] Attempting email authentication')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.signinEmailAddress.trim(),
        password: state.signinEmailPassword,
      })

      if (error) {
        authLogger.error('[SignIn Email] Authentication failed', error)
        actions.setSigninEmailError(error.message || 'Invalid email or password')
        toast.error('Login failed: ' + (error.message || 'Invalid credentials'))
      } else if (data.user) {
        authLogger.success('[SignIn Email] Authentication successful')
        toast.success('Login successful!')
        router.push('/app/dashboard')
      }
    } catch (error) {
      authLogger.error('[SignIn Email] Unexpected error', error)
      actions.setSigninEmailError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // SIGN IN - PHONE HANDLER
  // ========================================
  async function handleSignInPhone(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setSigninPhoneError(null)

    // Validate phone
    const phoneValidation = validatePhone(signinPhoneInput.fullValue)
    if (!phoneValidation.valid) {
      actions.setSigninPhoneError(phoneValidation.error || 'Invalid phone')
      actions.setIsLoading(false)
      return
    }

    try {
      authLogger.debug('[SignIn Phone] Attempting phone authentication')
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: signinPhoneInput.fullValue,
        password: state.signinPhonePassword,
      })

      if (error) {
        authLogger.error('[SignIn Phone] Authentication failed', error)
        actions.setSigninPhoneError(error.message || 'Invalid phone or password')
        toast.error('Login failed: ' + (error.message || 'Invalid credentials'))
      } else if (data.user) {
        authLogger.success('[SignIn Phone] Authentication successful')
        toast.success('Login successful!')
        router.push('/app/dashboard')
      }
    } catch (error) {
      authLogger.error('[SignIn Phone] Unexpected error', error)
      actions.setSigninPhoneError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // SIGN UP - EMAIL OTP SEND
  // ========================================
  async function handleSignUpEmailSendOtp(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setSignupEmailError(null)

    // Validate email
    const emailValidation = validateEmail(state.signupEmailAddress)
    if (!emailValidation.valid) {
      actions.setSignupEmailError(emailValidation.error || 'Invalid email')
      actions.setIsLoading(false)
      return
    }

    try {
      const result = await requestOtp(state.signupEmailAddress.trim()) as any
      if (!result.success) {
        // Check if email already exists - redirect to login
        if (result.exists) {
          authLogger.debug('[SignUp Email] Email already exists, redirecting to login')
          toast.error(result.error || 'This email is already registered')
          // Switch to signin tab with email prefilled
          actions.setSigninEmailAddress(state.signupEmailAddress)
          actions.setMainStep('signin')
          actions.setSigninTab('email')
        } else {
          actions.setSignupEmailError(result.error || 'Failed to send OTP')
          toast.error(result.error || 'Failed to send OTP')
        }
      } else {
        toast.success('OTP sent to your email!')
        actions.setSignupEmailOtpSent(true)
      }
    } catch (error) {
      authLogger.error('[SignUp Email] Failed to send OTP', error)
      actions.setSignupEmailError('Failed to send OTP')
      toast.error('Failed to send OTP')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // SIGN UP - EMAIL OTP VERIFY & CREATE
  // ========================================
  async function handleSignUpEmailVerifyAndCreate(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setSignupEmailError(null)

    // Validate inputs
    const passwordValidation = validatePassword(state.signupEmailPassword)
    if (!passwordValidation.valid) {
      actions.setSignupEmailError(passwordValidation.error || 'Invalid password')
      actions.setIsLoading(false)
      return
    }

    const matchValidation = validatePasswordMatch(
      state.signupEmailPassword,
      state.signupEmailPasswordConfirm
    )
    if (!matchValidation.valid) {
      actions.setSignupEmailError(matchValidation.error || 'Passwords do not match')
      actions.setIsLoading(false)
      return
    }

    try {
      // Verify OTP and create account
      const { data, error } = await supabase.auth.verifyOtp({
        email: state.signupEmailAddress,
        token: signupEmailOtpInput.value,
        type: 'email',
      })

      if (error) {
        authLogger.error('[SignUp Email] Verification failed', error)
        actions.setSignupEmailError(error.message || 'Failed to verify OTP')
        toast.error(error.message || 'OTP verification failed')
        return
      }

      if (!data.user) {
        actions.setSignupEmailError('Verification failed')
        toast.error('Email verification failed')
        return
      }

      // Set password
      const { error: updateError } = await supabase.auth.updateUser({
        password: state.signupEmailPassword,
      })

      if (updateError) {
        authLogger.error('[SignUp Email] Failed to set password', updateError)
        actions.setSignupEmailError('Failed to set password')
        toast.error('Failed to set password')
        return
      }

      toast.success('Account created successfully! 🎉')
      actions.resetSignupEmail()
      router.push('/app/dashboard')
    } catch (error) {
      authLogger.error('[SignUp Email] Unexpected error', error)
      actions.setSignupEmailError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // SIGN UP - PHONE OTP SEND
  // ========================================
  async function handleSignUpPhoneSendOtp(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setSignupPhoneError(null)

    // Validate phone
    const phoneValidation = validatePhone(signupPhoneInput.fullValue)
    if (!phoneValidation.valid) {
      actions.setSignupPhoneError(phoneValidation.error || 'Invalid phone')
      actions.setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: signupPhoneInput.fullValue,
      })

      if (error) {
        authLogger.error('[SignUp Phone] Failed to send OTP', error)
        actions.setSignupPhoneError(error.message || 'Failed to send OTP')
        toast.error(error.message || 'Failed to send OTP')
      } else {
        toast.success('OTP sent to your phone!')
        actions.setSignupPhoneOtpStep('verify')
      }
    } catch (error) {
      authLogger.error('[SignUp Phone] Error sending OTP', error)
      actions.setSignupPhoneError('Failed to send OTP')
      toast.error('Failed to send OTP')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // SIGN UP - PHONE OTP VERIFY & CREATE
  // ========================================
  async function handleSignUpPhoneVerifyOtp(e: React.FormEvent) {
    e.preventDefault()

    // Validate password
    const passwordValidation = validatePassword(state.signupPhonePassword)
    if (!passwordValidation.valid) {
      actions.setSignupPhoneError(passwordValidation.error || 'Invalid password')
      return
    }

    const matchValidation = validatePasswordMatch(
      state.signupPhonePassword,
      state.signupPhonePasswordConfirm
    )
    if (!matchValidation.valid) {
      actions.setSignupPhoneError(matchValidation.error || 'Passwords do not match')
      return
    }

    actions.setIsLoading(true)
    actions.setSignupPhoneError(null)

    try {
      authLogger.debug('[SignUp Phone] Verifying OTP')
      const { data, error } = await supabase.auth.verifyOtp({
        phone: signupPhoneInput.fullValue,
        token: signupPhoneOtpInput.value,
        type: 'sms',
      })

      if (error) {
        authLogger.error('[SignUp Phone] OTP verification failed', error)
        toast.error(error.message)
        return
      }

      if (!data.user) {
        authLogger.error('[SignUp Phone] No user returned')
        toast.error('Verification failed')
        return
      }

      authLogger.debug('[SignUp Phone] Setting password')
      const { error: updateError } = await supabase.auth.updateUser({
        password: state.signupPhonePassword,
      })

      if (updateError) {
        authLogger.error('[SignUp Phone] Failed to set password', updateError)
        toast.error('Failed to set password')
        return
      }

      authLogger.success('[SignUp Phone] Account created successfully')
      toast.success('Account created! 🎉')
      actions.resetSignupPhone()
      router.push('/app/dashboard')
    } catch (error) {
      authLogger.error('[SignUp Phone] Unexpected error', error)
      toast.error('Failed to verify OTP')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // SIGN UP - GUEST JOIN CLASS
  // ========================================
  async function handleGuestJoinClass(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setGuestError(null)

    // Validate inputs
    const codeValidation = validateClassCode(state.guestClassCode)
    const pinValidation = validatePIN(state.guestPin)

    if (!codeValidation.valid || !pinValidation.valid) {
      const error = !codeValidation.valid ? codeValidation.error : pinValidation.error
      actions.setGuestError(error || 'Invalid input')
      actions.setIsLoading(false)
      return
    }

    try {
      // First, sign in anonymously
      const { error: anonError } = await supabase.auth.signInAnonymously()

      if (anonError) {
        actions.setGuestError(anonError.message)
        toast.error(anonError.message)
        actions.setIsLoading(false)
        return
      }

      // Then join class
      const result = await joinClass({
        classCode: state.guestClassCode.toUpperCase().trim(),
        rollNumber: state.guestRollNumber.trim(),
        pin: state.guestPin.trim(),
      })

      if (result.success) {
        toast.success('Successfully joined class! 🎉')
        actions.resetGuest()
        router.push('/app/student/classes')
      } else {
        actions.setGuestError(result.error || 'Failed to join class')
        toast.error(result.error || 'Failed to join class')
      }
    } catch (error) {
      authLogger.error('[Guest Join] Failed to join class', error)
      actions.setGuestError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // FORGOT PASSWORD - SEND OTP
  // ========================================
  async function handleForgotPasswordOtp(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setForgotPasswordError(null)

    // Validate email
    const emailValidation = validateEmail(state.forgotPasswordEmail)
    if (!emailValidation.valid) {
      actions.setForgotPasswordError(emailValidation.error || 'Invalid email')
      actions.setIsLoading(false)
      return
    }

    try {
      const result = await sendForgotPasswordOtp(state.forgotPasswordEmail.trim())
      if (!result.success) {
        actions.setForgotPasswordError(result.error || 'Failed to send recovery code')
        toast.error(result.error || 'Failed to send recovery code')
      } else {
        toast.success('Recovery code sent to your email!')
        actions.setForgotPasswordStep('reset')
      }
    } catch (error) {
      authLogger.error('[Forgot Password] Failed to send recovery code', error)
      actions.setForgotPasswordError('Failed to send recovery code')
      toast.error('Failed to send recovery code')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // FORGOT PASSWORD - RESET
  // ========================================
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()

    // Validate password
    const passwordValidation = validatePassword(state.forgotPasswordNewPassword)
    if (!passwordValidation.valid) {
      actions.setForgotPasswordError(passwordValidation.error || 'Invalid password')
      return
    }

    const matchValidation = validatePasswordMatch(
      state.forgotPasswordNewPassword,
      state.forgotPasswordNewPasswordConfirm
    )
    if (!matchValidation.valid) {
      actions.setForgotPasswordError(matchValidation.error || 'Passwords do not match')
      return
    }

    actions.setIsLoading(true)
    actions.setForgotPasswordError(null)

    try {
      const result = await resetPasswordWithOtp(
        state.forgotPasswordEmail,
        forgotPasswordOtpInput.value,
        state.forgotPasswordNewPassword
      )

      if (!result.success) {
        actions.setForgotPasswordError(result.error || 'Failed to reset password')
        toast.error(result.error || 'Failed to reset password')
      } else {
        toast.success('Password reset successfully!')
        actions.resetForgotPassword()
        actions.setMainStep('signin')
      }
    } catch (error) {
      authLogger.error('[Forgot Password] Failed to reset password', error)
      actions.setForgotPasswordError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      actions.setIsLoading(false)
    }
  }

  // ========================================
  // RENDER: SIGN IN
  // ========================================
  if (state.mainStep === 'signin') {
    return (
      <AuthCard
        title="Sign In"
        description="Choose your sign-in method"
      >
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => actions.setSigninTab('email')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                state.signinTab === 'email'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-text-secondary hover:bg-muted/80'
              }`}
              disabled={state.isLoading}
            >
              📧 Email
            </button>
            <button
              onClick={() => actions.setSigninTab('phone')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                state.signinTab === 'phone'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-text-secondary hover:bg-muted/80'
              }`}
              disabled={state.isLoading}
            >
              📱 Phone
            </button>
          </div>

          {/* Email Sign In Form */}
          {state.signinTab === 'email' && (
            <form onSubmit={handleSignInEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email Address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={state.signinEmailAddress}
                  onChange={(e) => actions.setSigninEmailAddress(e.target.value)}
                  required
                  disabled={state.isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={state.signinEmailPassword}
                  onChange={(e) => actions.setSigninEmailPassword(e.target.value)}
                  required
                  disabled={state.isLoading}
                />
                {state.signinEmailError && (
                  <p className="text-sm text-red-600">{state.signinEmailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                disabled={state.isLoading || !state.signinEmailAddress || !state.signinEmailPassword}
                loading={state.isLoading}
              >
                Sign In
                <span className="ml-2">→</span>
              </Button>

              <div className="text-center space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => actions.setMainStep('forgot-password')}
                  className="text-primary hover:underline block w-full"
                  disabled={state.isLoading}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => actions.setMainStep('signup')}
                  className="text-text-secondary hover:underline block w-full"
                  disabled={state.isLoading}
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </form>
          )}

          {/* Phone Sign In Form */}
          {state.signinTab === 'phone' && (
            <form onSubmit={handleSignInPhone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-phone">Phone Number</Label>
                <div className="flex items-center border border-input rounded-md">
                  <span className="px-3 text-text-secondary font-medium bg-muted">+91</span>
                  <Input
                    id="signin-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={signinPhoneInput.displayValue}
                    onChange={(e) => signinPhoneInput.onChange(e.target.value)}
                    required
                    disabled={state.isLoading}
                    className="border-0 flex-1"
                    maxLength={12}
                  />
                </div>
                <p className="text-xs text-text-secondary">
                  Enter your 10-digit phone number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-phone-password">Password</Label>
                <Input
                  id="signin-phone-password"
                  type="password"
                  placeholder="Enter your password"
                  value={state.signinPhonePassword}
                  onChange={(e) => actions.setSigninPhonePassword(e.target.value)}
                  required
                  disabled={state.isLoading}
                />
                {state.signinPhoneError && (
                  <p className="text-sm text-red-600">{state.signinPhoneError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                disabled={state.isLoading || signinPhoneInput.displayValue.length < PHONE_DIGIT_LENGTH || !state.signinPhonePassword}
                loading={state.isLoading}
              >
                Sign In
                <span className="ml-2">→</span>
              </Button>

              <div className="text-center space-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => actions.setMainStep('forgot-password')}
                  className="text-primary hover:underline block w-full"
                  disabled={state.isLoading}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => actions.setMainStep('signup')}
                  className="text-text-secondary hover:underline block w-full"
                  disabled={state.isLoading}
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </form>
          )}
        </div>
      </AuthCard>
    )
  }

  // ========================================
  // RENDER: SIGN UP
  // ========================================
  if (state.mainStep === 'signup') {
    return (
      <AuthCard
        title="Create Account"
        description="Choose your sign-up method"
      >
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => actions.setSignupTab('email')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                state.signupTab === 'email'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-text-secondary hover:bg-muted/80'
              }`}
              disabled={state.isLoading}
            >
              📧 Email
            </button>
            <button
              onClick={() => actions.setSignupTab('phone')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                state.signupTab === 'phone'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-text-secondary hover:bg-muted/80'
              }`}
              disabled={state.isLoading}
            >
              📱 Phone
            </button>
            <button
              onClick={() => actions.setSignupTab('guest')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                state.signupTab === 'guest'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-text-secondary hover:bg-muted/80'
              }`}
              disabled={state.isLoading}
            >
              👤 Guest
            </button>
          </div>

          {/* Email Sign Up Form */}
          {state.signupTab === 'email' && (
            <>
              {!state.signupEmailOtpSent ? (
                <form onSubmit={handleSignUpEmailSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={state.signupEmailAddress}
                      onChange={(e) => actions.setSignupEmailAddress(e.target.value)}
                      required
                      disabled={state.isLoading}
                    />
                    {state.signupEmailError && (
                      <p className="text-sm text-red-600">{state.signupEmailError}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                    disabled={state.isLoading || !state.signupEmailAddress}
                    loading={state.isLoading}
                  >
                    Send OTP
                    <span className="ml-2">→</span>
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUpEmailVerifyAndCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email-otp">Verification Code</Label>
                    <Input
                      id="signup-email-otp"
                      type="text"
                      placeholder="123456"
                      value={signupEmailOtpInput.value}
                      onChange={(e) => signupEmailOtpInput.onChange(e.target.value)}
                      required
                      disabled={state.isLoading}
                      maxLength={OTP_LENGTH}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-text-secondary">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email-password">Password</Label>
                    <Input
                      id="signup-email-password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={state.signupEmailPassword}
                      onChange={(e) => actions.setSignupEmailPassword(e.target.value)}
                      required
                      disabled={state.isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email-password-confirm">Confirm Password</Label>
                    <Input
                      id="signup-email-password-confirm"
                      type="password"
                      placeholder="Re-enter your password"
                      value={state.signupEmailPasswordConfirm}
                      onChange={(e) => actions.setSignupEmailPasswordConfirm(e.target.value)}
                      required
                      disabled={state.isLoading}
                    />
                    {state.signupEmailError && (
                      <p className="text-sm text-red-600">{state.signupEmailError}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                    disabled={
                      state.isLoading ||
                      signupEmailOtpInput.value.length !== OTP_LENGTH ||
                      !state.signupEmailPassword ||
                      !state.signupEmailPasswordConfirm
                    }
                    loading={state.isLoading}
                  >
                    Create Account
                    <span className="ml-2">→</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      actions.setSignupEmailOtpSent(false)
                      signupEmailOtpInput.reset()
                    }}
                    className="text-sm text-text-secondary hover:underline block w-full text-center"
                    disabled={state.isLoading}
                  >
                    Change email
                  </button>
                </form>
              )}
            </>
          )}

          {/* Phone Sign Up Form */}
          {state.signupTab === 'phone' && (
            <>
              {state.signupPhoneOtpStep === 'phone' ? (
                <form onSubmit={handleSignUpPhoneSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <div className="flex items-center border border-input rounded-md">
                      <span className="px-3 text-text-secondary font-medium bg-muted">+91</span>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={signupPhoneInput.displayValue}
                        onChange={(e) => signupPhoneInput.onChange(e.target.value)}
                        required
                        disabled={state.isLoading}
                        className="border-0 flex-1"
                        maxLength={12}
                      />
                    </div>
                    <p className="text-xs text-text-secondary">
                      Enter your 10-digit phone number
                    </p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-primary p-3 rounded">
                    <p className="text-xs text-orange-800">
                      <strong>📱 SMS Verification:</strong> You'll receive a 6-digit code via SMS. Standard rates may apply.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                    disabled={state.isLoading || signupPhoneInput.displayValue.length < PHONE_DIGIT_LENGTH}
                    loading={state.isLoading}
                  >
                    Send OTP
                    <span className="ml-2">→</span>
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignUpPhoneVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone-otp">Verification Code</Label>
                    <Input
                      id="signup-phone-otp"
                      type="text"
                      placeholder="123456"
                      value={signupPhoneOtpInput.value}
                      onChange={(e) => signupPhoneOtpInput.onChange(e.target.value)}
                      required
                      disabled={state.isLoading}
                      maxLength={OTP_LENGTH}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-text-secondary">
                      Enter the 6-digit code sent to your phone
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone-password">Password</Label>
                    <Input
                      id="signup-phone-password"
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={state.signupPhonePassword}
                      onChange={(e) => actions.setSignupPhonePassword(e.target.value)}
                      required
                      disabled={state.isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone-password-confirm">Confirm Password</Label>
                    <Input
                      id="signup-phone-password-confirm"
                      type="password"
                      placeholder="Re-enter your password"
                      value={state.signupPhonePasswordConfirm}
                      onChange={(e) => actions.setSignupPhonePasswordConfirm(e.target.value)}
                      required
                      disabled={state.isLoading}
                    />
                    {state.signupPhoneError && (
                      <p className="text-sm text-red-600">{state.signupPhoneError}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                    disabled={
                      state.isLoading ||
                      signupPhoneOtpInput.value.length !== OTP_LENGTH ||
                      !state.signupPhonePassword ||
                      !state.signupPhonePasswordConfirm
                    }
                    loading={state.isLoading}
                  >
                    Create Account
                    <span className="ml-2">→</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => actions.setSignupPhoneOtpStep('phone')}
                    className="text-sm text-text-secondary hover:underline block w-full text-center"
                    disabled={state.isLoading}
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </>
          )}

          {/* Guest Join Class Form */}
          {state.signupTab === 'guest' && (
            <form onSubmit={handleGuestJoinClass} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest-class-code">Class Code</Label>
                <Input
                  id="guest-class-code"
                  type="text"
                  placeholder="A3F7E2"
                  value={state.guestClassCode}
                  onChange={(e) => actions.setGuestClassCode(sanitizeClassCode(e.target.value))}
                  required
                  disabled={state.isLoading}
                  maxLength={CLASS_CODE_LENGTH}
                  className="uppercase font-mono text-center text-xl tracking-widest"
                />
                <p className="text-xs text-text-secondary">
                  6-character code provided by your teacher
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-roll-number">Roll Number</Label>
                <Input
                  id="guest-roll-number"
                  type="text"
                  placeholder="e.g., 101, ST2024001"
                  value={state.guestRollNumber}
                  onChange={(e) => actions.setGuestRollNumber(e.target.value)}
                  required
                  disabled={state.isLoading}
                />
                <p className="text-xs text-text-secondary">
                  Your student roll number or ID
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-pin">Class PIN</Label>
                <Input
                  id="guest-pin"
                  type="password"
                  placeholder="••••"
                  value={state.guestPin}
                  onChange={(e) => actions.setGuestPin(sanitizePIN(e.target.value))}
                  required
                  disabled={state.isLoading}
                  maxLength={PIN_LENGTH}
                  className="text-center text-2xl font-mono tracking-widest"
                />
                <p className="text-xs text-text-secondary">
                  4-digit PIN provided by your teacher
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <p className="text-xs text-blue-800">
                  <strong>📌 Note:</strong> Your teacher will verify your enrollment.
                  Make sure to use the correct roll number.
                </p>
              </div>

              {state.guestError && (
                <p className="text-sm text-red-600">{state.guestError}</p>
              )}

              <Button
                type="submit"
                className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                disabled={
                  state.isLoading ||
                  !state.guestClassCode ||
                  !state.guestRollNumber ||
                  state.guestPin.length !== PIN_LENGTH
                }
                loading={state.isLoading}
              >
                Join Class
                <span className="ml-2">→</span>
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => actions.setMainStep('signin')}
              className="text-primary hover:underline"
              disabled={state.isLoading}
            >
              Sign in
            </button>
          </div>
        </div>
      </AuthCard>
    )
  }

  // ========================================
  // RENDER: FORGOT PASSWORD
  // ========================================
  if (state.mainStep === 'forgot-password') {
    return (
      <AuthCard
        title="Reset Password"
        description="Recover your account"
      >
        <div className="space-y-4">
          {state.forgotPasswordStep === 'email' ? (
            <form onSubmit={handleForgotPasswordOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={state.forgotPasswordEmail}
                  onChange={(e) => actions.setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={state.isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                disabled={state.isLoading || !state.forgotPasswordEmail}
                loading={state.isLoading}
              >
                Send Recovery Code
                <span className="ml-2">→</span>
              </Button>

              <button
                type="button"
                onClick={() => actions.setMainStep('signin')}
                className="text-sm text-text-secondary hover:underline block w-full text-center"
                disabled={state.isLoading}
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-otp">Recovery Code</Label>
                <Input
                  id="forgot-otp"
                  type="text"
                  placeholder="123456"
                  value={forgotPasswordOtpInput.value}
                  onChange={(e) => forgotPasswordOtpInput.onChange(e.target.value)}
                  required
                  disabled={state.isLoading}
                  maxLength={OTP_LENGTH}
                  className="text-center text-2xl font-mono tracking-widest"
                />
                <p className="text-xs text-text-secondary">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forgot-new-password">New Password</Label>
                <Input
                  id="forgot-new-password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={state.forgotPasswordNewPassword}
                  onChange={(e) => actions.setForgotPasswordNewPassword(e.target.value)}
                  required
                  disabled={state.isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forgot-confirm-password">Confirm Password</Label>
                <Input
                  id="forgot-confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={state.forgotPasswordNewPasswordConfirm}
                  onChange={(e) => actions.setForgotPasswordNewPasswordConfirm(e.target.value)}
                  required
                  disabled={state.isLoading}
                />
                {state.forgotPasswordError && (
                  <p className="text-sm text-red-600">{state.forgotPasswordError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
                disabled={
                  state.isLoading ||
                  forgotPasswordOtpInput.value.length !== OTP_LENGTH ||
                  !state.forgotPasswordNewPassword ||
                  !state.forgotPasswordNewPasswordConfirm
                }
                loading={state.isLoading}
              >
                Reset Password
                <span className="ml-2">→</span>
              </Button>

              <button
                type="button"
                onClick={() => actions.setForgotPasswordStep('email')}
                className="text-sm text-text-secondary hover:underline block w-full text-center"
                disabled={state.isLoading}
              >
                Change email
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              actions.resetForgotPassword()
              actions.setMainStep('signin')
            }}
            className="text-sm text-text-secondary hover:underline block w-full text-center"
            disabled={state.isLoading}
          >
            Back to sign in
          </button>
        </div>
      </AuthCard>
    )
  }

  // Fallback
  return null
}
