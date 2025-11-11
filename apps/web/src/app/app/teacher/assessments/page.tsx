import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function TeacherAssessmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.user_metadata?.role !== 'teacher') {
    redirect('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/app/dashboard" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-orange-600 mb-2">📝 Assessments</h1>
            <p className="text-gray-600">Create and manage assessments for your classes</p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700">
            + Create Assessment
          </Button>
        </div>

        {/* Assessment List */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sample Pre-Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                A sample multi-language pre-assessment to test basic digital literacy skills.
              </p>
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">10 Questions</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Active</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="outline" size="sm">Results</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-dashed">
            <CardContent className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No more assessments</p>
              <Button className="bg-orange-600 hover:bg-orange-700">
                Create Your First Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
