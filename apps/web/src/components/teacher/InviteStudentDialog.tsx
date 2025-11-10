'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { enrollStudent } from '@/app/actions/teacher'

interface InviteStudentDialogProps {
  classId: string
}

export function InviteStudentDialog({ classId }: InviteStudentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await enrollStudent(classId, studentId)

      if (result.success) {
        toast.success('Student enrolled successfully!')
        setStudentId('')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to enroll student')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <span className="mr-2">+</span>
          Invite Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Student to Class</DialogTitle>
            <DialogDescription>
              Enter the student's user ID to add them to your class.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="student-id">Student User ID</Label>
              <Input
                id="student-id"
                placeholder="00000000-0000-0000-0000-000000000002"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                You can find the student's ID in the users table or share invitation links
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !studentId}>
              {loading ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
