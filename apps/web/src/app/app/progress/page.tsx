import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app/dashboard" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-orange-600 mb-2">📊 Progress</h1>
          <p className="text-gray-600">Track your progress and performance metrics</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-700 text-lg">Courses Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600">0</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-700 text-lg">Assessments Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-yellow-600">0</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700 text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">--</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No activity yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Start taking courses and assessments to see your progress here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
