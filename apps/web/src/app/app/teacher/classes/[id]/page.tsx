import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { authLogger } from '@/lib/auth-logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InviteStudentDialog } from '@/components/teacher/InviteStudentDialog'
import { RosterTable } from '@/components/teacher/RosterTable'
import { InvitePanel } from '@/components/teacher/InvitePanel'
import { AnalyticsTiles } from '@/components/teacher/AnalyticsTiles'
import { getClassAnalytics } from '@/app/actions/teacher'

interface User {
  id: string
  email: string
  role: string
}

interface EnrollmentRow {
  id: string
  created_at: string
  student_id: string
}

interface Enrollment extends EnrollmentRow {
  student: User
}

interface ClassWithRoster {
  class: {
    id: string
    name: string
    class_code: string
    teacher_id: string
    created_at: string
    join_pin?: string
    [key: string]: unknown
  }
  enrollments: Enrollment[]
}

async function getClassWithRoster(classId: string, userId: string): Promise<ClassWithRoster | null> {
  try {
    const supabase = await createClient()

    // Fetch class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .eq('teacher_id', userId)
      .single()

    if (classError || !classData) {
      authLogger.error('[getClassWithRoster] Error fetching class', classError)
      return null
    }

    // Fetch enrollments
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, created_at, student_id')
      .eq('class_id', classId)

    if (enrollmentsError) {
      authLogger.error('[getClassWithRoster] Error fetching enrollments', enrollmentsError)
    }

    // Fetch student details for each enrollment
    let enrollmentsWithStudents: Enrollment[] = []
    if (enrollmentsData && enrollmentsData.length > 0) {
      const studentIds = enrollmentsData.map((e: EnrollmentRow) => e.student_id)
      const { data: students } = await supabase
        .from('users')
        .select('id, email, role')
        .in('id', studentIds)

      if (students) {
        const studentMap = new Map(students.map((s: User) => [s.id, s]))
        enrollmentsWithStudents = enrollmentsData.map((enrollment) => ({
          ...enrollment,
          student: studentMap.get(enrollment.student_id) as User,
        }))
      }
    }

    return {
      class: classData,
      enrollments: enrollmentsWithStudents,
    }
  } catch (error) {
    authLogger.error('[getClassWithRoster] Unexpected error', error)
    return null
  }
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const data = await getClassWithRoster(id, user.id)

  if (!data) {
    redirect('/app/teacher/classes')
  }

  const { class: classData, enrollments } = data

  // Fetch analytics
  const analyticsResult = await getClassAnalytics(id)
  const analytics = analyticsResult.success ? analyticsResult.data : {
    activeThisWeek: 0,
    avgMinutesPerDay: 0,
    atRiskCount: 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/app/teacher/classes">
            <Button variant="ghost" className="mb-4">
              ← Back to Classes
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-3xl">
                    <span>📚</span>
                    <span className="bg-gradient-to-r from-pink-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                      {classData.name}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {enrollments.length} {enrollments.length === 1 ? 'student' : 'students'} enrolled
                  </CardDescription>
                </div>
                <InviteStudentDialog classId={id} />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Analytics Tiles */}
        {enrollments.length > 0 && (
          <div className="mb-8">
            <AnalyticsTiles
              activeThisWeek={analytics?.activeThisWeek || 0}
              avgMinutesPerDay={analytics?.avgMinutesPerDay || 0}
              atRiskCount={analytics?.atRiskCount || 0}
            />
          </div>
        )}

        {/* Invite Panel with QR Code */}
        <div className="mb-8">
          <InvitePanel
            classCode={classData.class_code}
            joinPin={classData.join_pin || ''}
            className={classData.name}
          />
        </div>

        {/* Roster */}
        <Card>
          <CardHeader>
            <CardTitle>Class Roster</CardTitle>
            <CardDescription>
              View and manage students enrolled in this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No students enrolled yet
                </h3>
                <p className="text-gray-500">
                  Use the Invite Student button above or share the class details from the invitation section
                </p>
              </div>
            ) : (
              <RosterTable enrollments={enrollments} classId={id} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
