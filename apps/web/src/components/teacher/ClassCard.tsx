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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
                <CardTitle className="text-primary">{classData.name}</CardTitle>
                {classData.subject && (
                  <p className="text-sm text-text-secondary mt-1">
                    📖 {classData.subject}
                  </p>
                )}
              </div>
            </div>
          </div>
          <CardDescription className="mt-2">Created {createdDate}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Class Code and PIN display - Both use primary colors for consistency */}
          {classData.class_code && classData.join_pin && (
            <div className="space-y-2">
              <div className="bg-primary-light border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-text-secondary">Class Code</p>
                <p className="font-mono font-bold text-primary text-lg">{classData.class_code}</p>
              </div>
              <div className="bg-primary-lighter border border-primary/10 rounded-lg p-3">
                <p className="text-xs text-text-secondary">Join PIN</p>
                <p className="font-mono font-bold text-primary-dark text-lg">{classData.join_pin}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Link href={`/app/teacher/classes/${classData.id}`} className="flex-1" aria-label={`View roster for class ${classData.name}`}>
              <Button className="w-full" variant="outline" size="sm">
                View Roster
              </Button>
            </Link>

            {/* Manage Class Dropdown Menu */}
            <div className="flex-1">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="w-full"
                disabled={isUpdating || isDeleting}
                aria-label={`Manage class ${classData.name}`}
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
            {/* Edit Section - Uses primary color */}
            <div className="space-y-3 p-4 bg-primary-light rounded-lg border border-primary/20">
              <p className="font-medium text-sm text-primary-dark">Edit Class Details</p>
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
                  aria-label={`Update class ${classData.name} with new details`}
                >
                  {isUpdating ? 'Updating...' : 'Update Class'}
                </Button>
              </div>
            </div>

            {/* Delete Section - Uses error/destructive color */}
            <div className="space-y-3 p-4 bg-error-light rounded-lg border border-error/20">
              <p className="font-medium text-sm text-error-dark">Delete Class</p>
              <p className="text-xs text-error">
                This action cannot be undone. All class data will be permanently deleted.
              </p>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isUpdating || isDeleting}
                variant="destructive"
                className="w-full text-sm"
                size="sm"
                aria-label={`Delete class ${classData.name}`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Class'}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{classData.name}&quot;? This action cannot be undone. All class data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setIsDeleting(true)
                try {
                  const result = await deleteClass(classData.id)
                  if (result.success) {
                    toast.success('Class deleted successfully!')
                    setShowDeleteConfirm(false)
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
              }}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
              aria-label={`Confirm deletion of class ${classData.name}`}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
