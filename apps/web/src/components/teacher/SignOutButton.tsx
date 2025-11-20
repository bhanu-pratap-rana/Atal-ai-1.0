'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { authLogger } from '@/lib/auth-logger'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error('Failed to sign out: ' + error.message)
        return
      }

      toast.success('Signed out successfully!')
      router.push('/')
    } catch (error) {
      authLogger.error('[SignOutButton] Sign out error', error)
      toast.error('An error occurred while signing out')
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="outline"
      size="sm"
      className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </Button>
  )
}
