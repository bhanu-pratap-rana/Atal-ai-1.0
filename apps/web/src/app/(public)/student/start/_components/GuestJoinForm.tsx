'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  validateClassCode,
  validatePIN,
  sanitizeClassCode,
  sanitizePIN,
} from '@/lib/validation-utils'
import { PIN_LENGTH, CLASS_CODE_LENGTH } from '@/lib/auth-constants'
import { joinClass } from '@/app/actions/student'
import { createClient } from '@/lib/supabase-browser'
import { authLogger } from '@/lib/auth-logger'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { AuthState, AuthActions } from '@/hooks/useAuthState'

interface GuestJoinFormProps {
  state: AuthState
  actions: AuthActions
  isLoading: boolean
  onSuccess: () => void
}

export function GuestJoinForm({ state, actions, isLoading, onSuccess }: GuestJoinFormProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleGuestJoinClass(e: React.FormEvent) {
    e.preventDefault()
    actions.setIsLoading(true)
    actions.setGuestError(null)

    // Validate inputs
    const codeValidation = validateClassCode(state.guestClassCode)
    const pinValidation = validatePIN(state.guestPin)

    if (!codeValidation.valid || !pinValidation.valid) {
      const error = !codeValidation.valid ? codeValidation.error : pinValidation.error
      actions.setGuestError(error || 'Invalid input')
      actions.setIsLoading(false)
      return
    }

    try {
      // First, sign in anonymously
      const { error: anonError } = await supabase.auth.signInAnonymously()

      if (anonError) {
        actions.setGuestError(anonError.message)
        toast.error(anonError.message)
        actions.setIsLoading(false)
        return
      }

      // Then join class
      const result = await joinClass({
        classCode: state.guestClassCode.toUpperCase().trim(),
        rollNumber: state.guestRollNumber.trim(),
        pin: state.guestPin.trim(),
      })

      if (result.success) {
        toast.success('Successfully joined class! 🎉')
        actions.resetGuest()
        onSuccess()
        router.push('/app/student/classes')
      } else {
        actions.setGuestError(result.error || 'Failed to join class')
        toast.error(result.error || 'Failed to join class')
      }
    } catch (error) {
      authLogger.error('[Guest Join] Failed to join class', error)
      actions.setGuestError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      actions.setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleGuestJoinClass} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guest-class-code">Class Code</Label>
        <Input
          id="guest-class-code"
          type="text"
          placeholder="A3F7E2"
          value={state.guestClassCode}
          onChange={(e) => actions.setGuestClassCode(sanitizeClassCode(e.target.value))}
          required
          disabled={isLoading}
          maxLength={CLASS_CODE_LENGTH}
          className="uppercase font-mono text-center text-xl tracking-widest"
        />
        <p className="text-xs text-text-secondary">6-character code provided by your teacher</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest-roll-number">Roll Number</Label>
        <Input
          id="guest-roll-number"
          type="text"
          placeholder="e.g., 101, ST2024001"
          value={state.guestRollNumber}
          onChange={(e) => actions.setGuestRollNumber(e.target.value)}
          required
          disabled={isLoading}
        />
        <p className="text-xs text-text-secondary">Your student roll number or ID</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest-pin">Class PIN</Label>
        <Input
          id="guest-pin"
          type="password"
          placeholder="••••"
          value={state.guestPin}
          onChange={(e) => actions.setGuestPin(sanitizePIN(e.target.value))}
          required
          disabled={isLoading}
          maxLength={PIN_LENGTH}
          className="text-center text-2xl font-mono tracking-widest"
        />
        <p className="text-xs text-text-secondary">4-digit PIN provided by your teacher</p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
        <p className="text-xs text-blue-800">
          <strong>📌 Note:</strong> Your teacher will verify your enrollment. Make sure to use
          the correct roll number.
        </p>
      </div>

      {state.guestError && <p className="text-sm text-red-600">{state.guestError}</p>}

      <Button
        type="submit"
        className="w-full text-[17px] shadow-[0_8px_20px_rgba(255,140,66,0.35)] hover:shadow-[0_12px_28px_rgba(255,140,66,0.45)] hover:-translate-y-0.5"
        disabled={
          isLoading || !state.guestClassCode || !state.guestRollNumber || state.guestPin.length !== PIN_LENGTH
        }
        loading={isLoading}
      >
        Join Class
        <span className="ml-2">→</span>
      </Button>
    </form>
  )
}
