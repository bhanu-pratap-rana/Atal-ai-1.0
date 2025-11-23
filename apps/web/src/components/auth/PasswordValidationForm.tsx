'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { validatePassword, validatePasswordMatch } from '@/lib/validation-utils'
import { authLogger } from '@/lib/auth-logger'
import { Eye, EyeOff } from 'lucide-react'

/**
 * PasswordValidationForm - Reusable password validation form
 * Handles password and confirm password input with validation
 * Reduces code duplication in auth flows
 */
export interface PasswordValidationFormProps {
  password: string
  onPasswordChange: (password: string) => void
  passwordConfirm: string
  onPasswordConfirmChange: (password: string) => void
  isLoading: boolean
  error?: string
  onErrorChange: (error: string | null) => void
  onSubmit: () => Promise<void>
  submitButtonLabel?: string
  showValidation?: boolean
}

export function PasswordValidationForm({
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
  isLoading,
  error,
  onErrorChange,
  onSubmit,
  submitButtonLabel = 'Create Account',
  showValidation = true,
}: PasswordValidationFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onErrorChange(null)

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      onErrorChange(passwordValidation.errors.join(', ') || 'Invalid password')
      return
    }

    // Validate password match
    const matchValidation = validatePasswordMatch(password, passwordConfirm)
    if (!matchValidation.valid) {
      onErrorChange(matchValidation.error || 'Passwords do not match')
      return
    }

    try {
      authLogger.debug('[PasswordValidationForm] Validating password')
      await onSubmit()
    } catch (err) {
      authLogger.error('[PasswordValidationForm] Password validation failed', err)
      if (err instanceof Error) {
        onErrorChange(err.message || 'An error occurred')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password-input">Password</Label>
        <div className="relative">
          <Input
            id="password-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password (min. 8 characters)"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={isLoading}
            required
            aria-describedby={error ? 'password-error' : 'password-helper'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {showValidation && (
          <p className="text-xs text-gray-600">
            Minimum 8 characters, must include uppercase, lowercase, and number
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password-input">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password-input"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={passwordConfirm}
            onChange={(e) => onPasswordConfirmChange(e.target.value)}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showConfirm ? 'Hide password' : 'Show password'}
          >
            {showConfirm ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p id="password-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? 'Processing...' : submitButtonLabel}
      </Button>
    </form>
  )
}
