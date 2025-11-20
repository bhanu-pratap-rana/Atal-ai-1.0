'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
      router.push('/student/start')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-14 h-14 md:w-20 md:h-20 flex-shrink-0">
              <Image
                src="/assets/logo.png"
                alt="ATAL AI Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain rounded-full"
                style={{
                  boxShadow: `
                    0 0 0 2px white,
                    0 0 0 4px rgba(255, 140, 66, 1),
                    0 0 0 6px white,
                    0 0 0 8px rgba(255, 140, 66, 0.3),
                    0 4px 12px rgba(255, 140, 66, 0.25)
                  `
                }}
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#333]">
                ATAL AI Tutorial
              </h1>
              <p className="text-xs md:text-sm text-[#666]">Smart Learning Platform</p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-orange-50"
          >
            Sign Out
          </Button>
        </div>

        {/* Welcome Card */}
        <div className="mb-8 p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md">
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-[#333]">Welcome to ATAL AI! 🎉</CardTitle>
              <CardDescription>
                You're successfully logged in as {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                This is your dashboard. From here, you'll be able to access all the features of the ATAL AI platform.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            className="p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => router.push('/app/curriculum')}
          >
            <Card className="border-0 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#333]">
                  <span>📚</span>
                  <span>Curriculum</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Access digital literacy curriculum and educational resources.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => router.push(user?.user_metadata?.role === 'teacher' ? '/app/teacher/classes' : '/app/student/classes')}
          >
            <Card className="border-0 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#333]">
                  <span>👥</span>
                  <span>Classes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Manage your classes and student enrollments.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => router.push('/app/progress')}
          >
            <Card className="border-0 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#333]">
                  <span>📊</span>
                  <span>Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Track student progress and performance metrics.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => router.push('/app/ai-tools')}
          >
            <Card className="border-0 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#333]">
                  <span>🤖</span>
                  <span>AI Tools</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Leverage AI-powered tools for personalized learning.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => router.push(user?.user_metadata?.role === 'teacher' ? '/app/teacher/assessments' : '/app/student/assessments')}
          >
            <Card className="border-0 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#333]">
                  <span>📝</span>
                  <span>Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Create and manage assessments and quizzes.
                </p>
              </CardContent>
            </Card>
          </div>

          <div
            className="p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light shadow-md cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => router.push('/app/settings')}
          >
            <Card className="border-0 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#333]">
                  <span>⚙️</span>
                  <span>Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  Manage your account and application preferences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
