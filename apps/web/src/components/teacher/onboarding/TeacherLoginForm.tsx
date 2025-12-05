'use client'

import { FormEvent } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

interface TeacherLoginFormProps {
  email: string
  password: string
  error: string
  loading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  onForgotPassword: () => void
  onBack: () => void
}

export function TeacherLoginForm({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onBack,
}: TeacherLoginFormProps) {
  return (
    <AuthCard title="Login to Your Account" description="Enter your credentials">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="bg-error-light border border-error/30 rounded-[12px] p-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="login-email">Email Address</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
            autoComplete="email"
            required
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </div>

        {/* Submit Button - Uses primary gradient */}
        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          size="lg"
          className="w-full"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Forgot Password Link - Uses primary color */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading}
            className="text-sm text-primary hover:text-primary-dark hover:underline disabled:text-gray-400 transition-colors"
          >
            Forgot your password?
          </button>
        </div>

        {/* Back Button */}
        <Button
          type="button"
          onClick={onBack}
          disabled={loading}
          variant="ghost"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Options
        </Button>
      </form>
    </AuthCard>
  )
}
