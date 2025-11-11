import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

async function getStudentClasses(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const response = await fetch(
    `${baseUrl}/rest/v1/enrollments?student_id=eq.${userId}&select=id,created_at,class:classes(id,name,class_code,teacher:users!classes_teacher_id_fkey(email))`,
    {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    return []
  }

  return response.json()
}

export default async function StudentClassesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const enrollments = await getStudentClasses(user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            My Classes
          </h1>
          <p className="text-gray-600 mt-2">
            Classes you're enrolled in
          </p>
        </div>

        {enrollments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No classes yet
              </h3>
              <p className="text-gray-500 mb-6">
                Ask your teacher for a class code to get started
              </p>
              <Link href="/join">
                <Button>Join a Class</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((enrollment: any) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📚</span>
                    <span>{enrollment.class.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Teacher: {enrollment.class.teacher.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Joined: {new Date(enrollment.created_at).toLocaleDateString()}
                    </p>
                    <Link href={`/app/assessment/start?classId=${enrollment.class.id}`}>
                      <Button className="w-full mt-4">
                        Start Assessment
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
