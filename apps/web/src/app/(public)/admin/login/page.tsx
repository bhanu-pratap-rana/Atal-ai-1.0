'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { clientLogger } from '@/lib/client-logger'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if user is admin
        const user = session.user
        if (user.app_metadata?.role === 'admin') {
          setHasSession(true)
          router.push('/app/admin/schools')
        } else {
          // Not an admin, redirect to home
          router.push('/')
        }
      }
    }
    checkAuth()
  }, [supabase, router])

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Basic validation
      if (!email.trim()) {
        setError('Email is required')
        setIsLoading(false)
        return
      }

      if (!password) {
        setError('Password is required')
        setIsLoading(false)
        return
      }

      // Attempt login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError || !data.user) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      // Check if user has admin role
      const user = data.user
      const isAdmin = user.app_metadata?.role === 'admin'

      if (!isAdmin) {
        // User exists but is not an admin
        await supabase.auth.signOut()
        setError('This account does not have admin access')
        setIsLoading(false)
        return
      }

      // Success - redirect to admin panel
      toast.success('Admin login successful!')
      router.push('/app/admin/schools')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      clientLogger.error('Admin login error', { error: err })
    } finally {
      setIsLoading(false)
    }
  }

  if (hasSession) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      {/* Back Button - Top Left */}
      <div className="absolute top-4 left-4">
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          size="sm"
          className="text-sm border-primary text-primary hover:bg-orange-50"
        >
          ← Back
        </Button>
      </div>

      <AuthCard
        title="Admin Login"
        description="Enter your admin credentials to access the administrative panel"
      >
        <form onSubmit={handleAdminLogin} className="space-y-6">
          {/* Admin Icon */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-full border-2 border-primary/20">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-semibold">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="focus:ring-primary focus:border-primary"
              required
            />
            <p className="text-xs text-text-secondary">
              Example: atal.app.ai@gmail.com
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-sm font-semibold">
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="focus:ring-primary focus:border-primary"
              required
            />
            <p className="text-xs text-text-secondary">
              Enter your secure admin password
            </p>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            loading={isLoading}
            className="w-full shadow-[0_4px_12px_rgba(255,140,66,0.25)] hover:shadow-[0_8px_20px_rgba(255,140,66,0.35)]"
          >
            {isLoading ? 'Logging in...' : 'Login as Admin'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-primary p-4 rounded-lg">
            <p className="text-sm text-orange-900">
              <strong>🔒 Security Notice</strong>
              <br />
              <span className="text-xs">
                Admin access is restricted. Only accounts with admin role can login here.
              </span>
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>👤 Default Admin:</strong>
              <br />
              <span className="text-xs font-mono">atal.app.ai@gmail.com</span>
              <br />
              <span className="text-xs">
                Contact system administrator if you don't have admin credentials
              </span>
            </p>
          </div>
        </form>
      </AuthCard>
    </div>
  )
}
