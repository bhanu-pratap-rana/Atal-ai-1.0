'use client'

import { FormEvent } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Phone, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'

interface TeacherSignupPhoneFlowProps {
  phoneNumber: string
  phoneError: string
  phoneOtp: string
  phoneOtpSent: boolean
  loading: boolean
  onPhoneNumberChange: (value: string) => void
  onPhoneOtpChange: (value: string) => void
  onSendOtp: (e: FormEvent) => void
  onVerifyOtp: (e: FormEvent) => void
  onBack: () => void
}

export function TeacherSignupPhoneFlow({
  phoneNumber,
  phoneError,
  phoneOtp,
  phoneOtpSent,
  loading,
  onPhoneNumberChange,
  onPhoneOtpChange,
  onSendOtp,
  onVerifyOtp,
  onBack,
}: TeacherSignupPhoneFlowProps) {
  if (!phoneOtpSent) {
    return (
      <AuthCard title="Sign Up with Phone" description="Step 1 of 4: Verify your phone number">
        <form onSubmit={onSendOtp} className="space-y-4">
          {phoneError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{phoneError}</p>
            </div>
          )}

          {/* Coming Soon Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-yellow-900">Phone signup coming soon!</p>
              <p className="text-xs text-yellow-800">Please use email signup for now</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-phone">Phone Number (India)</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-600 text-sm font-medium">+91</span>
              <Input
                id="signup-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => onPhoneNumberChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                disabled={loading || true}
                maxLength={10}
                className="pl-10"
                autoComplete="tel"
              />
            </div>
            <p className="text-xs text-gray-500">We&apos;ll send you an SMS verification code</p>
          </div>

          <Button
            type="submit"
            disabled={true}
            size="lg"
            className="w-full"
          >
            <Phone className="mr-2 h-4 w-4" />
            Send OTP (Coming Soon)
          </Button>

          <Button
            type="button"
            onClick={onBack}
            disabled={loading}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </form>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Verify Your Phone" description="Enter the OTP we sent">
      <form onSubmit={onVerifyOtp} className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-900">SMS Sent</p>
              <p className="text-xs text-green-700">Check your phone for the 6-digit code</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone-otp">OTP Code</Label>
          <Input
            id="phone-otp"
            type="text"
            value={phoneOtp}
            onChange={(e) => onPhoneOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            disabled={true}
            maxLength={6}
            autoComplete="off"
          />
          <p className="text-xs text-gray-500">From: +91 {phoneNumber}</p>
        </div>

        <Button
          type="submit"
          disabled={true}
          size="lg"
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Button>

        <Button
          type="button"
          onClick={onBack}
          disabled={loading}
          variant="ghost"
          className="w-full text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Phone
        </Button>
      </form>
    </AuthCard>
  )
}
