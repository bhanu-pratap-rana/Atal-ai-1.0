'use client'

import { FormEvent } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Building2 } from 'lucide-react'

interface TeacherSchoolVerificationFormProps {
  schoolCode: string
  staffPin: string
  loading: boolean
  onSchoolCodeChange: (value: string) => void
  onStaffPinChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export function TeacherSchoolVerificationForm({
  schoolCode,
  staffPin,
  loading,
  onSchoolCodeChange,
  onStaffPinChange,
  onSubmit,
}: TeacherSchoolVerificationFormProps) {
  return (
    <AuthCard
      title="Verify Your School"
      description="Step 3 of 4: Enter your school credentials"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* School Code Input */}
        <div className="space-y-2">
          <Label htmlFor="school-code">School Code</Label>
          <Input
            id="school-code"
            type="text"
            placeholder="Enter your school code (e.g., 14H0001)"
            value={schoolCode}
            onChange={(e) => onSchoolCodeChange(e.target.value.toUpperCase())}
            disabled={loading}
            maxLength={10}
            required
            autoComplete="off"
          />
          <p className="text-xs text-gray-500">You can get this from your school administrator</p>
        </div>

        {/* Staff PIN Input */}
        <div className="space-y-2">
          <Label htmlFor="staff-pin">Staff PIN</Label>
          <Input
            id="staff-pin"
            type="password"
            placeholder="Enter your staff PIN (4-8 digits)"
            value={staffPin}
            onChange={(e) => onStaffPinChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
            disabled={loading}
            maxLength={8}
            required
            autoComplete="off"
          />
          <p className="text-xs text-gray-500">This is provided by your school administrator</p>
        </div>

        {/* Security Info Box - Uses success colors */}
        <div className="bg-success-light border border-success/30 rounded-[12px] p-3">
          <p className="text-xs text-green-800">
            <Shield className="inline-block h-3 w-3 mr-1 text-success" />
            <strong className="text-success">Secure Verification</strong>
            <br />
            Your school code and PIN are encrypted and secure. They are only used to verify your affiliation with your school.
          </p>
        </div>

        {/* Submit Button - Uses primary gradient */}
        <Button
          type="submit"
          disabled={loading || schoolCode.length < 5 || staffPin.length < 4}
          loading={loading}
          size="lg"
          className="w-full"
        >
          <Building2 className="mr-2 h-4 w-4" />
          {loading ? 'Verifying...' : 'Verify School & Continue'}
        </Button>
      </form>
    </AuthCard>
  )
}
