'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface UnauthorizedMessageProps {
  title?: string
  message?: string
  showLoginButton?: boolean
  onDismiss?: () => void
}

/**
 * UnauthorizedMessage - Display access denied message with optional actions
 */
export function UnauthorizedMessage({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  showLoginButton = true,
  onDismiss,
}: UnauthorizedMessageProps) {
  const router = useRouter()

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">{title}</h3>
            <p className="text-sm text-red-800 mb-4">{message}</p>

            <div className="flex gap-2">
              {showLoginButton && (
                <Button
                  onClick={() => router.push('/admin/login')}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-100"
                >
                  Back to Login
                </Button>
              )}
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-100"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
