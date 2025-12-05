'use client'

import { useState } from 'react'
import { setAdminRole, checkAdminRoleByEmail } from '@/app/actions/admin'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSetupPage() {
  const [email, setEmail] = useState('atal.app.ai@gmail.com')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [checkResult, setCheckResult] = useState<{ isAdmin: boolean; checked: boolean }>({
    isAdmin: false,
    checked: false,
  })

  async function handleSetAdminRole() {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await setAdminRole(email.trim().toLowerCase())

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Admin role set successfully!' })
        toast.success('Admin role set! You can now login.')
        // Clear check result to force re-check
        setCheckResult({ isAdmin: false, checked: false })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to set admin role' })
        toast.error(result.error || 'Failed to set admin role')
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setMessage({ type: 'error', text: errorMsg })
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCheckAdminRole() {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await checkAdminRoleByEmail(email.trim().toLowerCase())

      if (result.hasAdminRole) {
        setMessage({ type: 'success', text: `${email} has admin role ✓` })
        setCheckResult({ isAdmin: true, checked: true })
      } else {
        setMessage({
          type: 'error',
          text: result.error || `${email} does NOT have admin role yet`,
        })
        setCheckResult({ isAdmin: false, checked: true })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      setMessage({ type: 'error', text: errorMsg })
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
        title="Admin Role Setup"
        description="Set admin role for a user account to enable admin login"
      >
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-info-light border border-info/30 rounded-lg p-4">
            <p className="text-sm text-info-dark">
              <strong>ℹ️ What this does:</strong>
              <br />
              <span className="text-xs">
                This tool sets the admin role metadata on a user account. After setting the role, the user can login to
                the admin panel using their email and password.
              </span>
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-semibold">
              User Email Address
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
              Enter the email of the user account you want to make admin
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`flex gap-3 p-4 rounded-lg border ${
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
              <span className={message.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                {message.text}
              </span>
            </div>
          )}

          {/* Check Status Box */}
          {checkResult.checked && (
            <div
              className={`flex gap-3 p-4 rounded-lg border ${
                checkResult.isAdmin
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              {checkResult.isAdmin ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <strong>Ready to Login!</strong>
                    <br />
                    <span className="text-xs">
                      This user now has admin access. Go to the login page and enter their credentials.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <strong>Not Admin Yet</strong>
                    <br />
                    <span className="text-xs">
                      Click &quot;Set Admin Role&quot; below to grant admin access to this user.
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCheckAdminRole}
              disabled={isLoading || !email.trim()}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status'
              )}
            </Button>
            <Button
              onClick={handleSetAdminRole}
              disabled={isLoading || !email.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting...
                </>
              ) : (
                'Set Admin Role'
              )}
            </Button>
          </div>

          {/* Instructions Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900 font-semibold mb-2">📋 How to use:</p>
            <ol className="text-xs text-orange-800 space-y-1 list-decimal list-inside">
              <li>Make sure the user account exists in Supabase (check Users in dashboard)</li>
              <li>Enter the user&apos;s email address above</li>
              <li>Click &quot;Check Status&quot; to verify current role</li>
              <li>Click &quot;Set Admin Role&quot; to grant admin access</li>
              <li>After success, the user can login to admin panel</li>
              <li>Go to /admin/login with their email and password</li>
            </ol>
          </div>

          {/* Troubleshooting Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-900 font-semibold mb-2">🔧 Troubleshooting:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>
                <strong>User not found:</strong> Make sure the user exists in Supabase Users list
              </li>
              <li>
                <strong>Error setting role:</strong> Check that you have service role access
              </li>
              <li>
                <strong>Still can&apos;t login:</strong> Try clearing browser cache (Ctrl+Shift+Del)
              </li>
            </ul>
          </div>
        </div>
      </AuthCard>
    </div>
  )
}
