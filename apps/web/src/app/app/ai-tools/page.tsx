import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function AIToolsPage() {
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
          <h1 className="text-4xl font-bold text-orange-600 mb-2">🤖 AI Tools</h1>
          <p className="text-gray-600">Leverage AI-powered tools for personalized learning</p>
        </div>

        {/* AI Tools */}
        <div className="grid gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💬</span>
                <span>AI Tutor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get personalized help from an AI-powered tutor that adapts to your learning style.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Available</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📝</span>
                <span>Essay Feedback</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get instant feedback on your essays and writing assignments with AI-powered analysis.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Available</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span>
                <span>Practice Generator</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Generate customized practice problems based on your learning progress and weak areas.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Available</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🧠</span>
                <span>Study Assistant</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create study guides, flashcards, and summaries from your course materials automatically.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">Coming Soon</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
