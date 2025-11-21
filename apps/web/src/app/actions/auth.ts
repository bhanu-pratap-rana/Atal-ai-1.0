'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { BLOCKED_EMAIL_DOMAINS, VALID_EMAIL_PROVIDERS, EMAIL_REGEX } from '@/lib/auth-constants'
import { authLogger } from '@/lib/auth-logger'
import { checkOtpRateLimit, checkPasswordResetRateLimit } from '@/lib/rate-limiter'

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

/**
 * Check if email exists in database or Supabase auth
 * Used to prevent duplicate accounts across teacher and student accounts
 *
 * Uses a public Postgres function (check_email_exists) that:
 * - Works with unauthenticated clients (no service role key needed)
 * - Uses SECURITY DEFINER to bypass RLS safely
 * - Returns only email existence and role (no sensitive data)
 *
 * Checks both the users table and Supabase auth records
 */
export async function checkEmailExistsInAuth(email: string): Promise<{
  exists: boolean
  role?: string
}> {
  try {
    const trimmedEmail = email.trim().toLowerCase()

    // Use regular client - works even during unauthenticated signup
    // The check_email_exists() function handles RLS bypass safely via SECURITY DEFINER
    const supabase = await createClient()

    // Call the public Postgres function to check email existence
    // This function is public and works without authentication
    const { data, error } = await supabase.rpc('check_email_exists', {
      p_email: trimmedEmail
    })

    if (error) {
      authLogger.error('[checkEmailExistsInAuth] Error calling check_email_exists function', error)
      return { exists: false }
    }

    if (data && data.length > 0) {
      const result = data[0]
      if (result.email_exists) {
        authLogger.warn('[checkEmailExistsInAuth] Email already exists in users table', { role: result.user_role })
        return { exists: true, role: result.user_role }
      }
    }

    // Also check in Supabase auth users to catch all duplicate emails
    // This prevents the same email being used for multiple accounts
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

      if (!authError && authData?.users) {
        const existingUser = authData.users.find(u => u.email?.toLowerCase() === trimmedEmail)
        if (existingUser) {
          const userRole = existingUser.user_metadata?.role || 'user'
          authLogger.warn('[checkEmailExistsInAuth] Email already exists in Supabase auth', { role: userRole })
          return { exists: true, role: userRole }
        }
      }
    } catch (authCheckError) {
      // If auth check fails, continue - the RPC call may have succeeded
      authLogger.warn('[checkEmailExistsInAuth] Could not check Supabase auth users', authCheckError as Error)
    }

    authLogger.debug('[checkEmailExistsInAuth] Email not found in system')
    return { exists: false }
  } catch (error) {
    authLogger.error('[checkEmailExistsInAuth] Unexpected error', error)
    return { exists: false }
  }
}

export async function requestOtp(email: string) {
  try {
    // Validate email format
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      authLogger.debug('[requestOtp] Empty email provided')
      return { success: false, error: 'Please enter an email address.' }
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      authLogger.debug('[requestOtp] Invalid email format')
      return { success: false, error: 'Please enter a valid email address.' }
    }

    // Validate email domain
    if (!isValidEmailDomain(trimmedEmail)) {
      authLogger.debug('[requestOtp] Invalid email domain')
      return {
        success: false,
        error: 'Please enter a valid email address from a recognized email provider.'
      }
    }

    // Check rate limit - prevent brute force attacks
    if (!checkOtpRateLimit(trimmedEmail)) {
      authLogger.warn('[requestOtp] Rate limit exceeded', { type: 'otp_limit' })
      return {
        success: false,
        error: 'Too many OTP requests. Please wait an hour before requesting again.',
      }
    }

    // Check if email already exists in the system
    const emailCheck = await checkEmailExistsInAuth(trimmedEmail)
    if (emailCheck.exists) {
      // Security: Log role internally for debugging, but don't expose to user (prevents account enumeration)
      authLogger.info('[requestOtp] Email already registered', { role: emailCheck.role })
      return {
        success: false,
        error: 'This email is already registered. Please login instead.',
        exists: true,
      }
    }

    // Check for blocked/fake domains first
    const domain = trimmedEmail.split('@')[1]
    if (domain && BLOCKED_EMAIL_DOMAINS.has(domain.toLowerCase())) {
      authLogger.debug('[requestOtp] Blocked domain detected')

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
        authLogger.warn('[requestOtp] Possible typo detected in email domain')
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
      authLogger.debug('[requestOtp] Suspicious email pattern detected')
      return {
        success: false,
        error: 'Please use a valid email address.'
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    authLogger.debug('[requestOtp] Starting OTP request', {
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
      const errorStatus = (error as { status?: number }).status
      const errorName = (error as { name?: string }).name
      authLogger.error('[requestOtp] Supabase error', error, {
        status: errorStatus,
        name: errorName,
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

    authLogger.success('[requestOtp] OTP sent successfully')
    return { success: true, data }
  } catch (error) {
    authLogger.error('[requestOtp] Unexpected error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export async function verifyOtp(email: string, token: string) {
  try {
    authLogger.debug('[verifyOtp] Starting OTP verification')

    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      authLogger.error('[verifyOtp] Verification failed', error)
      return { success: false, error: error.message }
    }

    const role = data.user?.user_metadata?.role || 'student'
    authLogger.success('[verifyOtp] OTP verified successfully', { role })

    // Session is now created - check user role and redirect
    // Revalidate the layout to pick up the new session
    revalidatePath('/', 'layout')

    authLogger.debug('[verifyOtp] Redirecting user', { role })

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

    authLogger.error('[verifyOtp] Unexpected error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Send forgot password OTP
 * Used for both teacher and student password recovery
 */
export async function sendForgotPasswordOtp(email: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase()

    // Validate email format
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter an email address.' }
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    // Check rate limit - prevent password reset spam/abuse
    if (!checkPasswordResetRateLimit(trimmedEmail)) {
      authLogger.warn('[sendForgotPasswordOtp] Rate limit exceeded', { type: 'password_reset_limit' })
      return {
        success: false,
        error: 'Too many password reset requests. Please wait an hour before requesting again.',
      }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    authLogger.debug('[sendForgotPasswordOtp] Sending recovery OTP')

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${origin}/reset-password`,
        shouldCreateUser: false, // Don't create user if doesn't exist
      },
    })

    if (error) {
      authLogger.error('[sendForgotPasswordOtp] Error', error)

      // If user doesn't exist, inform them
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return {
          success: false,
          error: 'No account found with this email. Please sign up first.'
        }
      }

      return { success: false, error: error.message }
    }

    authLogger.success('[sendForgotPasswordOtp] OTP sent successfully')
    return { success: true }
  } catch (error) {
    authLogger.error('[sendForgotPasswordOtp] Unexpected error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Reset password after OTP verification
 * Used for both teacher and student password recovery
 */
export async function resetPasswordWithOtp(email: string, token: string, newPassword: string) {
  try {
    authLogger.debug('[resetPasswordWithOtp] Starting password reset')

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.'
      }
    }

    const supabase = await createClient()

    // First verify the OTP
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    })

    if (verifyError) {
      authLogger.error('[resetPasswordWithOtp] OTP verification failed', verifyError)
      return {
        success: false,
        error: "Invalid or expired recovery code. Please request a new one."
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Verification failed. Please try again.'
      }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      authLogger.error('[resetPasswordWithOtp] Password update failed', updateError)
      return {
        success: false,
        error: updateError.message
      }
    }

    authLogger.success('[resetPasswordWithOtp] Password reset successfully')
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error) {
    authLogger.error('[resetPasswordWithOtp] Unexpected error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
