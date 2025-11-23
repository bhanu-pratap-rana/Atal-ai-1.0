# Comprehensive Error Handling & Documentation Guide

## Overview

This guide documents the error handling strategy, common errors, and best practices for ATAL AI.

---

## 1. Authentication Errors

### 1.1 Email Not Found

**Error Code**: `AUTH_EMAIL_NOT_FOUND`
**HTTP Status**: 404
**Context**: User tries to reset password or sign in with non-existent email

```typescript
// Detection
const { exists } = await checkEmailExistsInAuth(email)
if (!exists) {
  return {
    error: 'No account found with this email',
    code: 'AUTH_EMAIL_NOT_FOUND',
    recoveryAction: 'Register a new account',
  }
}
```

**User-Friendly Message**:
```
"We couldn't find an account with that email address.
Please sign up for a new account or check your email spelling."
```

**Resolution**:
1. Suggest account registration
2. Check email for typos
3. Try different email if multiple accounts

---

### 1.2 Invalid OTP

**Error Code**: `AUTH_INVALID_OTP`
**HTTP Status**: 401
**Context**: User entered wrong OTP code

```typescript
const { error } = await supabase.auth.verifyOtp({
  email,
  token,
  type: 'email',
})

if (error?.message.includes('Invalid')) {
  return {
    error: 'The code you entered is incorrect',
    code: 'AUTH_INVALID_OTP',
    recoveryAction: 'Check the code in your email',
  }
}
```

**User-Friendly Message**:
```
"The verification code is incorrect.
Please check your email and try again.
Codes expire after 10 minutes."
```

**Resolution**:
1. Show remaining attempts (if tracked)
2. Offer to resend OTP
3. Check if code is expired

---

### 1.3 OTP Expired

**Error Code**: `AUTH_OTP_EXPIRED`
**HTTP Status**: 401
**Context**: User's OTP code expired (>10 minutes)

```typescript
const { error } = await supabase.auth.verifyOtp({
  email,
  token,
  type: 'email',
})

if (error?.message.includes('Expired')) {
  return {
    error: 'This code has expired',
    code: 'AUTH_OTP_EXPIRED',
    recoveryAction: 'Request a new code',
  }
}
```

**User-Friendly Message**:
```
"Your verification code has expired (valid for 10 minutes).
Please request a new code."
```

**Resolution**:
1. Offer button to resend OTP
2. Clear expired code from UI
3. Reset timer

---

### 1.4 Rate Limited

**Error Code**: `AUTH_RATE_LIMITED`
**HTTP Status**: 429
**Context**: User has made too many requests

```typescript
if (!checkOtpRateLimit(email)) {
  return {
    error: 'Too many attempts. Please try again later',
    code: 'AUTH_RATE_LIMITED',
    retryAfter: 3600,  // seconds
    recoveryAction: 'Wait before trying again',
  }
}
```

**User-Friendly Message**:
```
"You've made too many requests.
Please wait 1 hour before trying again."
```

**Handling**:
```typescript
// Show retry timer
const retrySeconds = error.retryAfter
const minutes = Math.ceil(retrySeconds / 60)
showMessage(`Try again in ${minutes} minutes`)

// Disable button
button.disabled = true
button.textContent = `Try again in ${minutes}m`
```

---

## 2. Validation Errors

### 2.1 Invalid Email Format

**Error Code**: `VALIDATION_INVALID_EMAIL`
**HTTP Status**: 400

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

if (!emailRegex.test(email)) {
  return {
    error: 'Please enter a valid email address',
    code: 'VALIDATION_INVALID_EMAIL',
  }
}
```

**User-Friendly Message**:
```
"Please enter a valid email address (e.g., user@example.com)"
```

### 2.2 Invalid Password

**Error Code**: `VALIDATION_WEAK_PASSWORD`
**HTTP Status**: 400

```typescript
const passwordRequirements = {
  minLength: 8,
  hasUppercase: true,
  hasLowercase: true,
  hasNumber: true,
  hasSpecial: true,
}

