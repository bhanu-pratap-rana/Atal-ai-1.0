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
import { createClient } from '@/lib/supabase-server'

interface InviteStudentDialogProps {
  classId: string
}

interface StudentResult {
  id: string
  email: string
}

export function InviteStudentDialog({ classId }: InviteStudentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [studentId, setStudentId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null)
  const [searchResults, setSearchResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  async function handleSearch() {
    if (!searchInput.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      // Search for students by email or ID (using API route)
      const response = await fetch('/api/teacher/search-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchInput }),
      })

      if (response.ok) {
        const { students } = await response.json()
        setSearchResults(students)
      } else {
        toast.error('Failed to search students')
      }
    } catch (error) {
      toast.error('An error occurred while searching')
    } finally {
      setSearching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!studentId) {
      toast.error('Please select a student')
      return
    }

    setLoading(true)

    try {
      const result = await enrollStudent(classId, studentId)

      if (result.success) {
        toast.success('Student enrolled successfully!')
        setStudentId('')
        setSearchInput('')
        setSelectedStudent(null)
        setSearchResults([])
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
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Student to Class</DialogTitle>
            <DialogDescription>
              Search and add students to your class by email or ID
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search-student">Search by Email or User ID</Label>
              <div className="flex gap-2">
                <Input
                  id="search-student"
                  placeholder="student@example.com or user ID"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    if (e.target.value.trim()) {
                      handleSearch()
                    } else {
                      setSearchResults([])
                    }
                  }}
                  disabled={loading || searching}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={loading || searching || !searchInput.trim()}
                  className="px-4"
                >
                  {searching ? '...' : 'Search'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Enter student email or user ID to find them
              </p>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Student</Label>
                <div className="border rounded-lg space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setStudentId(student.id)
                        setSelectedStudent(student)
                        setSearchResults([])
                        setSearchInput('')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-orange-50 border-b last:border-b-0 transition-colors"
                    >
                      <p className="font-medium text-sm">{student.email}</p>
                      <p className="text-xs text-gray-500">{student.id}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Student Info */}
            {selectedStudent && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Selected Student:</p>
                <p className="text-sm text-blue-800">{selectedStudent.email}</p>
                <p className="text-xs text-blue-600 mt-1">{selectedStudent.id}</p>
              </div>
            )}

            {/* Manual ID Entry */}
            {!selectedStudent && (
              <div className="space-y-2">
                <Label htmlFor="manual-id" className="text-xs">Or enter Student ID manually</Label>
                <Input
                  id="manual-id"
                  placeholder="00000000-0000-0000-0000-000000000002"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={loading || searching}
                  className="text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setSearchInput('')
                setStudentId('')
                setSelectedStudent(null)
                setSearchResults([])
              }}
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
