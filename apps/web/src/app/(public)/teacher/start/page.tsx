'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-browser'
import { verifyTeacher } from '@/app/actions/school'
import {
  sendEmailOtp,
  verifyEmailOtp,
  setPassword as setUserPassword,
  saveTeacherProfile,
} from '@/app/actions/teacher-onboard'
import {
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from '@/app/actions/auth'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import zxcvbn from 'zxcvbn'

type Step = 'choice' | 'login' | 'forgot-password' | 'reset-password' | 'auth' | 'set-password' | 'verify-school' | 'profile' | 'complete'

export default function TeacherStartPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('choice')
  const [loading, setLoading] = useState(false)

  // Login: Email & Password
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Forgot Password: Email
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')

  // Step 1: Email OTP Auth (for signup)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Step 1C: Password Creation
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordStrength, setPasswordStrength] = useState<number>(0)

  // Step 2: School Verification
  const [schoolCode, setSchoolCode] = useState('')
  const [staffPin, setStaffPin] = useState('')
  const [verifiedSchoolName, setVerifiedSchoolName] = useState('')
  const [verifiedSchoolId, setVerifiedSchoolId] = useState('')

  // Step 3: Teacher Profile
  const [teacherName, setTeacherName] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')

  // Check if already authenticated and has completed registration
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Check if user already has a teacher profile (already completed registration)
        const { data: profile } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (profile) {
          // Already registered, redirect to dashboard
          toast.success('You are already registered!')
          router.push('/app/teacher/classes')
        } else {
          // Has session but no profile - sign them out to start fresh
          await supabase.auth.signOut()
          toast.info('Please complete the registration process')
        }
      }
    }
    checkAuth()
  }, [supabase, router])

  // LOGIN: Email & Password Authentication
  async function handleTeacherLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')

    try {
      console.log('🔐 [Teacher Login] Starting login with email:', loginEmail.trim())

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })

      console.log('🔐 [Teacher Login] Auth response:', { hasData: !!data, hasError: !!error })

      if (error) {
        console.error('🔐 [Teacher Login] Auth error:', error.message)
        setLoginError(error.message || 'Invalid email or password')
        toast.error('Login failed: ' + (error.message || 'Invalid credentials'))
      } else if (data.user) {
        console.log('🔐 [Teacher Login] User authenticated:', data.user.id)

        // Check if teacher profile exists
        try {
          const { data: profile, error: profileError } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single()

          console.log('🔐 [Teacher Login] Profile fetch result:', { hasProfile: !!profile, hasError: !!profileError })

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('🔐 [Teacher Login] Profile error:', profileError)
            toast.error('Error checking profile: ' + profileError.message)
            await supabase.auth.signOut()
          } else if (profile) {
            console.log('🔐 [Teacher Login] Profile found, redirecting...')
            toast.success('Login successful!')
            router.push('/app/teacher/classes')
          } else {
            console.warn('🔐 [Teacher Login] Profile not found')
            toast.error('Teacher profile not found. Please complete registration.')
            await supabase.auth.signOut()
          }
        } catch (profileErr) {
          console.error('🔐 [Teacher Login] Exception checking profile:', profileErr)
          toast.error('Error checking profile')
          await supabase.auth.signOut()
        }
      }
    } catch (error) {
      console.error('🔐 [Teacher Login] Unexpected error:', error)
      setLoginError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password: Send OTP
  async function handleForgotPasswordOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await sendForgotPasswordOtp(forgotEmail)

      if (result.success) {
        toast.success('Recovery code sent to your email!')
        setForgotOtpSent(true)
      } else {
        toast.error(result.error || 'Failed to send recovery code')
      }
    } catch (error) {
      toast.error('Failed to send recovery code')
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password: Reset password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()

    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (forgotNewPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const result = await resetPasswordWithOtp(forgotEmail, forgotOtp, forgotNewPassword)

      if (result.success) {
        toast.success('Password reset successfully! ✓')
        // Reset form and go back to login
        setForgotEmail('')
        setForgotOtp('')
        setForgotNewPassword('')
        setForgotConfirmPassword('')
        setForgotOtpSent(false)
        setStep('login')
        setLoginEmail(forgotEmail)
      } else {
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (error) {
      toast.error('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // STEP 1A: Send Email OTP
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await sendEmailOtp(email)

      if (result.success) {
        toast.success('OTP sent to your email!')
        setOtpSent(true)
      } else {
        // Check if email already exists
        if ((result as any).exists) {
          toast.error(result.error)
          // Redirect to login with email prefilled
          setLoginEmail(email)
          setEmail('')
          setOtp('')
          setOtpSent(false)
          setStep('login')
        } else {
          toast.error(result.error || 'Failed to send OTP')
        }
      }
    } catch (error) {
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // STEP 1B: Verify OTP
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await verifyEmailOtp({ email, token: otp })

      if (result.success) {
        toast.success('Email verified! ✓')
        setStep('set-password')
      } else {
        toast.error(result.error || 'Failed to verify OTP')
      }
    } catch (error) {
      toast.error('Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  // STEP 1C: Set Password
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate password
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long')
        setLoading(false)
        return
      }

      if (password !== passwordConfirm) {
        toast.error('Passwords do not match')
        setLoading(false)
        return
      }

      const result = await setUserPassword(password)

      if (result.success) {
        toast.success('Password set successfully! ✓')
        setStep('verify-school')
      } else {
        toast.error(result.error || 'Failed to set password')
      }
    } catch (error) {
      toast.error('Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  // Handle password strength calculation
  function handlePasswordChange(value: string) {
    setPassword(value)
    if (value.length > 0) {
      const result = zxcvbn(value)
      setPasswordStrength(result.score)
    } else {
      setPasswordStrength(0)
    }
  }

  // STEP 2: School Verification
  async function handleSchoolVerification(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Call server action to verify school credentials (without creating profile yet)
      const result = await verifyTeacher({
        schoolCode: schoolCode.toUpperCase().trim(),
        staffPin: staffPin.trim(),
        teacherName: '', // Will be filled in next step
        phone: '',
        subject: '',
      })

      if (result.success && result.schoolId && result.schoolName) {
        // Store verified school info for next step
        setVerifiedSchoolName(result.schoolName)
        setVerifiedSchoolId(result.schoolId)
        toast.success(`School verified: ${result.schoolName}`)
        setStep('profile')
      } else {
        toast.error(result.error || 'Verification failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // STEP 3: Teacher Profile
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Save teacher profile with verified school info
      const result = await saveTeacherProfile({
        name: teacherName.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim() || undefined,
        schoolId: verifiedSchoolId,
        schoolCode: schoolCode.toUpperCase().trim(),
      })

      if (result.success) {
        toast.success('Teacher registration complete! 🎉')
        setStep('complete')
        setTimeout(() => {
          router.push('/app/teacher/classes')
        }, 2000)
      } else {
        toast.error(result.error || 'Profile creation failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Render based on current step
  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="Teacher Portal"
          description="Are you a new or existing teacher?"
        >
          <div className="space-y-4">
            {/* Create Account Button */}
            <Button
              onClick={() => setStep('auth')}
              className="w-full h-14 text-base shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5 transition-all"
              variant="default"
            >
              <span className="text-xl mr-3">✨</span>
              <div className="text-left">
                <div className="font-semibold">Create New Account</div>
                <div className="text-xs font-normal opacity-90">
                  New teacher registration
                </div>
              </div>
            </Button>

            {/* Login Button */}
            <Button
              onClick={() => setStep('login')}
              className="w-full h-14 text-base border-2 hover:border-primary hover:shadow-[0_4px_12px_rgba(255,140,66,0.15)] hover:-translate-y-0.5 transition-all"
              variant="outline"
            >
              <span className="text-xl mr-3">🔓</span>
              <div className="text-left">
                <div className="font-semibold">Login to Account</div>
                <div className="text-xs font-normal opacity-70">
                  Existing teacher login
                </div>
              </div>
            </Button>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Choose your option:</strong>
                <br />
                <span className="text-xs">
                  New teachers need school verification. Existing teachers can login with email & password.
                </span>
              </p>
            </div>

            {/* Back Button */}
            <div className="text-center pt-2">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-text-secondary hover:text-primary hover:underline"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </AuthCard>
      </div>
    )
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="Teacher Login"
          description="Sign in with your registered email and password"
        >
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="teacher@school.edu"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-text-secondary">
                Your registered email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={loading}
              />
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
              disabled={loading || !loginEmail || !loginPassword}
              loading={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="space-y-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(loginEmail)
                  setStep('forgot-password')
                }}
                className="text-sm text-orange-600 hover:text-orange-700 hover:underline w-full text-center"
                disabled={loading}
              >
                Forgot your password?
              </button>
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="text-sm text-primary hover:underline w-full text-center"
                disabled={loading}
              >
                Back to options
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="text-sm text-text-secondary hover:text-primary hover:underline w-full text-center"
                disabled={loading}
              >
                Back to home
              </button>
            </div>
          </form>
        </AuthCard>
      </div>
    )
  }

  if (step === 'auth') {
    if (!otpSent) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
          <AuthCard
            title="Teacher Registration"
            description="Step 1 of 4: Email Verification"
          >
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-text-secondary">
                  We'll send a verification code to this email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
                disabled={loading}
                loading={loading}
              >
                Send Verification Code
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-sm text-text-secondary hover:text-primary hover:underline"
                  disabled={loading}
                >
                  Back to home
                </button>
              </div>
            </form>
          </AuthCard>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="Verify Email"
          description={`Enter the code sent to ${email}`}
        >
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                required
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
              disabled={loading || otp.length !== 6}
              loading={loading}
            >
              Verify Email
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Use different email
              </button>
            </div>
          </form>
        </AuthCard>
      </div>
    )
  }

  if (step === 'set-password') {
    const getPasswordStrengthLabel = () => {
      if (password.length === 0) return ''
      const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
      return labels[passwordStrength] || ''
    }

    const getPasswordStrengthColor = () => {
      const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-blue-500',
        'bg-green-500',
      ]
      return colors[passwordStrength] || 'bg-gray-300'
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="Create Password"
          description="Step 2 of 4: Secure your account"
        >
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 8 characters)"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= passwordStrength
                            ? getPasswordStrengthColor()
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary">
                    Strength: {getPasswordStrengthLabel()}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-confirm">Confirm Password</Label>
              <Input
                id="password-confirm"
                type="password"
                placeholder="Re-enter password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="text-xs text-blue-900">
                <strong>🔒 Why a password?</strong>
                <br />
                A password enables account recovery and allows you to access your
                account from multiple devices securely.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
              disabled={
                loading ||
                password.length < 8 ||
                password !== passwordConfirm ||
                passwordStrength < 2
              }
              loading={loading}
            >
              Set Password & Continue
            </Button>
          </form>
        </AuthCard>
      </div>
    )
  }

  if (step === 'verify-school') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="School Verification"
          description="Step 3 of 4: Verify your school credentials"
        >
          <form onSubmit={handleSchoolVerification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school-code">School Code</Label>
              <Input
                id="school-code"
                type="text"
                placeholder="14H0182"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
                maxLength={10}
                className="uppercase font-mono"
              />
              <p className="text-xs text-text-secondary">
                SEBA school code (e.g., 14H0182)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-pin">Staff PIN</Label>
              <Input
                id="staff-pin"
                type="password"
                placeholder="Enter staff PIN"
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                required
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-text-secondary">
                Provided by your school administrator
              </p>
            </div>

            <div className="bg-orange-50 border-l-4 border-primary p-3 rounded">
              <p className="text-xs text-orange-900">
                <strong>🔒 Secure Verification</strong>
                <br />
                Your credentials are verified using bcrypt encryption. Staff PINs
                are never exposed to clients.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
              disabled={loading}
              loading={loading}
            >
              Verify School
            </Button>
          </form>
        </AuthCard>
      </div>
    )
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="Teacher Profile"
          description="Step 4 of 4: Complete your profile"
        >
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Display verified school info */}
            {verifiedSchoolName && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                <p className="text-sm text-green-900">
                  <strong>✓ School Verified</strong>
                  <br />
                  <span className="text-xs">
                    {verifiedSchoolName} ({schoolCode.toUpperCase()})
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                type="text"
                placeholder="Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
              disabled={loading}
              loading={loading}
            >
              Complete Registration
            </Button>
          </form>
        </AuthCard>
      </div>
    )
  }

  // Forgot Password: Request OTP
  if (step === 'forgot-password' && !forgotOtpSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="Reset Password"
          description="Enter your email to receive a recovery code"
        >
          <form onSubmit={handleForgotPasswordOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="teacher@school.edu"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-text-secondary">
                We'll send a recovery code to this email
              </p>
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
              disabled={loading || !forgotEmail}
              loading={loading}
            >
              {loading ? 'Sending...' : 'Send Recovery Code'}
            </Button>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('login')
                  setForgotEmail('')
                  setForgotOtpSent(false)
                }}
                className="text-sm text-primary hover:underline w-full text-center"
                disabled={loading}
              >
                Back to login
              </button>
            </div>
          </form>
        </AuthCard>
      </div>
    )
  }

  // Forgot Password: Verify OTP and Reset
  if (step === 'forgot-password' && forgotOtpSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard
          title="Reset Password"
          description={`Enter the code sent to ${forgotEmail}`}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-otp">Recovery Code</Label>
              <Input
                id="forgot-otp"
                type="text"
                placeholder="123456"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
              <p className="text-xs text-text-secondary">
                Enter the 6-digit code from your email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-new-password">New Password</Label>
              <Input
                id="forgot-new-password"
                type="password"
                placeholder="Enter new password (min 8 characters)"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forgot-confirm-password">Confirm Password</Label>
              <Input
                id="forgot-confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
              disabled={loading || forgotOtp.length !== 6 || !forgotNewPassword || !forgotConfirmPassword}
              loading={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForgotOtp('')
                  setForgotOtpSent(false)
                }}
                className="text-sm text-primary hover:underline w-full text-center"
                disabled={loading}
              >
                Back to email entry
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('login')
                  setForgotEmail('')
                  setForgotOtp('')
                  setForgotNewPassword('')
                  setForgotConfirmPassword('')
                  setForgotOtpSent(false)
                }}
                className="text-sm text-text-secondary hover:underline w-full text-center"
                disabled={loading}
              >
                Back to login
              </button>
            </div>
          </form>
        </AuthCard>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <AuthCard title="Registration Complete!" description="Welcome to ATAL AI">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <p className="text-lg font-semibold">You're all set!</p>
            <p className="text-sm text-text-secondary">
              Redirecting to your teacher dashboard...
            </p>
          </div>
        </AuthCard>
      </div>
    )
  }

  return null
}
