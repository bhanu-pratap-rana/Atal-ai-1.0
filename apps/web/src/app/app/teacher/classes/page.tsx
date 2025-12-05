import { redirect } from 'next/navigation'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'
import { CreateClassDialog } from '@/components/teacher/CreateClassDialog'
import { ClassCard } from '@/components/teacher/ClassCard'
import { SignOutButton } from '@/components/teacher/SignOutButton'

interface Class {
  id: string
  name: string
  class_code: string
  teacher_id: string
  created_at: string
  [key: string]: unknown
}

interface TeacherData {
  teacherName: string
  classes: Class[]
}

async function getTeacherData(userId: string): Promise<TeacherData> {
  try {
    const supabase = await createClient()

    // Fetch teacher profile
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('name, subject')
      .eq('user_id', userId)
      .single()

    // Fetch classes
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })

    if (error && Object.keys(error).length > 0) {
      authLogger.error('[getTeacherData] Failed to fetch classes', error)
    }

    return {
      teacherName: teacherProfile?.name || 'Teacher',
      classes: classes || [],
    }
  } catch (error) {
    authLogger.error('[getTeacherData] Unexpected error', error)
    return {
      teacherName: 'Teacher',
      classes: [],
    }
  }
}

export default async function TeacherClassesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { teacherName, classes } = await getTeacherData(user.id)

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
          <div className="flex items-center gap-4">
            <CreateClassDialog />
            <SignOutButton />
          </div>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem: Class) => (
              <ClassCard key={classItem.id} classData={classItem} teacherName={teacherName} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
