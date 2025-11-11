'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Email validation regex - strict format
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// List of known valid email providers
const VALID_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'protonmail.com', 'aol.com', 'mail.com', 'zoho.com', 'yandex.com',
  'live.com', 'msn.com', 'yahoo.co.in', 'rediffmail.com', 'inbox.com',
  // Educational domains
  'edu', 'ac.in', 'edu.in',
  // Common organizational domains
  'gov.in', 'nic.in', 'nic.org'
]

// Common typos and disposable/fake domains to block
const BLOCKED_DOMAINS = [
  // Gmail typos
  'gail.com', 'gamil.com', 'gmial.com', 'gmai.com', 'gmil.com', 'gmaill.com',
  'gnail.com', 'gmeil.com', 'gmsil.com', 'gimail.com', 'gmaqil.com',
  'gmaiil.com', 'gmali.com', 'gmal.com', 'gmaio.com', 'gmaul.com',

  // Yahoo typos
  'yahooo.com', 'yaho.com', 'yhoo.com', 'yahoooo.com', 'yahou.com',
  'yaboo.com', 'yahho.com', 'yajoo.com', 'yahol.com', 'yaoo.com',
  'yhaoo.com', 'yahoou.com', 'yahpp.com', 'yahuu.com',

  // Outlook typos
  'outlok.com', 'outlock.com', 'outloo.com', 'outlookk.com', 'outloook.com',
  'ooutlook.com', 'putlook.com', 'outlook.co', 'outlool.com', 'outlookl.com',
  'iutlook.com', 'outtlook.com', 'otlook.com',

  // Hotmail typos
  'hotmial.com', 'hotmil.com', 'hotmai.com', 'hotmaill.com', 'hotmaii.com',
  'hotmal.com', 'hotmeil.com', 'htomail.com', 'hotmaol.com', 'hotmsil.com',
  'hotmaiil.com', 'hotmali.com', 'hotmain.com', 'hptmail.com', 'hotnail.com',
  'hormail.com', 'hotail.com',

  // iCloud typos
  'iclou.com', 'icloud.co', 'icloude.com', 'iclaud.com', 'icloyd.com',
  'iclooud.com', 'iclod.com', 'iclound.com',

  // ProtonMail typos
  'protonmial.com', 'protonmail.co', 'protonmeil.com', 'protonmal.com',
  'protonmali.com', 'protomail.com', 'protoonmail.com',

  // AOL typos
  'aol.co', 'aoll.com', 'ao.com', 'ail.com', 'aol.con',

  // Live.com typos
  'live.co', 'livee.com', 'liv.com', 'lve.com', 'lice.com',

  // Disposable/temporary email services
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com',
  'throwaway.email', 'maildrop.cc', 'tempmail.com', 'fakeinbox.com',
  'trashmail.com', 'getnada.com', 'emailondeck.com', 'yopmail.com',
  'disposable.com', 'guerrillamail.info', 'sharklasers.com', 'guerrillamail.net',

  // Fake/test domains
  'test.com', 'example.com', 'fake.com', 'spam.com', 'temp.com',
  'testmail.com', 'fakemail.com', 'spamtest.com'
]

// Check if email domain is valid
function isValidEmailDomain(email: string): boolean {
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
  // Valid TLDs (common ones)
  const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'co', 'in', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'io', 'ai']

  return validTLDs.includes(tld) && domainParts.every(part => part.length > 0)
}

