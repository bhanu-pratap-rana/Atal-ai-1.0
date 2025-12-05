'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AdminCreateForm } from '@/components/admin/AdminCreateForm'
import { AdminListTable } from '@/components/admin/AdminListTable'
import { ArrowLeft, Plus, Users } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function AdminsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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
      } catch {
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="outline"
              size="sm"
              className="text-primary border-primary hover:bg-orange-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-text">Admin Management</h1>
          </div>

          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Admin
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Create Form Section */}
        {showCreateForm && (
          <section className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text">Create New Admin Account</h2>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>

            <AdminCreateForm
              onSuccess={() => {
                setShowCreateForm(false)
                setRefreshTrigger((prev) => prev + 1)
              }}
            />
          </section>
        )}

        {/* Admin List Section */}
        <section className="bg-white rounded-lg shadow border border-gray-100">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-text">All Admin Accounts</h2>
            </div>
            <p className="text-sm text-text-secondary">
              Manage all admin accounts in the system. You can create, delete, and reset passwords.
            </p>
          </div>

          <div className="p-6">
            <AdminListTable
              refreshTrigger={refreshTrigger}
              onAdminDeleted={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </div>
        </section>

        {/* Help Section */}
        <section className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Super Admin Info */}
            <div className="bg-accent-light border border-accent/30 rounded-lg p-6">
              <h3 className="font-semibold text-accent-dark mb-2">👑 Super Admin Role</h3>
              <ul className="text-sm text-secondary space-y-2 list-disc list-inside">
                <li>Full system access and management</li>
                <li>Can create and delete admin accounts</li>
                <li>Can reset admin passwords</li>
                <li>Can manage school PINs</li>
                <li>Access to admin dashboard and metrics</li>
              </ul>
            </div>

            {/* Regular Admin Info */}
            <div className="bg-primary-lighter border border-primary/30 rounded-lg p-6">
              <h3 className="font-semibold text-primary-dark mb-2">👤 Regular Admin Role</h3>
              <ul className="text-sm text-secondary space-y-2 list-disc list-inside">
                <li>Limited to PIN management only</li>
                <li>Can create and rotate school PINs</li>
                <li>Can reset own password only</li>
                <li>Cannot access admin management</li>
                <li>Cannot view system metrics</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
