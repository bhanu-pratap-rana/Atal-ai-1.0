import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { CreateClassDialog } from '@/components/teacher/CreateClassDialog'
import { ClassCard } from '@/components/teacher/ClassCard'

async function getTeacherClasses(userId: string) {
  // This will be fetched via Supabase MCP in production
  // For now, we'll create a server action to fetch classes
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/classes?teacher_id=eq.${userId}&select=*`, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return []
  }

  return response.json()
}

export default async function TeacherClassesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const classes = await getTeacherClasses(user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
              My Classes
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your classes and students
            </p>
          </div>
          <CreateClassDialog />
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">📚</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No classes yet
            </h2>
            <p className="text-gray-500 mb-6">
              Create your first class to get started
            </p>
            <CreateClassDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem: any) => (
              <ClassCard key={classItem.id} classData={classItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
