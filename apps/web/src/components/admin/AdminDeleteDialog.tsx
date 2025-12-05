'use client'

import { useState } from 'react'
import { deleteAdminAccount } from '@/app/actions/admin-management'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface AdminDeleteDialogProps {
  adminId: string
  adminEmail: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * AdminDeleteDialog - Modal for confirming admin account deletion
 */
export function AdminDeleteDialog({ adminId, adminEmail, isOpen, onClose, onSuccess }: AdminDeleteDialogProps) {
  const [emailConfirmation, setEmailConfirmation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!isOpen) {
    return null
  }

  const isConfirmed = emailConfirmation.toLowerCase() === adminEmail.toLowerCase()

  async function handleDelete() {
    if (!isConfirmed) {
      setMessage({ type: 'error', text: 'Please enter the email address correctly' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await deleteAdminAccount(adminId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Admin account deleted successfully' })
        toast.success('Admin account deleted')

        setTimeout(() => {
          setEmailConfirmation('')
          onClose()
          if (onSuccess) {
            onSuccess()
          }
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete admin account' })
        toast.error(result.error || 'Failed to delete admin account')
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
      setEmailConfirmation('')
      setMessage(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text">Delete Admin Account</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-text-secondary hover:text-text disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              <strong>This action cannot be undone.</strong> All access for this admin will be permanently removed.
            </p>
          </div>
        </div>

        {/* Email Confirmation */}
        <div className="space-y-3 mb-4">
          <p className="text-sm text-text-secondary">
            To confirm deletion, please enter the admin email address:
          </p>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-200">{adminEmail}</p>

          <div className="space-y-2">
            <Label htmlFor="email-confirm" className="text-sm font-semibold">
              Confirm Email
            </Label>
            <Input
              id="email-confirm"
              type="text"
              placeholder="Enter email to confirm"
              value={emailConfirmation}
              onChange={(e) => setEmailConfirmation(e.target.value)}
              disabled={isLoading}
              className="focus:ring-red-500 focus:border-red-500"
            />
          </div>
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
            onClick={handleDelete}
            disabled={isLoading || !isConfirmed}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Admin'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