export async function requestOtp(email: string) {
  try {
    // Validate email format
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      console.error('❌ [requestOtp] Empty email')
      return { success: false, error: 'Please enter an email address.' }
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      console.error('❌ [requestOtp] Invalid email format:', trimmedEmail)
      return { success: false, error: 'Please enter a valid email address.' }
    }

    // Validate email domain
    if (!isValidEmailDomain(trimmedEmail)) {
      console.error('❌ [requestOtp] Invalid email domain:', trimmedEmail)
      return {
        success: false,
        error: 'Please enter a valid email address from a recognized email provider.'
      }
    }

    // Check for blocked/fake domains first
    const domain = trimmedEmail.split('@')[1]
    if (domain && BLOCKED_DOMAINS.includes(domain.toLowerCase())) {
      console.error('❌ [requestOtp] Blocked domain:', domain)

      // Check if it's a typo and suggest correction
      const commonTypos: Record<string, string> = {
        // Gmail typos → gmail.com
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

        // Yahoo typos → yahoo.com
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

        // Outlook typos → outlook.com
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

        // Hotmail typos → hotmail.com
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

        // iCloud typos → icloud.com
        'iclou.com': 'icloud.com',
        'icloud.co': 'icloud.com',
        'icloude.com': 'icloud.com',
        'iclaud.com': 'icloud.com',
        'icloyd.com': 'icloud.com',
        'iclooud.com': 'icloud.com',
        'iclod.com': 'icloud.com',
        'iclound.com': 'icloud.com',

        // ProtonMail typos → protonmail.com
        'protonmial.com': 'protonmail.com',
        'protonmail.co': 'protonmail.com',
        'protonmeil.com': 'protonmail.com',
        'protonmal.com': 'protonmail.com',
        'protonmali.com': 'protonmail.com',
        'protomail.com': 'protonmail.com',
        'protoonmail.com': 'protonmail.com',

        // AOL typos → aol.com
        'aol.co': 'aol.com',
        'aoll.com': 'aol.com',
        'ao.com': 'aol.com',
        'ail.com': 'aol.com',
        'aol.con': 'aol.com',

        // Live.com typos → live.com
        'live.co': 'live.com',
        'livee.com': 'live.com',
        'liv.com': 'live.com',
        'lve.com': 'live.com',
        'lice.com': 'live.com',
      }

      if (commonTypos[domain]) {
        const suggestedEmail = trimmedEmail.replace(domain, commonTypos[domain])
        console.warn('⚠️ [requestOtp] Possible typo detected:', {
          entered: trimmedEmail,
          suggested: suggestedEmail,
        })
        return {
          success: false,
          error: `Did you mean ${suggestedEmail}? Please check your email address.`
        }
      }

      return {
        success: false,
        error: 'Please enter a valid email address from a recognized email provider.'
      }
    }

    // Additional check: reject obviously fake emails
    const suspiciousPatterns = ['test@', 'fake@', 'example@', 'spam@', 'temp@', 'disposable@']
    if (suspiciousPatterns.some(pattern => trimmedEmail.startsWith(pattern))) {
      console.error('❌ [requestOtp] Suspicious email pattern:', trimmedEmail)
      return {
        success: false,
        error: 'Please use a valid email address.'
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    console.log('🔐 [requestOtp] Starting OTP request:', {
      email: trimmedEmail,
      origin,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${origin}/verify`,
        shouldCreateUser: true, // Auto-create user if doesn't exist
      },
    })

    if (error) {
      console.error('❌ [requestOtp] Supabase error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        fullError: JSON.stringify(error),
      })

      // Provide more specific error messages
      let userMessage = error.message
      if (error.message.includes('rate limit')) {
        userMessage = 'Too many requests. Please wait a few minutes and try again.'
      } else if (error.message.includes('Email provider') || error.message.includes('email')) {
        userMessage = 'Email service issue. Please check Supabase dashboard Auth settings.'
      } else if (error.message.includes('Invalid email')) {
        userMessage = 'Please enter a valid email address.'
      }

      return { success: false, error: userMessage }
    }

    console.log('✅ [requestOtp] OTP sent successfully:', {
      userId: (data as any)?.user?.id,
      messageId: (data as any)?.messageId,
    })
    return { success: true, data }
  } catch (error) {
    console.error('❌ [requestOtp] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function verifyOtp(email: string, token: string) {
  try {
    console.log('🔐 [verifyOtp] Starting OTP verification:', { email, tokenLength: token.length })

    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      console.error('❌ [verifyOtp] Verification failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [verifyOtp] OTP verified successfully:', {
      userId: data.user?.id,
      email: data.user?.email,
      role: data.user?.user_metadata?.role,
    })

    // Session is now created - check user role and redirect
    const role = data.user?.user_metadata?.role || 'student'

    // Revalidate the layout to pick up the new session
    revalidatePath('/', 'layout')

    console.log('🔄 [verifyOtp] Redirecting to:', role === 'teacher' ? '/app/teacher/classes' : '/app/dashboard')

    // Redirect based on role
    if (role === 'teacher') {
      redirect('/app/teacher/classes')
    } else {
      redirect('/app/dashboard')
    }
  } catch (error) {
    // Next.js redirect() throws a NEXT_REDIRECT error which is expected behavior
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error // Re-throw to allow the redirect to happen
    }

    console.error('❌ [verifyOtp] Unexpected error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
