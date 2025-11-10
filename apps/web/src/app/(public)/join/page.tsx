'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthCard } from '@/components/auth/AuthCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinClass } from '@/app/actions/student'

export default function JoinClassPage() {
  const router = useRouter()
  const [classCode, setClassCode] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await joinClass({
        classCode: classCode.toUpperCase().trim(),
        rollNumber: rollNumber.trim(),
        pin: pin.trim(),
      })

      if (result.success) {
        toast.success('Successfully joined class! 🎉')
        // Redirect to student dashboard or class view
        router.push('/app/student/classes')
      } else {
        toast.error(result.error || 'Failed to join class')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Join Class"
      description="Enter the class code and PIN provided by your teacher"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="class-code">Class Code</Label>
          <Input
            id="class-code"
            type="text"
            placeholder="A3F7E2"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
            required
            disabled={loading}
            maxLength={6}
            className="uppercase font-mono text-center text-xl tracking-widest"
          />
          <p className="text-xs text-gray-500">
            6-character code provided by your teacher
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roll-number">Roll Number</Label>
          <Input
            id="roll-number"
            type="text"
            placeholder="e.g., 101, ST2024001"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500">
            Your student roll number or ID
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">Class PIN</Label>
          <Input
            id="pin"
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            required
            disabled={loading}
            maxLength={4}
            className="text-center text-2xl font-mono tracking-widest"
          />
          <p className="text-xs text-gray-500">
            4-digit PIN provided by your teacher
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
          <p className="text-xs text-blue-800">
            <strong>📌 Note:</strong> Your teacher will verify your enrollment.
            Make sure to use the correct roll number.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !classCode || !rollNumber || pin.length !== 4}
        >
          {loading ? 'Joining...' : 'Join Class'}
        </Button>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
          >
            Already have an account? Sign in
          </a>
        </div>
      </form>
    </AuthCard>
  )
}
