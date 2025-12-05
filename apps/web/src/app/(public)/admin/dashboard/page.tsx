'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { DashboardMetrics } from '@/components/admin/DashboardMetrics'
import { LogOut, Users, Lock, Crown } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

/**
 * ATAL AI Admin Dashboard - Jyoti Theme (Dark Mode)
 * 
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

export default function AdminDashboardPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user?.email) {
          router.push('/admin/login')
          return
        }

        const role = user.app_metadata?.role as string
        if (role !== 'super_admin') {
          router.push('/admin/pins')
          return
        }

        setUserEmail(user.email)
      } catch {
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <header className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-12 h-12 flex-shrink-0">
              <Image
                src="/assets/logo.png"
                alt="ATAL AI Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain rounded-full ring-2 ring-stone-800 ring-offset-2 ring-offset-primary shadow-primary-md"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                {/* Super Admin Crown - Gold Accent */}
                <div className="bg-accent-light p-1.5 rounded-lg">
                  <Crown className="w-4 h-4 text-accent-dark" />
                </div>
              </div>
              <p className="text-sm text-text-muted mt-1">Welcome back, {userEmail}</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="destructive"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">System Overview</h2>
          <DashboardMetrics />
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Management Card */}
          <div className="bg-stone-800 rounded-[20px] p-6 border border-stone-700">
            <div className="flex items-center gap-3 mb-4">
              {/* Icon Box - Primary Light (consistent even in dark mode) */}
              <div className="w-12 h-12 bg-primary-light rounded-[12px] flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Management</h3>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Create new admin accounts, reset passwords, and manage admin access to the system.
            </p>
            <Button
              onClick={() => router.push('/admin/admins')}
              className="w-full"
            >
              Manage Admins
            </Button>
          </div>

          {/* PIN Management Card */}
          <div className="bg-stone-800 rounded-[20px] p-6 border border-stone-700">
            <div className="flex items-center gap-3 mb-4">
              {/* Icon Box - Primary Light */}
              <div className="w-12 h-12 bg-primary-light rounded-[12px] flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">School PIN Management</h3>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Manage school PIN creation and rotation. Monitor PIN activity and security status.
            </p>
            <Button
              onClick={() => router.push('/admin/pins')}
              variant="secondary"
              className="w-full"
            >
              Manage PINs
            </Button>
          </div>
        </section>

        {/* Info Section */}
        <section className="mt-8">
          <div className="bg-info/10 border border-info/30 rounded-[16px] p-6">
            <h3 className="font-semibold text-info mb-2">ℹ️ Admin Dashboard Information</h3>
            <ul className="text-sm text-info/80 space-y-2 list-disc list-inside">
              <li>Monitor system-wide metrics for schools, teachers, and students</li>
              <li>Create and manage admin accounts with different role levels</li>
              <li>Reset admin passwords when needed</li>
              <li>Delete admin accounts that are no longer needed</li>
              <li>View admin activity and last login times</li>
              <li>Access PIN management and security controls</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
