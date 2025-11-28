'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useAuthState } from '@/hooks/useAuthState'
import { useOTPInput } from '@/hooks/useOTPInput'
import { usePhoneInput } from '@/hooks/usePhoneInput'
import { AuthCard } from '@/components/auth/AuthCard'
import { SignInEmailForm } from './_components/SignInEmailForm'
import { SignInPhoneForm } from './_components/SignInPhoneForm'
import { SignUpEmailFlow } from './_components/SignUpEmailFlow'
import { SignUpPhoneFlow } from './_components/SignUpPhoneFlow'
import { GuestJoinForm } from './_components/GuestJoinForm'
import { ForgotPasswordFlow } from './_components/ForgotPasswordFlow'
import { TabNavigation } from './_components/TabNavigation'

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

  // Sign In Flow
  if (state.mainStep === 'signin') {
    return (
      <AuthCard title="Sign In" description="Choose your sign-in method">
        <div className="space-y-4">
          <TabNavigation
            tabs={[
              { id: 'email', label: 'Email', icon: '📧' },
              { id: 'phone', label: 'Phone', icon: '📱' },
            ]}
            activeTab={state.signinTab}
            onTabChange={(tab) => actions.setSigninTab(tab as 'email' | 'phone')}
            disabled={state.isLoading}
          />

          {state.signinTab === 'email' && (
            <SignInEmailForm
              state={state}
              actions={actions}
              isLoading={state.isLoading}
              onSuccess={() => {}}
            />
          )}

          {state.signinTab === 'phone' && (
            <SignInPhoneForm
              state={state}
              actions={actions}
              phoneInput={signinPhoneInput}
              isLoading={state.isLoading}
              onSuccess={() => {}}
            />
          )}
        </div>
      </AuthCard>
    )
  }

  // Sign Up Flow
  if (state.mainStep === 'signup') {
    return (
      <AuthCard title="Create Account" description="Choose your sign-up method">
        <div className="space-y-4">
          <TabNavigation
            tabs={[
              { id: 'email', label: 'Email', icon: '📧' },
              { id: 'phone', label: 'Phone', icon: '📱' },
              { id: 'guest', label: 'Guest', icon: '👤' },
            ]}
            activeTab={state.signupTab}
            onTabChange={(tab) => actions.setSignupTab(tab as 'email' | 'phone' | 'guest')}
            disabled={state.isLoading}
          />

          {state.signupTab === 'email' && (
            <SignUpEmailFlow
              state={state}
              actions={actions}
              otpInput={signupEmailOtpInput}
              isLoading={state.isLoading}
              onSuccess={() => {}}
            />
          )}

          {state.signupTab === 'phone' && (
            <SignUpPhoneFlow
              state={state}
              actions={actions}
              phoneInput={signupPhoneInput}
              otpInput={signupPhoneOtpInput}
              isLoading={state.isLoading}
              onSuccess={() => {}}
            />
          )}

          {state.signupTab === 'guest' && (
            <GuestJoinForm
              state={state}
              actions={actions}
              isLoading={state.isLoading}
              onSuccess={() => {}}
            />
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

  // Forgot Password Flow
  if (state.mainStep === 'forgot-password') {
    return (
      <AuthCard title="Reset Password" description="Recover your account">
        <div className="space-y-4">
          <ForgotPasswordFlow
            state={state}
            actions={actions}
            otpInput={forgotPasswordOtpInput}
            isLoading={state.isLoading}
            onSuccess={() => {}}
          />

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
