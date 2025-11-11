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
  const [emailError, setEmailError] = useState('')

  // List of valid email providers (matching server-side)
  const VALID_EMAIL_PROVIDERS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'mail.com', 'zoho.com', 'yandex.com',
  ]

  const VALID_TLDS = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'co', 'in', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'io', 'ai']

  // Check if email domain is valid
  const isValidEmailDomain = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false

    // Check if it's a known provider
    if (VALID_EMAIL_PROVIDERS.some(provider => domain === provider || domain.endsWith('.' + provider))) {
      return true
    }

    // Check if domain has valid TLD and proper structure
    const domainParts = domain.split('.')
    if (domainParts.length < 2) return false

    const tld = domainParts[domainParts.length - 1]
    return VALID_TLDS.includes(tld) && domainParts.every(part => part.length > 0)
  }

  // Real-time email validation
  const validateEmail = (value: string) => {
    const trimmed = value.trim().toLowerCase()

    if (!trimmed) {
      setEmailError('')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Check for suspicious patterns
    const suspiciousPatterns = ['test@', 'fake@', 'example@', 'spam@', 'temp@', 'disposable@']
    if (suspiciousPatterns.some(pattern => trimmed.startsWith(pattern))) {
      setEmailError('Please use a valid email address')
      return
    }

    // Validate domain
    if (!isValidEmailDomain(trimmed)) {
      setEmailError('Please enter a valid email address from a recognized provider')
      return
    }

    // Check for common typos
    const domain = trimmed.split('@')[1]
    const commonTypos: Record<string, string> = {
      // Gmail typos
      'gail.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gnail.com': 'gmail.com',
      'gmeil.com': 'gmail.com',
      'gmsil.com': 'gmail.com',
      'gimail.com': 'gmail.com',
      'gmaqil.com': 'gmail.com',
      'gmaiil.com': 'gmail.com',
      'gmali.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gmaio.com': 'gmail.com',
      'gmaul.com': 'gmail.com',

      // Yahoo typos
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'yhoo.com': 'yahoo.com',
      'yahoooo.com': 'yahoo.com',
      'yahou.com': 'yahoo.com',
      'yaboo.com': 'yahoo.com',
      'yahho.com': 'yahoo.com',
      'yajoo.com': 'yahoo.com',
      'yahol.com': 'yahoo.com',
      'yaoo.com': 'yahoo.com',
      'yhaoo.com': 'yahoo.com',
      'yahoou.com': 'yahoo.com',
      'yahpp.com': 'yahoo.com',
      'yahuu.com': 'yahoo.com',

      // Outlook typos
      'outlok.com': 'outlook.com',
      'outlock.com': 'outlook.com',
      'outloo.com': 'outlook.com',
      'outlookk.com': 'outlook.com',
      'outloook.com': 'outlook.com',
      'ooutlook.com': 'outlook.com',
      'putlook.com': 'outlook.com',
      'outlook.co': 'outlook.com',
      'outlool.com': 'outlook.com',
      'outlookl.com': 'outlook.com',
      'iutlook.com': 'outlook.com',
      'outtlook.com': 'outlook.com',
      'otlook.com': 'outlook.com',

      // Hotmail typos
      'hotmial.com': 'hotmail.com',
      'hotmil.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'hotmaill.com': 'hotmail.com',
      'hotmaii.com': 'hotmail.com',
      'hotmal.com': 'hotmail.com',
      'hotmeil.com': 'hotmail.com',
      'htomail.com': 'hotmail.com',
      'hotmaol.com': 'hotmail.com',
      'hotmsil.com': 'hotmail.com',
      'hotmaiil.com': 'hotmail.com',
      'hotmali.com': 'hotmail.com',
      'hotmain.com': 'hotmail.com',
      'hptmail.com': 'hotmail.com',
      'hotnail.com': 'hotmail.com',
      'hormail.com': 'hotmail.com',
      'hotail.com': 'hotmail.com',

      // iCloud typos
      'iclou.com': 'icloud.com',
      'icloud.co': 'icloud.com',
      'icloude.com': 'icloud.com',
      'iclaud.com': 'icloud.com',
      'icloyd.com': 'icloud.com',
      'iclooud.com': 'icloud.com',
      'iclod.com': 'icloud.com',
      'iclound.com': 'icloud.com',

      // ProtonMail typos
      'protonmial.com': 'protonmail.com',
      'protonmail.co': 'protonmail.com',
      'protonmeil.com': 'protonmail.com',
      'protonmal.com': 'protonmail.com',
      'protonmali.com': 'protonmail.com',
      'protomail.com': 'protonmail.com',
      'protoonmail.com': 'protonmail.com',

      // AOL typos
      'aol.co': 'aol.com',
      'aoll.com': 'aol.com',
      'ao.com': 'aol.com',
      'ail.com': 'aol.com',
      'aol.con': 'aol.com',

      // Live.com typos
      'live.co': 'live.com',
      'livee.com': 'live.com',
      'liv.com': 'live.com',
      'lve.com': 'live.com',
      'lice.com': 'live.com',
    }

    if (domain && commonTypos[domain]) {
      setEmailError(`Did you mean ${trimmed.replace(domain, commonTypos[domain])}?`)
      return
    }

    setEmailError('')
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    validateEmail(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Final validation before submit
    const trimmed = email.trim()
    if (!trimmed || emailError) {
      toast.error(emailError || 'Please enter a valid email address')
      return
    }

    setLoading(true)

    console.log('🔐 [Login] Form submitted:', { email: trimmed })

    try {
      console.log('🔐 [Login] Calling requestOtp...')
      const result = await requestOtp(trimmed)
      console.log('🔐 [Login] requestOtp result:', result)

      if (result.success) {
        // Store trimmed email in sessionStorage for verify page
        sessionStorage.setItem('otp_email', trimmed)
        console.log('✅ [Login] OTP sent successfully, redirecting to /verify')
        toast.success('Verification code sent! Check your email.')
        router.push('/verify')
      } else {
        console.error('❌ [Login] OTP failed:', result.error)
        toast.error(result.error || 'Failed to send OTP')
      }
    } catch (err) {
      console.error('❌ [Login] Unexpected error:', err)
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
            onChange={handleEmailChange}
            required
            disabled={loading}
            className={emailError ? 'border-red-500' : ''}
          />
          {emailError && (
            <p className="text-sm text-red-600">{emailError}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email || !!emailError}
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
