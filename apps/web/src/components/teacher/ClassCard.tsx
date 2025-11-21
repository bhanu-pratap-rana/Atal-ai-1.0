'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteClass, updateClass } from '@/app/actions/teacher'

interface ClassCardProps {
  classData: {
    id: string
    name: string
    subject?: string
    created_at: string
    class_code?: string
    join_pin?: string
  }
  teacherName?: string
}

export function ClassCard({ classData, teacherName: _teacherName }: ClassCardProps) {
  const router = useRouter()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState(classData.name)
  const [editSubject, setEditSubject] = useState(classData.subject || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const createdDate = new Date(classData.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <span className="text-2xl">📚</span>
              <div className="flex-1">
                <CardTitle className="text-orange-600">{classData.name}</CardTitle>
                {classData.subject && (
                  <p className="text-sm text-gray-600 mt-1">
                    📖 {classData.subject}
                  </p>
                )}
              </div>
            </div>
          </div>
          <CardDescription className="mt-2">Created {createdDate}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Class Code and PIN display */}
          {classData.class_code && classData.join_pin && (
            <div className="space-y-2">
              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                <p className="text-xs text-gray-600">Class Code</p>
                <p className="font-mono font-bold text-orange-600 text-lg">{classData.class_code}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-xs text-gray-600">Join PIN</p>
                <p className="font-mono font-bold text-blue-600 text-lg">{classData.join_pin}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Link href={`/app/teacher/classes/${classData.id}`} className="flex-1">
              <Button className="w-full" variant="outline" size="sm">
                View Roster
              </Button>
            </Link>

            {/* Manage Class Dropdown Menu */}
            <div className="flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="w-full"
                disabled={isUpdating || isDeleting}
              >
                Manage Class
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Class Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage Class</DialogTitle>
            <DialogDescription>
              Edit class details or delete the class
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Edit Section */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-sm text-blue-900">Edit Class Details</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-class-name" className="text-xs">Class Name</Label>
                  <Input
                    id="edit-class-name"
                    placeholder="e.g., Class 10-A"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    disabled={isUpdating || isDeleting}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-subject" className="text-xs">Subject (Optional)</Label>
                  <Input
                    id="edit-subject"
                    placeholder="e.g., Mathematics, English, Science"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    disabled={isUpdating || isDeleting}
                    className="text-sm"
                  />
                </div>

                <Button
                  onClick={async () => {
                    setIsUpdating(true)
                    try {
                      const result = await updateClass(classData.id, editName, editSubject)
                      if (result.success) {
                        toast.success('Class updated successfully!')
                        setShowEditDialog(false)
                        router.refresh()
                      } else {
                        toast.error(result.error || 'Failed to update class')
                      }
                    } catch {
                      toast.error('An unexpected error occurred')
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                  disabled={isUpdating || isDeleting || !editName}
                  className="w-full text-sm"
                  size="sm"
                >
                  {isUpdating ? 'Updating...' : '✏️ Update Class'}
                </Button>
              </div>
            </div>

            {/* Delete Section */}
            <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium text-sm text-red-900">Delete Class</p>
              <p className="text-xs text-red-800">
                This action cannot be undone. All class data will be permanently deleted.
              </p>
              <Button
                onClick={async () => {
                  const confirmDelete = window.confirm(
                    `Are you sure you want to delete "${classData.name}"? This cannot be undone.`
                  )
                  if (confirmDelete) {
                    setIsDeleting(true)
                    try {
                      const result = await deleteClass(classData.id)
                      if (result.success) {
                        toast.success('Class deleted successfully!')
                        setShowEditDialog(false)
                        router.refresh()
                      } else {
                        toast.error(result.error || 'Failed to delete class')
                      }
                    } catch {
                      toast.error('An unexpected error occurred')
                    } finally {
                      setIsDeleting(false)
                    }
                  }
                }}
                disabled={isUpdating || isDeleting}
                variant="destructive"
                className="w-full text-sm"
                size="sm"
              >
                {isDeleting ? '⏳ Deleting...' : '🗑️ Delete Class'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating || isDeleting}
              size="sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
