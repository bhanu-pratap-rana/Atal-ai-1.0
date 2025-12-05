/**
 * Email Validation Utilities
 *
 * Handles email format validation, domain verification,
 * typo detection, and email-specific masking
 */

import {
  EMAIL_MAX_LENGTH,
  EMAIL_REGEX,
  VALID_EMAIL_PROVIDERS,
  BLOCKED_EMAIL_DOMAINS,
  COMMON_DOMAIN_TYPOS,
  AUTH_ERRORS,
} from './auth-constants'

export const VALID_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co', 'in', 'uk', 'us', 'ca', 'au', 'de', 'fr',
  'jp', 'cn', 'io', 'ai', 'tv', 'cc', 'ws', 'me',
  'co.uk', 'co.in',
]

/**
 * Calculates Levenshtein distance between two strings
 * Used for detecting email domain typos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Detects if an email domain has a typo and suggests the correct domain
 */
export function detectDomainTypo(domain: string): { hasTypo: boolean; suggestion?: string } {
  if (COMMON_DOMAIN_TYPOS[domain]) {
    return { hasTypo: true, suggestion: COMMON_DOMAIN_TYPOS[domain] }
  }

  const validDomains = VALID_EMAIL_PROVIDERS
  let closestMatch: { domain: string; distance: number } | null = null
  const threshold = 2

  for (const validDomain of validDomains) {
    const distance = levenshteinDistance(domain, validDomain)
    if (distance <= threshold) {
      if (!closestMatch || distance < closestMatch.distance) {
        closestMatch = { domain: validDomain, distance }
      }
    }
  }

  if (closestMatch) {
    return { hasTypo: true, suggestion: closestMatch.domain }
  }

  return { hasTypo: false }
}

/**
 * Validate email domain
 */
export function isValidEmailDomain(domain: string): boolean {
  const lowerDomain = domain.toLowerCase()

  if (VALID_EMAIL_PROVIDERS.some(provider =>
    lowerDomain === provider || lowerDomain.endsWith('.' + provider)
  )) {
    return true
  }

  const domainParts = lowerDomain.split('.')
  if (domainParts.length < 2) return false

  if (domainParts.some(part => part.length === 0)) return false

  const tld = domainParts[domainParts.length - 1]
  if (!VALID_TLDS.includes(tld)) return false

  const domainName = domainParts[0]
  if (domainName.length < 2) return false

  return true
}

/**
 * Validates email format and provider legitimacy
 * Includes typo detection and domain validation
 */
export function validateEmail(email: string): { valid: boolean; error?: string; suggestion?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  const trimmedEmail = email.trim().toLowerCase()

  if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
  }

  const [localPart, domain] = trimmedEmail.split('@')

  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, error: AUTH_ERRORS.DISPOSABLE_EMAIL }
  }

  const isValidDomain = VALID_EMAIL_PROVIDERS.includes(domain)

  if (isValidDomain) {
    return { valid: true }
  }

  const typoDetection = detectDomainTypo(domain)
  if (typoDetection.hasTypo && typoDetection.suggestion) {
    const suggestedEmail = `${localPart}@${typoDetection.suggestion}`
    return {
      valid: false,
      error: `Email domain typo detected. Did you mean ${suggestedEmail}?`,
      suggestion: suggestedEmail,
    }
  }

  return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL }
}

/**
 * Normalize email (trim and lowercase)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Mask email for logging
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***'
  return `${local[0]}***@${domain}`
}
