'use client'

import { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminRole } from '@/app/actions/admin-roles'

interface RoleGuardProps {
  children: ReactNode
  requiredRole: 'super_admin' | 'admin'
  fallback?: ReactNode
}

/**
 * RoleGuard component - Protects pages/features based on user role
 * Checks authentication and authorization before rendering children
 */
export function RoleGuard({ children, requiredRole, fallback }: RoleGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Get user from session
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          router.push('/admin/login')
          return
        }

        const session = await response.json()
        if (!session?.user?.email) {
          router.push('/admin/login')
          return
        }

        // Check role
        const roleResponse = await fetch(`/api/admin/role?email=${encodeURIComponent(session.user.email)}`)
        const { role } = await roleResponse.json()

        // Verify required role
        if (requiredRole === 'super_admin' && role !== 'super_admin') {
          setIsAuthorized(false)
          setIsLoading(false)
          return
        }

        if (requiredRole === 'admin' && (role !== 'admin' && role !== 'super_admin')) {
          setIsAuthorized(false)
          setIsLoading(false)
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Authorization check failed:', error)
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthorization()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return fallback || <UnauthorizedFallback requiredRole={requiredRole} />
  }

  return <>{children}</>
}

/**
 * Default unauthorized fallback component
 */
function UnauthorizedFallback({ requiredRole }: { requiredRole: string }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-text mb-2">Access Denied</h1>
        <p className="text-text-secondary mb-6">
          You do not have permission to access this page. This area is restricted to {requiredRole} users only.
        </p>
        <button
          onClick={() => router.push('/admin/login')}
          className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}
