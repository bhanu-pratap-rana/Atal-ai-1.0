'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { validateEmail } from '@/lib/validation-utils'
import { createClient } from '@/lib/supabase-browser'
import { authLogger } from '@/lib/auth-logger'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { AuthState, AuthActions } from '@/hooks/useAuthState'

interface SignInEmailFormProps {
  state: AuthState
  actions: AuthActions
  isLoading: boolean
  onSuccess: () => void
}

export function SignInEmailForm({ state, actions, isLoading, onSuccess }: SignInEmailFormProps) {
  const router = useRouter()
  const supabase = createClient()

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
        onSuccess()
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

  return (
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
          disabled={isLoading}
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
          disabled={isLoading}
        />
        {state.signinEmailError && (
          <p className="text-sm text-red-600">{state.signinEmailError}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
        disabled={isLoading || !state.signinEmailAddress || !state.signinEmailPassword}
        loading={isLoading}
      >
        Sign In
        <span className="ml-2">→</span>
      </Button>

      <div className="text-center space-y-2 text-sm">
        <button
          type="button"
          onClick={() => actions.setMainStep('forgot-password')}
          className="text-primary hover:underline block w-full"
          disabled={isLoading}
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={() => actions.setMainStep('signup')}
          className="text-text-secondary hover:underline block w-full"
          disabled={isLoading}
        >
          Don&apos;t have an account? Sign up
        </button>
      </div>
    </form>
  )
}
