'use client'

import { useState } from 'react'
import { createAdminAccount } from '@/app/actions/admin-management'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface AdminCreateFormProps {
  onSuccess?: () => void
  adminRole?: 'admin' | 'super_admin'
}

/**
 * AdminCreateForm - Form to create a new admin account
 */
export function AdminCreateForm({ onSuccess, adminRole = 'admin' }: AdminCreateFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleCreateAdmin() {
    // Validation
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Please enter a password' })
      return
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await createAdminAccount(email.trim().toLowerCase(), password, adminRole)

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✓ Admin account created successfully for ${email}`,
        })
        toast.success(`Admin account created for ${email}`)

        // Clear form
        setEmail('')
        setPassword('')
        setConfirmPassword('')

        // Call success callback
        if (onSuccess) {
          setTimeout(onSuccess, 1500)
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create admin account' })
        toast.error(result.error || 'Failed to create admin account')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setMessage({ type: 'error', text: errorMsg })
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="admin-email" className="text-sm font-semibold">
          Admin Email
        </Label>
        <Input
          id="admin-email"
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="focus:ring-primary focus:border-primary"
        />
        <p className="text-xs text-text-secondary">This email will be used to login to the admin panel</p>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="create-password" className="text-sm font-semibold">
          Password (min. 8 characters)
        </Label>
        <div className="relative">
          <Input
            id="create-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="focus:ring-primary focus:border-primary pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
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
          className={`flex gap-3 p-4 rounded-lg border ${
            message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span className={message.type === 'success' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
            {message.text}
          </span>
        </div>
      )}

      {/* Create Button */}
      <Button
        onClick={handleCreateAdmin}
        disabled={isLoading || !email.trim() || !password || !confirmPassword}
        className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Admin Account'
        )}
      </Button>
    </div>
  )
}
