'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AssessmentRunner } from '@/components/assessment/AssessmentRunner'
import { AssessmentSkeleton } from '@/components/assessment/AssessmentSkeleton'
import { startAssessment } from '@/app/actions/assessment'
import { getQuestionsByLanguage } from '@/data/assessment-questions'

/**
 * ATAL AI Assessment Start Page - Jyoti Theme
 * 
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

interface Question {
  id: string
  module: string
  question: string
  options: string[]
  correctAnswer: number
}

function AssessmentStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const classId = searchParams.get('classId')

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'as'>('en')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])

  const handleStartAssessment = async () => {
    setLoading(true)

    try {
      const result = await startAssessment(classId || undefined)

      if (result.success && result.sessionId) {
        setSessionId(result.sessionId)
        const questionData = getQuestionsByLanguage(selectedLanguage)
        setQuestions(questionData)
      } else {
        toast.error(result.error || 'Failed to start assessment')
        setLoading(false)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setLoading(false)
    }
  }

  // If session started, show assessment runner
  if (sessionId && questions.length > 0) {
    return (
      <AssessmentRunner
        sessionId={sessionId}
        questions={questions}
        language={selectedLanguage}
      />
    )
  }

  // Show language selection screen
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      {/* Card with Gradient Border */}
      <div className="max-w-2xl w-full">
        <div className="card-gradient">
          <div className="bg-white rounded-[17px] p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Icon Box - Primary Light */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-light rounded-[16px] mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Pre-Assessment
              </h1>
              <p className="text-text-secondary">
                This assessment helps us understand your current digital literacy skills
              </p>
            </div>

            {/* Assessment Info - Info Alert */}
            <div className="bg-info-light border-l-4 border-info p-4 rounded-[12px] mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-info-dark mb-2">What to expect:</h3>
                  <ul className="text-sm text-info-dark/80 space-y-1">
                    <li>• 30 questions covering 5 key digital literacy modules</li>
                    <li>• No time limit - take your time to read carefully</li>
                    <li>• Your answers help us personalize your learning journey</li>
                    <li>• There are no wrong answers - this is about understanding where you are</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="mb-8">
              <Label className="text-base font-semibold mb-4 block text-text-primary">
                Choose your preferred language:
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* English */}
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`p-4 rounded-[12px] border-2 transition-all duration-200 ${
                    selectedLanguage === 'en'
                      ? 'border-primary bg-primary-light shadow-primary-sm'
                      : 'border-border bg-white hover:border-primary/30 hover:bg-primary-lighter'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🇬🇧</span>
                    <span className="font-semibold text-text-primary">English</span>
                  </div>
                </button>

                {/* Hindi */}
                <button
                  onClick={() => setSelectedLanguage('hi')}
                  className={`p-4 rounded-[12px] border-2 transition-all duration-200 ${
                    selectedLanguage === 'hi'
                      ? 'border-primary bg-primary-light shadow-primary-sm'
                      : 'border-border bg-white hover:border-primary/30 hover:bg-primary-lighter'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🇮🇳</span>
                    <span className="font-semibold text-text-primary">हिंदी</span>
                  </div>
                </button>

                {/* Assamese */}
                <button
                  onClick={() => setSelectedLanguage('as')}
                  className={`p-4 rounded-[12px] border-2 transition-all duration-200 ${
                    selectedLanguage === 'as'
                      ? 'border-primary bg-primary-light shadow-primary-sm'
                      : 'border-border bg-white hover:border-primary/30 hover:bg-primary-lighter'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">🇮🇳</span>
                    <span className="font-semibold text-text-primary">অসমীয়া</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleStartAssessment}
                disabled={loading}
                loading={loading}
                size="lg"
                className="w-full text-lg py-6"
              >
                {loading ? 'Starting Assessment...' : 'Start Assessment'}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssessmentStartPage() {
  return (
    <Suspense fallback={<AssessmentSkeleton />}>
      <AssessmentStartContent />
    </Suspense>
  )
}
