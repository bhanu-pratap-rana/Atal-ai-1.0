'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      router.refresh()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                ATAL AI
              </h1>
              <p className="text-sm text-gray-500">Digital Empowerment Platform</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Welcome Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-orange-600">Welcome to ATAL AI! 🎉</CardTitle>
            <CardDescription>
              You're successfully logged in as {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This is your dashboard. From here, you'll be able to access all the features of the ATAL AI platform.
            </p>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/app/curriculum')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📚</span>
                <span>Curriculum</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Access digital literacy curriculum and educational resources.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(user?.user_metadata?.role === 'teacher' ? '/app/teacher/classes' : '/app/student/classes')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👥</span>
                <span>Classes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage your classes and student enrollments.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/app/progress')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span>
                <span>Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Track student progress and performance metrics.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/app/ai-tools')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🤖</span>
                <span>AI Tools</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Leverage AI-powered tools for personalized learning.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(user?.user_metadata?.role === 'teacher' ? '/app/teacher/assessments' : '/app/student/assessments')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📝</span>
                <span>Assessments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Create and manage assessments and quizzes.
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/app/settings')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span>
                <span>Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Manage your account and application preferences.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