const errors = []
if (password.length < 8) errors.push('At least 8 characters')
if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
if (!/[0-9]/.test(password)) errors.push('One number')
if (!/[!@#$%^&*]/.test(password)) errors.push('One special character')

if (errors.length > 0) {
  return {
    error: `Password must contain: ${errors.join(', ')}`,
    code: 'VALIDATION_WEAK_PASSWORD',
    details: errors,
  }
}
```

**User-Friendly Message with Requirements**:
```
Password Requirements:
✓ At least 8 characters
✗ One uppercase letter (e.g., A-Z)
✓ One lowercase letter
✗ One number
✓ One special character (!@#$%^&*)
```

### 2.3 Invalid School Code

**Error Code**: `VALIDATION_INVALID_SCHOOL_CODE`
**HTTP Status**: 400

```typescript
const schoolCode = input.toUpperCase()

if (!/^[A-Z0-9]{6}$/.test(schoolCode)) {
  return {
    error: 'School code must be 6 characters (letters and numbers)',
    code: 'VALIDATION_INVALID_SCHOOL_CODE',
  }
}
```

### 2.4 Invalid PIN

**Error Code**: `VALIDATION_INVALID_PIN`
**HTTP Status**: 400

```typescript
if (!/^\d{4}$/.test(pin)) {
  return {
    error: 'PIN must be 4 digits',
    code: 'VALIDATION_INVALID_PIN',
  }
}
```

---

## 3. Business Logic Errors

### 3.1 Duplicate Email Registration

**Error Code**: `DUPLICATE_EMAIL`
**HTTP Status**: 409

```typescript
const { exists, role } = await checkEmailExistsInAuth(email)

if (exists) {
  return {
    error: `This email is already registered as a ${role}`,
    code: 'DUPLICATE_EMAIL',
    recoveryAction: 'Sign in with this email or use a different email',
  }
}
```

**User-Friendly Message**:
```
"This email is already registered.
Please sign in instead or use a different email address."
```

### 3.2 School Not Found

**Error Code**: `SCHOOL_NOT_FOUND`
**HTTP Status**: 404

```typescript
const school = await findSchoolByCode(schoolCode)

if (!school) {
  return {
    error: 'School code not found in our system',
    code: 'SCHOOL_NOT_FOUND',
    recoveryAction: 'Check the code with your school administrator',
  }
}
```

### 3.3 Incorrect PIN

**Error Code**: `INCORRECT_PIN`
**HTTP Status**: 401

```typescript
if (pin !== school.staff_pin) {
  return {
    error: 'Incorrect PIN for this school',
    code: 'INCORRECT_PIN',
    recoveryAction: 'Verify the PIN with your school administrator',
    attempts: {
      remaining: MAX_ATTEMPTS - attemptsUsed,
      max: MAX_ATTEMPTS,
    },
  }
}
```

### 3.4 Class Full / Enrollment Limit Reached

**Error Code**: `ENROLLMENT_LIMIT_REACHED`
**HTTP Status**: 409

```typescript
if (class.enrollment_count >= class.max_students) {
  return {
    error: 'This class is full',
    code: 'ENROLLMENT_LIMIT_REACHED',
    recoveryAction: 'Try a different class or contact the teacher',
  }
}
```

---

## 4. Server Errors

### 4.1 Database Error

**Error Code**: `DATABASE_ERROR`
**HTTP Status**: 500
**Internal**: Log full error
**External**: Generic message

```typescript
try {
  // Database operation
} catch (error) {
  authLogger.error('[Database]', {
    error: error.message,
    code: error.code,
    context: 'Database operation failed',
  })

  return {
    error: 'A system error occurred. Please try again later',
    code: 'DATABASE_ERROR',
    requestId: generateId(),  // For support
  }
}
```

**User-Friendly Message**:
```
"Something went wrong. Please try again later.
If the problem persists, contact support with code: [REQUEST_ID]"
```

### 4.2 Email Service Error

**Error Code**: `EMAIL_SERVICE_ERROR`
**HTTP Status**: 503
**Impact**: Cannot send OTP

```typescript
try {
  await sendOtpEmail(email, code)
} catch (error) {
  authLogger.error('[EmailService]', {
    error: error.message,
    email,
    context: 'Failed to send OTP',
  })

  return {
    error: 'Unable to send email. Please try again later',
    code: 'EMAIL_SERVICE_ERROR',
  }
}
```

**User-Friendly Message**:
```
"We couldn't send a verification code.
Please check your email address and try again."
```

### 4.3 Network Error

**Error Code**: `NETWORK_ERROR`
**HTTP Status**: 503

```typescript
// Implement exponential backoff
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) {
        authLogger.error('[Network] Max retries exceeded', error)
        throw {
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
        }
      }

      const delay = Math.pow(2, i) * 1000  // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

---

## 5. Error Response Format

### Standard Error Response
```typescript
{
  success: false,
  error: string,                    // User-friendly message
  code: string,                     // Machine-readable code
  details?: unknown,                // Additional context
  recoveryAction?: string,          // What user should do next
  requestId?: string,               // For support/debugging
  retryAfter?: number,              // For rate limiting (seconds)
}
```

### Example Response
```json
{
  "success": false,
  "error": "Too many login attempts",
  "code": "AUTH_RATE_LIMITED",
  "recoveryAction": "Wait before trying again",
  "retryAfter": 3600,
  "requestId": "req_123abc456"
}
```

---

## 6. Logging Best Practices

### 6.1 What to Log

```typescript
// ✅ DO LOG
authLogger.error('[Feature]', {
  error: error.message,
  code: error.code,
  context: 'What was happening',
  userId: user.id,  // Non-sensitive
  timestamp: new Date(),
})

// ❌ DON'T LOG
authLogger.error('[Feature]', {
  error: error,
  password: user.password,
  email: user.email,  // Use masked version
  fullStack: error.stack,  // Too verbose
})
```

### 6.2 Error Masking

```typescript
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain}`
}

function maskPhone(phone: string): string {
  return `***${phone.slice(-4)}`
}

authLogger.warn('[EmailValidation] Duplicate email', {
  email: maskEmail(email),  // Mask sensitive data
  timestamp: new Date(),
})
```

### 6.3 Error Context

```typescript
// ✅ Good - Provides context
authLogger.error('[OTP] Verification failed', {
  email: maskEmail(email),
  attempts: 3,
  code: 'AUTH_INVALID_OTP',
})

// ❌ Bad - No context
authLogger.error('OTP verification error')
```

---

## 7. Client-Side Error Handling

### 7.1 Toast Notifications

```typescript
import { toast } from 'sonner'

try {
  await requestOtp(email)
  toast.success('OTP sent to your email')
} catch (error) {
  // Use error.code to determine message
  if (error.code === 'AUTH_RATE_LIMITED') {
    toast.error(`Too many attempts. Wait ${error.retryAfter} seconds`)
  } else if (error.code === 'AUTH_EMAIL_NOT_FOUND') {
    toast.error('No account found. Please sign up first')
  } else {
    toast.error(error.message || 'An error occurred')
  }
}
```

### 7.2 Form Error Display

```typescript
const [errors, setErrors] = useState<Record<string, string>>({})

async function handleSubmit(formData) {
  try {
    setErrors({})  // Clear previous errors
    await submit(formData)
  } catch (error) {
    if (error.code === 'VALIDATION_WEAK_PASSWORD') {
      setErrors({
        password: error.details.join(', '),  // "At least 8 characters..."
      })
    } else {
      setErrors({ form: error.message })
    }
  }
}

return (
  <form>
    <input type="password" />
    {errors.password && <span className="error">{errors.password}</span>}
    {errors.form && <Alert message={errors.form} />}
  </form>
)
```

---

## 8. Error Recovery Strategies

### 8.1 Automatic Retry

```typescript
async function withRetry(fn, maxRetries = 3) {
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on validation errors
      if (error.code?.startsWith('VALIDATION_')) {
        throw error
      }

      // Don't retry on rate limiting
      if (error.code === 'AUTH_RATE_LIMITED') {
        throw error
      }

      if (i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000)  // Exponential backoff
      }
    }
  }

  throw lastError
}
```

### 8.2 Fallback Actions

```typescript
// If primary flow fails, offer alternatives
if (error.code === 'EMAIL_SERVICE_ERROR') {
  return {
    error: error.message,
    alternatives: [
      {
        label: 'Try again',
        action: 'retry',
      },
      {
        label: 'Use different email',
        action: 'change_email',
      },
      {
        label: 'Contact support',
        action: 'contact_support',
      },
    ],
  }
}
```

---

## 9. Error Monitoring

### 9.1 Error Tracking Setup

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    'VALIDATION_',  // Don't track validation errors
    'NETWORK_',     // Don't track network retry errors
  ],
})
```

