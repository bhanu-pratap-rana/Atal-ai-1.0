'use client'

import { FormEvent } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'

interface TeacherSetPasswordFormProps {
  password: string
  passwordConfirm: string
  passwordStrength: number
  loading: boolean
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

function getPasswordStrengthLabel(strength: number): string {
  if (strength === -1) return ''
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return labels[strength] || ''
}

function getPasswordStrengthColor(strength: number): string {
  // Use primary gradient colors for strength indicator
  const colors = [
    'bg-error',      // Very Weak - Red
    'bg-warning',    // Weak - Orange/Yellow
    'bg-warning',    // Fair - Orange/Yellow
    'bg-primary',    // Good - Primary Orange
    'bg-success',    // Strong - Green
  ]
  return colors[strength] || 'bg-gray-300'
}

export function TeacherSetPasswordForm({
  password,
  passwordConfirm,
  passwordStrength,
  loading,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: TeacherSetPasswordFormProps) {
  return (
    <AuthCard
      title="Create Password"
      description="Step 2 of 4: Secure your account"
    >
      <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password (min 8 characters)"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
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
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= passwordStrength
                        ? getPasswordStrengthColor(passwordStrength)
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600">
                Strength: {getPasswordStrengthLabel(passwordStrength)}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password-confirm">Confirm Password</Label>
          <Input
            id="password-confirm"
            type="password"
            placeholder="Re-enter password"
            value={passwordConfirm}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        {/* Info Box - Uses primary-light */}
        <div className="bg-primary-light border-l-4 border-primary p-3 rounded-[12px]">
          <p className="text-xs text-gray-700">
            <strong className="text-primary">🔒 Why a password?</strong>
            <br />
            A password enables account recovery and allows you to access your account from multiple devices securely.
          </p>
        </div>

        {/* Submit Button - Uses primary gradient */}
        <Button
          type="submit"
          className="w-full"
          loading={loading}
          disabled={
            loading ||
            password.length < 8 ||
            password !== passwordConfirm ||
            passwordStrength < 2
          }
        >
          <Lock className="mr-2 h-4 w-4" />
          {loading ? 'Setting password...' : 'Set Password & Continue'}
        </Button>
      </form>
    </AuthCard>
  )
}
