'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyOtp, requestOtp } from '@/app/actions/auth'

export default function VerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // Get email from sessionStorage if available
    const storedEmail = sessionStorage.getItem('otp_email')
    if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await verifyOtp(email, token)

      if (result.success) {
        // Clear stored email
        sessionStorage.removeItem('otp_email')
        // Redirect to dashboard
        router.push('/app/dashboard')
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')

    try {
      const result = await requestOtp(email)

      if (result.success) {
        setError('') // Clear any previous errors
        // Show success message briefly
        const successMsg = document.createElement('div')
        successMsg.className = 'bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm'
        successMsg.textContent = 'New code sent! Check your email.'
        document.querySelector('form')?.prepend(successMsg)
        setTimeout(() => successMsg.remove(), 3000)
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (err) {
      setError('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthCard
      title="Verify Your Email"
      description="Enter the 6-digit code we sent to your email"
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

        <div className="space-y-2">
          <Label htmlFor="token">Verification Code</Label>
          <Input
            id="token"
            type="text"
            placeholder="123456"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            disabled={loading}
            maxLength={6}
            className="text-center text-2xl font-mono tracking-widest"
          />
          <p className="text-xs text-gray-500">
            Enter the 6-digit code from your email
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email || token.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className="text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50"
          >
            {resending ? 'Sending...' : "Didn't receive a code? Resend"}
          </button>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
          <p className="text-xs text-blue-800">
            <strong>💡 Pro Tip:</strong> The code expires in 1 hour. Make sure to enter it exactly as shown in your email.
          </p>
        </div>
      </form>
    </AuthCard>
  )
}
