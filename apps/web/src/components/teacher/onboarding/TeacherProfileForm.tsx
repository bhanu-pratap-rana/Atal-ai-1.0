'use client'

import { FormEvent } from 'react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, CheckCircle } from 'lucide-react'

interface TeacherProfileFormProps {
  teacherName: string
  phone: string
  subject: string
  verifiedSchoolName: string
  verifiedSchoolCode: string
  loading: boolean
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onSubjectChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
}

export function TeacherProfileForm({
  teacherName,
  phone,
  subject,
  verifiedSchoolName,
  verifiedSchoolCode,
  loading,
  onNameChange,
  onPhoneChange,
  onSubjectChange,
  onSubmit,
}: TeacherProfileFormProps) {
  return (
    <AuthCard
      title="Complete Your Profile"
      description="Step 4 of 4: Tell us about yourself"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Verified School Banner - Uses success colors */}
        {verifiedSchoolName && (
          <div className="bg-success-light border border-success/30 rounded-[12px] p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success">{verifiedSchoolName}</p>
                <p className="text-xs text-green-700">School Code: {verifiedSchoolCode}</p>
              </div>
            </div>
          </div>
        )}

        {/* Name Input (Required) */}
        <div className="space-y-2">
          <Label htmlFor="teacher-name">
            Name <span className="text-error">*</span>
          </Label>
          <Input
            id="teacher-name"
            type="text"
            placeholder="Enter your full name"
            value={teacherName}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={loading}
            required
            autoComplete="name"
          />
          <p className="text-xs text-gray-500">This will be visible to your students</p>
        </div>

        {/* Phone Input (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="teacher-phone">Phone (Optional)</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-[12px] text-gray-500 text-sm">
              +91
            </span>
            <Input
              id="teacher-phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
              disabled={loading}
              autoComplete="tel"
              className="rounded-l-none"
            />
          </div>
          <p className="text-xs text-gray-500">We&apos;ll use this for important notifications</p>
        </div>

        {/* Subject Input (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="teacher-subject">Subject/Grade (Optional)</Label>
          <Input
            id="teacher-subject"
            type="text"
            placeholder="e.g., Mathematics, Class 10, English Literature"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            disabled={loading}
            autoComplete="off"
          />
          <p className="text-xs text-gray-500">Help students identify your class</p>
        </div>

        {/* Info Box - Uses primary-light */}
        <div className="bg-primary-light border border-primary/20 rounded-[12px] p-3">
          <p className="text-xs text-gray-700">
            <strong className="text-primary">📝 Profile Information</strong>
            <br />
            Only your name is required. Phone and subject information help us provide a better experience.
          </p>
        </div>

        {/* Submit Button - Uses primary gradient */}
        <Button
          type="submit"
          disabled={loading || !teacherName.trim()}
          loading={loading}
          size="lg"
          className="w-full"
        >
          <User className="mr-2 h-4 w-4" />
          {loading ? 'Completing...' : 'Complete Registration'}
        </Button>
      </form>
    </AuthCard>
  )
}
