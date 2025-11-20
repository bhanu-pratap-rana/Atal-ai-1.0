/**
 * Centralized auth UI messages
 * Ensures consistent messaging across all authentication flows
 */

export const AUTH_MESSAGES = {
  SIGNIN: {
    SUCCESS: 'Login successful!',
    FAILED: 'Invalid email or password',
    UNEXPECTED_ERROR: 'An unexpected error occurred',
    NOT_AUTHENTICATED: 'Please log in first',
  },
  SIGNUP: {
    EMAIL_OTP_SENT: 'OTP sent to your email!',
    PHONE_OTP_SENT: 'OTP sent to your phone!',
    ACCOUNT_CREATED: 'Account created successfully!',
    OTP_FAILED: 'Failed to send OTP',
    OTP_VERIFIED: 'Email verified successfully!',
  },
  PASSWORD_RESET: {
    CODE_SENT: 'Recovery code sent to your email!',
    SUCCESS: 'Password reset successfully!',
    FAILED: 'Failed to reset password',
    INVALID_CODE: 'Invalid or expired recovery code',
  },
  VALIDATION: {
    MIN_PASSWORD: 'Password must be at least 8 characters long',
    PASSWORD_MISMATCH: 'Passwords do not match',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_PHONE: 'Please enter a valid phone number',
    INVALID_OTP: 'Invalid OTP format',
    REQUIRED_FIELD: 'This field is required',
  },
  ERRORS: {
    RATE_LIMIT: 'Too many requests. Please wait a few minutes and try again.',
    NETWORK: 'Network error. Please check your connection and try again.',
    SERVER: 'Server error. Please try again later.',
    UNAUTHORIZED: 'Unauthorized. You do not have permission to perform this action.',
    NOT_FOUND: 'Resource not found.',
  },
  COMMON: {
    LOADING: 'Loading...',
    SUBMITTING: 'Submitting...',
    RETRY: 'Retry',
    BACK: 'Back',
    CLOSE: 'Close',
    NEXT: 'Next',
    PREV: 'Previous',
    CANCEL: 'Cancel',
    SUBMIT: 'Submit',
  },
}

// Info box messages for guidance
export const INFO_MESSAGES = {
  EMAIL_VERIFICATION:
    'We will send you a 6-digit code to verify your email address.',
  PHONE_VERIFICATION:
    'We will send you a 6-digit code to verify your phone number.',
  PASSWORD_REQUIREMENTS:
    'Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.',
  FORGOT_PASSWORD:
    'Enter your email address and we will send you a recovery code.',
  PIN_VERIFICATION: 'Enter the 4-6 digit PIN provided by your school administrator.',
  CLASS_CODE:
    'Ask your teacher for your class code to join the class.',
  SCHOOL_CODE:
    'Enter your school code to verify your enrollment.',
}

// Error messages with more detail
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: {
    title: 'Login Failed',
    message: 'Please check your email and password and try again.',
  },
  ACCOUNT_NOT_FOUND: {
    title: 'Account Not Found',
    message: 'No account found with this email address. Please sign up first.',
  },
  VERIFICATION_FAILED: {
    title: 'Verification Failed',
    message: 'The code you entered is invalid or has expired. Please try again.',
  },
  UNAUTHORIZED_ACTION: {
    title: 'Unauthorized',
    message: 'You do not have permission to perform this action.',
  },
  SCHOOL_NOT_FOUND: {
    title: 'School Not Found',
    message: 'Please check your school code and try again.',
  },
}
