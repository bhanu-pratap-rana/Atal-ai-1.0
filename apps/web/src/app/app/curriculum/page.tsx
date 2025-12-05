import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function CurriculumPage() {
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
          <h1 className="text-4xl font-bold text-orange-600 mb-2">📚 Curriculum</h1>
          <p className="text-gray-600">Access digital literacy curriculum and educational resources</p>
        </div>

        {/* Content */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Digital Literacy Fundamentals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Learn the basics of digital literacy, including computer skills, internet safety, and online communication.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-primary-light text-primary-dark rounded-full text-sm">Beginner</span>
                <span className="px-3 py-1 bg-info-light text-info-dark rounded-full text-sm">8 Modules</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI & Machine Learning Basics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Introduction to artificial intelligence and machine learning concepts for students.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-warning-light text-warning-dark rounded-full text-sm">Intermediate</span>
                <span className="px-3 py-1 bg-info-light text-info-dark rounded-full text-sm">12 Modules</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coding for Beginners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Start your coding journey with Python, HTML, CSS, and JavaScript fundamentals.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-primary-light text-primary-dark rounded-full text-sm">Beginner</span>
                <span className="px-3 py-1 bg-info-light text-info-dark rounded-full text-sm">15 Modules</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-700">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                More curriculum modules are being developed. Check back soon for updates!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
