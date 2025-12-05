/**
 * Form Validation Tests
 * Tests multi-field form validators for registration, sign-in, and class joining
 */

import {
  validateRegistrationForm,
  validateSignInForm,
  validatePhoneSignInForm,
  validatePhoneSignUpForm,
  validateJoinClassForm,
  formatValidationErrors,
  type RegistrationFormData,
  type SignInFormData,
} from '@/lib/form-validation'

describe('Registration Form Validation', () => {
  describe('validateRegistrationForm', () => {
    it('should accept valid registration data', () => {
      const data: RegistrationFormData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should reject invalid email', () => {
      const data: RegistrationFormData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'John Doe',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('should reject weak password', () => {
      const data: RegistrationFormData = {
        email: 'user@example.com',
        password: 'weak',
        name: 'John Doe',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should reject invalid name', () => {
      const data: RegistrationFormData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'A',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('should collect all validation errors', () => {
      const data: RegistrationFormData = {
        email: 'invalid',
        password: 'weak',
        name: 'X',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })

    it('should reject empty email', () => {
      const data: RegistrationFormData = {
        email: '',
        password: 'SecurePass123!',
        name: 'John Doe',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('should reject empty password', () => {
      const data: RegistrationFormData = {
        email: 'user@example.com',
        password: '',
        name: 'John Doe',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should reject empty name', () => {
      const data: RegistrationFormData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: '',
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('should accept valid emails with common domains', () => {
      const validEmails = [
        'user@gmail.com',
        'user@outlook.com',
        'user@yahoo.com',
        'user@protonmail.com',
      ]
      validEmails.forEach(email => {
        const data: RegistrationFormData = {
          email,
          password: 'SecurePass123!',
          name: 'John Doe',
        }
        const result = validateRegistrationForm(data)
        expect(result.valid).toBe(true)
      })
    })

    it('should handle special characters in name', () => {
      const data: RegistrationFormData = {
        email: 'user@gmail.com',
        password: 'SecurePass123!',
        name: "John-Paul O'Connor",
      }
      const result = validateRegistrationForm(data)
      expect(result.valid).toBe(true)
    })
  })
})

describe('Sign-In Form Validation', () => {
  describe('validateSignInForm', () => {
    it('should accept valid sign-in data', () => {
      const data: SignInFormData = {
        email: 'user@example.com',
        password: 'Password123',
      }
      const result = validateSignInForm(data)
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should reject invalid email', () => {
      const data: SignInFormData = {
        email: 'invalid-email',
        password: 'Password123',
      }
      const result = validateSignInForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('should reject missing password', () => {
      const data: SignInFormData = {
        email: 'user@example.com',
        password: '',
      }
      const result = validateSignInForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should accept any non-empty password', () => {
      const data: SignInFormData = {
        email: 'user@example.com',
        password: 'anypassword',
      }
      const result = validateSignInForm(data)
      expect(result.valid).toBe(true)
    })

    it('should reject empty email', () => {
      const data: SignInFormData = {
        email: '',
        password: 'Password123',
      }
      const result = validateSignInForm(data)
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBeDefined()
    })

    it('should collect multiple errors', () => {
      const data: SignInFormData = {
        email: 'invalid',
        password: '',
      }
      const result = validateSignInForm(data)
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })
  })
})

describe('Phone Sign-In Form Validation', () => {
  describe('validatePhoneSignInForm', () => {
    it('should accept valid phone sign-in data', () => {
      const result = validatePhoneSignInForm('9876543210', 'Password123')
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should accept phone numbers with country code', () => {
      const result = validatePhoneSignInForm('+919876543210', 'Password123')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      const result = validatePhoneSignInForm('123', 'Password123')
      expect(result.valid).toBe(false)
      expect(result.errors.phone).toBeDefined()
    })

    it('should reject missing password', () => {
      const result = validatePhoneSignInForm('9876543210', '')
      expect(result.valid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should accept any non-empty password', () => {
      const result = validatePhoneSignInForm('9876543210', 'anypassword')
      expect(result.valid).toBe(true)
    })

    it('should collect multiple errors', () => {
      const result = validatePhoneSignInForm('123', '')
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })

    it('should reject empty phone', () => {
      const result = validatePhoneSignInForm('', 'Password123')
      expect(result.valid).toBe(false)
      expect(result.errors.phone).toBeDefined()
    })
  })
})

describe('Phone Sign-Up Form Validation', () => {
  describe('validatePhoneSignUpForm', () => {
    it('should accept valid phone sign-up data', () => {
      const result = validatePhoneSignUpForm('9876543210', 'SecurePass123!', 'SecurePass123!')
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should accept phone numbers with country code', () => {
      const result = validatePhoneSignUpForm('+919876543210', 'SecurePass123!', 'SecurePass123!')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      const result = validatePhoneSignUpForm('123', 'SecurePass123!', 'SecurePass123!')
      expect(result.valid).toBe(false)
      expect(result.errors.phone).toBeDefined()
    })

    it('should reject weak password', () => {
      const result = validatePhoneSignUpForm('9876543210', 'weak', 'weak')
      expect(result.valid).toBe(false)
      expect(result.errors.password).toBeDefined()
    })

    it('should reject mismatched passwords', () => {
      const result = validatePhoneSignUpForm('9876543210', 'SecurePass123!', 'Different123!')
      expect(result.valid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })

    it('should collect multiple errors', () => {
      const result = validatePhoneSignUpForm('123', 'weak', 'Different!')
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })

    it('should reject empty confirm password', () => {
      const result = validatePhoneSignUpForm('9876543210', 'SecurePass123!', '')
      expect(result.valid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })

    it('should be case-sensitive for password matching', () => {
      const result = validatePhoneSignUpForm('9876543210', 'SecurePass123!', 'securepass123!')
      expect(result.valid).toBe(false)
      expect(result.errors.confirmPassword).toBeDefined()
    })
  })
})

describe('Join Class Form Validation', () => {
  describe('validateJoinClassForm', () => {
    it('should accept valid join class data', () => {
      const result = validateJoinClassForm('CLASS1', '001', '1234')
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should accept class codes with various formats', () => {
      const validCodes = ['ABC123', 'XYZ789', '123456']
      validCodes.forEach(code => {
        const result = validateJoinClassForm(code, '001', '1234')
        expect(result.valid).toBe(true)
      })
    })

    it('should reject invalid class code', () => {
      const result = validateJoinClassForm('AB', '001', '1234')
      expect(result.valid).toBe(false)
      expect(result.errors.classCode).toBeDefined()
    })

    it('should reject invalid roll number', () => {
      const result = validateJoinClassForm('CLASS1', '', '1234')
      expect(result.valid).toBe(false)
      expect(result.errors.rollNumber).toBeDefined()
    })

    it('should reject invalid PIN', () => {
      const result = validateJoinClassForm('CLASS1', '001', '12345')
      expect(result.valid).toBe(false)
      expect(result.errors.pin).toBeDefined()
    })

    it('should accept PIN with leading zeros', () => {
      const result = validateJoinClassForm('CLASS1', '001', '0001')
      expect(result.valid).toBe(true)
    })

    it('should collect multiple errors', () => {
      const result = validateJoinClassForm('INVALID', '', '123')
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })

    it('should accept alphanumeric roll numbers', () => {
      const validRollNumbers = ['001', 'A001', '2024001', 'CLASS-001']
      validRollNumbers.forEach(rollNumber => {
        const result = validateJoinClassForm('CLASS1', rollNumber, '1234')
        expect(result.valid).toBe(true)
      })
    })

    it('should reject empty class code', () => {
      const result = validateJoinClassForm('', '001', '1234')
      expect(result.valid).toBe(false)
      expect(result.errors.classCode).toBeDefined()
    })

    it('should accept various valid PIN formats', () => {
      const validPINs = ['0000', '1111', '9999', '5678']
      validPINs.forEach(pin => {
        const result = validateJoinClassForm('CLASS1', '001', pin)
        expect(result.valid).toBe(true)
      })
    })
  })
})

describe('Error Formatting', () => {
  describe('formatValidationErrors', () => {
    it('should format single error', () => {
      const errors = { email: 'Invalid email format' }
      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('email')
      expect(formatted).toContain('Invalid email format')
    })

    it('should format multiple errors', () => {
      const errors = {
        email: 'Invalid email',
        password: 'Password too weak',
        name: 'Name required',
      }
      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('email')
      expect(formatted).toContain('password')
      expect(formatted).toContain('name')
    })

    it('should separate errors with newlines', () => {
      const errors = {
        email: 'Invalid email',
        password: 'Password too weak',
      }
      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('\n')
    })

    it('should include field names and messages', () => {
      const errors = {
        phone: 'Invalid phone number',
        pin: 'PIN must be 4 digits',
      }
      const formatted = formatValidationErrors(errors)
      expect(formatted).toMatch(/phone:.*Invalid phone number/)
      expect(formatted).toMatch(/pin:.*PIN must be 4 digits/)
    })

    it('should handle empty error object', () => {
      const errors = {}
      const formatted = formatValidationErrors(errors)
      expect(formatted).toBe('')
    })

    it('should preserve special characters in messages', () => {
      const errors = {
        field: 'Error with special chars: @#$%',
      }
      const formatted = formatValidationErrors(errors)
      expect(formatted).toContain('@#$%')
    })
  })
})
