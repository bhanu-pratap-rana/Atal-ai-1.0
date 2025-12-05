'use client'

import { FormEvent } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Lock } from 'lucide-react'

interface TeacherForgotPasswordFlowProps {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
  otpSent: boolean
  loading: boolean
  onEmailChange: (value: string) => void
  onOtpChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSendOtp: (e: FormEvent) => void
  onResetPassword: (e: FormEvent) => void
  onBack: () => void
}

export function TeacherForgotPasswordFlow({
  email,
  otp,
  newPassword,
  confirmPassword,
  otpSent,
  loading,
  onEmailChange,
  onOtpChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSendOtp,
  onResetPassword,
  onBack,
}: TeacherForgotPasswordFlowProps) {
  if (!otpSent) {
    return (
      <AuthCard title="Reset Your Password" description="Enter your email to receive a recovery code">
        <form onSubmit={onSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email Address</Label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter your registered email"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" />
            {loading ? 'Sending...' : 'Send Recovery Code'}
          </Button>

          <Button
            type="button"
            onClick={onBack}
            disabled={loading}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Enter Recovery Code & New Password" description="Complete the password reset">
      <form onSubmit={onResetPassword} className="space-y-4">
        {/* OTP Input */}
        <div className="space-y-2">
          <Label htmlFor="forgot-otp">Recovery Code</Label>
          <Input
            id="forgot-otp"
            type="text"
            value={otp}
            onChange={(e) => onOtpChange(e.target.value)}
            placeholder="Enter 6-digit recovery code"
            disabled={loading}
            maxLength={6}
            required
          />
          <p className="text-xs text-gray-500">Check your email for the recovery code</p>
        </div>

        {/* New Password Input */}
        <div className="space-y-2">
          <Label htmlFor="forgot-new-password">New Password</Label>
          <Input
            id="forgot-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            placeholder="Create a new password"
            disabled={loading}
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-gray-500">At least 8 characters with uppercase, lowercase, number, and symbol</p>
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-2">
          <Label htmlFor="forgot-confirm-password">Confirm Password</Label>
          <Input
            id="forgot-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="Confirm your new password"
            disabled={loading}
            autoComplete="new-password"
            required
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full"
        >
          <Lock className="mr-2 h-4 w-4" />
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>

        {/* Back Button */}
        <Button
          type="button"
          onClick={onBack}
          disabled={loading}
          variant="ghost"
          className="w-full text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>
      </form>
    </AuthCard>
  )
}
