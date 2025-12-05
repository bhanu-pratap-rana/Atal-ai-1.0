'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminAccount } from '@/app/actions/admin-management'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const SUPER_ADMIN_EMAIL = 'atal.app.ai@gmail.com'

export default function AdminInitializePage() {
  const router = useRouter()
  const [email] = useState(SUPER_ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [completed, setCompleted] = useState(false)

  async function handleCreateSuperAdmin() {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    if (email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      setMessage({
        type: 'error',
        text: `Super admin email must be ${SUPER_ADMIN_EMAIL}`,
      })
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
      const result = await createAdminAccount(email.trim().toLowerCase(), password, 'super_admin')

      if (result.success) {
        setMessage({
          type: 'success',
          text: '✓ Super admin account created successfully! You can now login.',
        })
        toast.success(`Super admin account created for ${email}`)
        setCompleted(true)

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/admin/login')
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create super admin account' })
        toast.error(result.error || 'Failed to create super admin account')
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
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <AuthCard
        title="Initialize Super Admin"
        description="Set up the super admin account for system administration"
      >
        <div className="space-y-6">
          {/* Warning Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900">
              <strong>👑 Super Admin Setup</strong>
              <br />
              <span className="text-xs">
                This page initializes the super admin account. Only the designated super admin email can create this
                account.
              </span>
            </p>
          </div>

          {!completed ? (
            <>
              {/* Email Input (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="super-admin-email" className="text-sm font-semibold">
                  Super Admin Email
                </Label>
                <Input
                  id="super-admin-email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-text-secondary">This email is pre-configured for super admin access</p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="super-admin-password" className="text-sm font-semibold">
                  Password (min. 8 characters)
                </Label>
                <div className="relative">
                  <Input
                    id="super-admin-password"
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
                <Label htmlFor="confirm-super-admin-password" className="text-sm font-semibold">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-super-admin-password"
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
                onClick={handleCreateSuperAdmin}
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-orange-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Super Admin...
                  </>
                ) : (
                  'Create Super Admin Account'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-900 font-semibold">✓ Super Admin Account Created!</p>
                    <p className="text-xs text-green-800 mt-2">
                      Your super admin account has been set up successfully. You can now login to the admin panel and
                      manage the system.
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <Button
                onClick={() => router.push('/admin/login')}
                className="w-full bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-orange-600"
              >
                Go to Admin Login
              </Button>
            </>
          )}

          {/* Security Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-xs text-orange-900">
              <strong>🔒 Security:</strong> Store your super admin password securely. You&apos;ll need it to login and
              manage the system.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">📋 Super Admin Capabilities:</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Create and manage admin accounts</li>
              <li>Reset admin passwords</li>
              <li>Delete admin accounts</li>
              <li>View system dashboard and metrics</li>
              <li>Manage school PIN creation and rotation</li>
              <li>Access all system administration features</li>
            </ul>
          </div>
        </div>
      </AuthCard>
    </div>
  )
}
