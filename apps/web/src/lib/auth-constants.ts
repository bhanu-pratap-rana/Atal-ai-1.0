/**
 * Centralized authentication constants
 * Used across all authentication flows to maintain consistency
 */

// Password validation
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

// OTP validation
export const OTP_LENGTH = 6
export const OTP_EXPIRY_MINUTES = 10

// PIN validation (for class joining)
export const PIN_LENGTH = 4
export const PIN_MAX_ATTEMPTS = 3

// Phone number validation (India-specific)
export const PHONE_COUNTRY_CODE = '+91'
export const PHONE_DIGIT_LENGTH = 10
export const PHONE_TOTAL_LENGTH = PHONE_COUNTRY_CODE.length + PHONE_DIGIT_LENGTH // 13 (+91 + 10 digits)

// Email validation
export const EMAIL_MAX_LENGTH = 254
export const EMAIL_VERIFIED_REQUIRED = false // Can be false for demo, true for production
// Strict regex for email validation - allows standard email formats
// Matches: local@domain.extension where both local and domain have specific character restrictions
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Class code validation
export const CLASS_CODE_LENGTH = 6

// Rate limiting
export const OTP_REQUEST_RATE_LIMIT_SECONDS = 60
export const OTP_REQUEST_MAX_ATTEMPTS = 5

// Valid email providers (whitelist legitimate domains)
export const VALID_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'yandex.com',
  'aol.com',
  'gmx.com',
  'fastmail.com',
  'tutanota.com',
  'zoho.com',
  'mailgun.org',
  'example.com', // For testing
  'googlemail.com',
  'rediffmail.com', // Popular in India
  'live.com',
  'msn.com',
  'inbox.com',
  'mail.ru',
  '163.com',
  'qq.com',
  'sina.com',
  'sohu.com',
  'vip.qq.com',
]

// Blocked email domains (disposable/fake services)
export const BLOCKED_EMAIL_DOMAINS = [
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'throwaway.email',
  'maildrop.cc',
  'sharklasers.com',
  'guerrillapop.com',
  'spam4.me',
  'trashmail.com',
  'fakeinbox.com',
  'yopmail.com',
  'maildrop.cc',
  'temp-mail.org',
  'mytrashmail.com',
  'bugmenot.com',
  'disposablemail.com',
  'fakemail.net',
  'spam.la',
  'maildrop.cc',
  'mytrashmail.com',
  'fakeinbox.com',
  '10minutemail.com',
  'tempmail.com',
  'throwaway.email',
  'trashmail.com',
  'mailinator.com',
  'spam4.me',
  'spamgourmet.com',
  'maildrop.cc',
  'fakeinbox.com',
  'yopmail.com',
  'protonmailrmez3lotccipshtkleegetolb73fuirgj7r4o4vfu7ozyd.onion',
  'thraml.com',
  'vpn.com',
  'vpnmail.com',
  'fakeinbox.com',
  'dontreplytome.com',
  'nomail.com',
  'anymail.net',
  'armyspy.com',
  'dayroommail.com',
  'fakemail.fr',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'pokemail.net',
  'sharklasers.com',
  'spam4.me',
  'thingymail.com',
  'trashmail.de',
  'maildrop.cc',
  'mytrashmail.com',
  'fakeinbox.com',
  'tempmail.com',
  'throwaway.email',
  'trashmail.com',
  'mailinator.com',
  'spam4.me',
  'spamgourmet.com',
  'maildrop.cc',
  'fakeinbox.com',
  'yopmail.com',
  'thraml.com',
]

// Auth error messages
export const AUTH_ERRORS = {
  INVALID_EMAIL: 'Please enter a valid email address',
  EMAIL_ALREADY_EXISTS: 'This email is already registered',
  INVALID_PASSWORD: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  PASSWORD_MISMATCH: 'Passwords do not match',
  INVALID_OTP: 'Please enter a valid OTP',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_PIN: 'Please enter a valid 4-digit PIN',
  INVALID_CLASS_CODE: 'Please enter a valid 6-character class code',
  INVALID_ROLL_NUMBER: 'Please enter a valid roll number',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  INVALID_CREDENTIALS: 'Invalid email/phone or password',
  ACCOUNT_NOT_FOUND: 'Account not found. Please sign up first.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  MAX_OTP_ATTEMPTS: 'Too many failed attempts. Please request a new OTP.',
  RATE_LIMITED: 'Too many requests. Please wait a moment before trying again.',
  DISPOSABLE_EMAIL: 'Disposable email addresses are not allowed',
  EMAIL_IN_USE_AS_TEACHER: 'This email is already used as a teacher account. Please sign in instead.',
  EMAIL_IN_USE_AS_STUDENT: 'This email is already used as a student account. Please sign in instead.',
  PHONE_IN_USE: 'This phone number is already registered.',
}

// Success messages
export const SUCCESS_MESSAGES = {
  OTP_SENT: 'OTP sent to your email!',
  OTP_SENT_PHONE: 'OTP sent to your phone!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  PHONE_VERIFIED: 'Phone verified successfully!',
  ACCOUNT_CREATED: 'Account created successfully! 🎉',
  SIGNED_IN: 'Signed in successfully! 🎉',
  SIGNED_OUT: 'Signed out successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  CLASS_JOINED: 'Successfully joined class! 🎉',
}

// UI Constants
export const FORM_LABELS = {
  EMAIL: 'Email Address',
  PHONE: 'Phone Number',
  PASSWORD: 'Password',
  PASSWORD_CONFIRM: 'Confirm Password',
  OTP: 'One-Time Password',
  PIN: 'Class PIN',
  ROLL_NUMBER: 'Roll Number',
  CLASS_CODE: 'Class Code',
}

export const FORM_PLACEHOLDERS = {
  EMAIL: 'your.email@example.com',
  PHONE: '9876543210',
  PASSWORD: 'Enter your password',
  PASSWORD_CONFIRM: 'Confirm your password',
  OTP: '123456',
  PIN: '••••',
  ROLL_NUMBER: 'e.g., 101, ST2024001',
  CLASS_CODE: 'A3F7E2',
}

export const FORM_HINTS = {
  EMAIL: 'We will send a verification link to this email',
  PHONE: 'Enter your 10-digit phone number (India only)',
  PASSWORD: `Minimum ${PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_CONFIRM: 'Must match your password',
  OTP: 'Enter the 6-digit code sent to your email',
  OTP_PHONE: 'Enter the 6-digit code sent to your phone',
  PIN: '4-digit PIN provided by your teacher',
  ROLL_NUMBER: 'Your student roll number or ID',
  CLASS_CODE: '6-character code provided by your teacher',
}
