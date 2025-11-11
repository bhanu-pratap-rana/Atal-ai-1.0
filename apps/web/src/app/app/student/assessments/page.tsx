import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function StudentAssessmentsPage() {
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
          <h1 className="text-4xl font-bold text-orange-600 mb-2">📝 Assessments</h1>
          <p className="text-gray-600">View and complete your assessments</p>
        </div>

        {/* Assessment Categories */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No assessments available</p>
                <p className="text-gray-500 text-sm mt-2">
                  Join a class to see assessments assigned by your teacher
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No completed assessments</p>
                <p className="text-gray-500 text-sm mt-2">
                  Your completed assessments will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