### 9.2 Error Alerts

```typescript
// Alert on critical errors
if (error.code === 'DATABASE_ERROR') {
  await alertAdmins({
    severity: 'critical',
    error: error.message,
    timestamp: new Date(),
  })
}
```

---

## 10. Error Code Reference

| Code | HTTP | Category | Recoverable |
|------|------|----------|------------|
| AUTH_EMAIL_NOT_FOUND | 404 | Auth | ✅ Register |
| AUTH_INVALID_OTP | 401 | Auth | ✅ Resend code |
| AUTH_OTP_EXPIRED | 401 | Auth | ✅ Resend code |
| AUTH_RATE_LIMITED | 429 | Auth | ⏱️ Wait |
| VALIDATION_INVALID_EMAIL | 400 | Validation | ✅ Fix input |
| VALIDATION_WEAK_PASSWORD | 400 | Validation | ✅ Strengthen |
| VALIDATION_INVALID_SCHOOL_CODE | 400 | Validation | ✅ Check code |
| VALIDATION_INVALID_PIN | 400 | Validation | ✅ Check PIN |
| DUPLICATE_EMAIL | 409 | Business | ✅ Sign in / New email |
| SCHOOL_NOT_FOUND | 404 | Business | ✅ Check code |
| INCORRECT_PIN | 401 | Business | ✅ Verify PIN |
| ENROLLMENT_LIMIT_REACHED | 409 | Business | ✅ New class |
| DATABASE_ERROR | 500 | Server | ⏱️ Retry |
| EMAIL_SERVICE_ERROR | 503 | Server | ⏱️ Retry |
| NETWORK_ERROR | 503 | Server | ⏱️ Retry |

---

## 11. Checklist for New Features

When adding new error handling:

- [ ] Define error code (e.g., `FEATURE_ERROR_TYPE`)
- [ ] Determine HTTP status code
- [ ] Create user-friendly message
- [ ] Add recovery action/suggestion
- [ ] Implement logging with context
- [ ] Mask sensitive data in logs
- [ ] Add client-side error handling
- [ ] Test error scenarios
- [ ] Document error code
- [ ] Add error code to reference

---

## Conclusion

Proper error handling:
- ✅ Improves user experience
- ✅ Enables faster debugging
- ✅ Provides security
- ✅ Increases system reliability

Always prioritize **user experience** and **security** when handling errors.

