import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app/dashboard" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-orange-600 mb-2">⚙️ Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

        {/* Account Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">User ID</label>
              <p className="text-gray-900 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Role</label>
              <p className="text-gray-900 capitalize">{user.user_metadata?.role || 'student'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Account Created</label>
              <p className="text-gray-900">{new Date(user.created_at || '').toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email updates about your progress</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Assessment Reminders</p>
                  <p className="text-sm text-gray-600">Get reminders for upcoming assessments</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Enabled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
