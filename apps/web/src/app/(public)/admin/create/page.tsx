'use client'

import { useState } from 'react'
import { createAdminUser } from '@/app/actions/admin-auth'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateAdminPage() {
  const [email, setEmail] = useState('atal.app.ai@gmail.com')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleCreateAdmin() {
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
      const result = await createAdminUser(email.trim().toLowerCase(), password)

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✓ Admin account created! Email: ${email}`,
        })
        toast.success(`Admin account created for ${email}`)

        // Clear form
        setEmail('atal.app.ai@gmail.com')
        setPassword('')
        setConfirmPassword('')

        // Show next steps message after 2 seconds
        setTimeout(() => {
          setMessage({
            type: 'success',
            text: `✓ You can now login at /admin/login with:\nEmail: ${email}\nPassword: ${password}`,
          })
        }, 2000)
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
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button
          onClick={() => (window.location.href = '/admin/login')}
          variant="outline"
          size="sm"
          className="text-sm border-primary text-primary hover:bg-orange-50"
        >
          ← Back to Login
        </Button>
      </div>

      <AuthCard
        title="Create Admin Account"
        description="Create a new admin user account for system access"
      >
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ First Time Setup:</strong>
              <br />
              <span className="text-xs">
                Create an admin account with email and password. After creation, you can login to
                the admin panel.
              </span>
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-semibold">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="atal.app.ai@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-text-secondary">
              This email will be used to login to the admin panel
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-sm font-semibold">
              Password (min. 8 characters)
            </Label>
            <div className="relative">
              <Input
                id="admin-password"
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
            <p className="text-xs text-text-secondary">Use a strong, unique password</p>
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
              className={`flex gap-3 p-4 rounded-lg border whitespace-pre-wrap ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
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

          {/* Security Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-xs text-orange-900">
              <strong>🔒 Security:</strong> Store your admin password securely. You&apos;ll need it to
              login to the admin panel.
            </p>
          </div>

          {/* Instructions Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-900 font-semibold mb-2">📋 Next Steps:</p>
            <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
              <li>Create admin account with email and password</li>
              <li>Go to /admin/login</li>
              <li>Enter the email and password you just created</li>
              <li>Access the admin panel</li>
            </ol>
          </div>
        </div>
      </AuthCard>
    </div>
  )
}
