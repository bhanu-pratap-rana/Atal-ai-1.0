'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Enrolled</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => {
            const enrolledDate = new Date(enrollment.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <TableRow key={enrollment.id}>
                <TableCell>
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-8 shrink-0 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {enrollment.student.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                        <span className="font-medium text-sm md:text-base">
                          {enrollment.student.email.split('@')[0]}
                        </span>
                        <span className="text-xs text-muted-foreground md:hidden">
                          {enrollment.student.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground lg:hidden ml-10 md:ml-0">
                      {enrolledDate}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {enrollment.student.email}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {enrolledDate}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(enrollment.student.id, enrollment.student.email)}
                    disabled={removingId === enrollment.student.id}
                    className="h-9 px-3" // Touch-friendly size
                  >
                    {removingId === enrollment.student.id ? 'Removing...' : 'Remove'}
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
