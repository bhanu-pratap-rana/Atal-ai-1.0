'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { removeStudent } from '@/app/actions/teacher'

interface Enrollment {
  id: string
  created_at: string
  student: {
    id: string
    email: string
    role: string
  }
}

interface RosterTableProps {
  enrollments: Enrollment[]
  classId: string
}

export function RosterTable({ enrollments, classId }: RosterTableProps) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(studentId: string, studentEmail: string) {
    if (!confirm(`Remove ${studentEmail} from this class?`)) {
      return
    }

    setRemovingId(studentId)

    try {
      const result = await removeStudent(classId, studentId)

      if (result.success) {
        toast.success('Student removed successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to remove student')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Student
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Email
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Enrolled
            </th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment) => {
            const enrolledDate = new Date(enrollment.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <tr
                key={enrollment.id}
                className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {enrollment.student.email[0].toUpperCase()}
                    </div>
                    <span className="font-medium">
                      {enrollment.student.email.split('@')[0]}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {enrollment.student.email}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {enrolledDate}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(enrollment.student.id, enrollment.student.email)}
                    disabled={removingId === enrollment.student.id}
                  >
                    {removingId === enrollment.student.id ? 'Removing...' : 'Remove'}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
