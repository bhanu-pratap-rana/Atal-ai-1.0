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
import { createClass } from '@/app/actions/teacher'

export function CreateClassDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdClass, setCreatedClass] = useState<{
    classCode: string
    joinPin: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createClass(name, subject)

      if (result.success && result.data) {
        setCreatedClass({
          classCode: result.data.class_code,
          joinPin: result.data.join_pin,
        })
        toast.success('Class created successfully!')
        // Don't close dialog yet - show codes first
      } else {
        toast.error(result.error || 'Failed to create class')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setName('')
    setSubject('')
    setCreatedClass(null)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <span className="mr-2">+</span>
          Create Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        {!createdClass ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to manage students and assignments.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input
                  id="class-name"
                  placeholder="e.g., Class 10-A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics, English, Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                />
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
              <Button type="submit" disabled={loading || !name}>
                {loading ? 'Creating...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div>
            <DialogHeader>
              <DialogTitle>Class Created! 🎉</DialogTitle>
              <DialogDescription>
                Share these codes with your students to join the class
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 md:py-6 space-y-4 md:space-y-6">
              {/* Class Code */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Class Code</Label>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-3 md:p-4">
                  <p className="text-2xl md:text-3xl font-mono font-bold text-center text-orange-600 tracking-widest break-all">
                    {createdClass.classCode}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Students will enter this 6-character code
                </p>
              </div>

              {/* Join PIN */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Join PIN</Label>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-3 md:p-4">
                  <p className="text-2xl md:text-3xl font-mono font-bold text-center text-blue-600 tracking-widest">
                    {createdClass.joinPin}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  4-digit PIN for class security
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                <p className="text-sm text-amber-800">
                  <strong>📋 Keep these codes safe!</strong> Students need both the class code and PIN to join.
                  You can view these codes anytime in the class details.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
