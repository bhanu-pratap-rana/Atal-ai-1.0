'use client'

import { useState } from 'react'
import { resetAdminPassword } from '@/app/actions/admin-management'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface AdminResetPasswordDialogProps {
  adminId: string
  adminEmail: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * AdminResetPasswordDialog - Modal for resetting admin password
 */
export function AdminResetPasswordDialog({
  adminId,
  adminEmail,
  isOpen,
  onClose,
  onSuccess,
}: AdminResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!isOpen) {
    return null
  }

  async function handleResetPassword() {
    if (!newPassword) {
      setMessage({ type: 'error', text: 'Please enter a new password' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await resetAdminPassword(adminId, newPassword)

      if (result.success) {
        setMessage({ type: 'success', text: 'Password reset successfully' })
        toast.success('Password reset successfully')

        setTimeout(() => {
          setNewPassword('')
          setConfirmPassword('')
          onClose()
          if (onSuccess) {
            onSuccess()
          }
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reset password' })
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setMessage({ type: 'error', text: errorMsg })
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    if (!isLoading) {
      setNewPassword('')
      setConfirmPassword('')
      setMessage(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Reset Password</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-text-secondary hover:text-text disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-info-light border border-info/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-info-dark">
            <strong>Admin:</strong> {adminEmail}
          </p>
          <p className="text-xs text-info mt-2">
            The admin will need to use the new password on their next login.
          </p>
        </div>

        {/* New Password Input */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="new-password" className="text-sm font-semibold">
            New Password (min. 8 characters)
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className="focus:ring-primary focus:border-primary pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="confirm-password" className="text-sm font-semibold">
            Confirm Password
          </Label>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`flex gap-3 p-3 rounded-lg border mb-4 ${
              message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            disabled={isLoading || !newPassword || !confirmPassword}
            className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
