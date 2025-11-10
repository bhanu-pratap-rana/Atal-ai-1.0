'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestOtp } from '@/app/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await requestOtp(email)

      if (result.success) {
        // Store email in sessionStorage for verify page
        sessionStorage.setItem('otp_email', email)
        toast.success('Verification code sent! Check your email.')
        router.push('/verify')
      } else {
        toast.error(result.error || 'Failed to send OTP')
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Welcome Back"
      description="Enter your email to receive a verification code"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </Button>

        <p className="text-xs text-center text-gray-500">
          We'll send you a 6-digit code to verify your email address.
        </p>
      </form>
    </AuthCard>
  )
}
