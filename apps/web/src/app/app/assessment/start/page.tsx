'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AssessmentRunner } from '@/components/assessment/AssessmentRunner'
import { startAssessment } from '@/app/actions/assessment'
import { getQuestionsByLanguage } from '@/data/assessment-questions'

function AssessmentStartContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const classId = searchParams.get('classId')

  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'as'>('en')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-6 md:p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pre-Assessment
          </h1>
          <p className="text-gray-600">
            This assessment helps us understand your current digital literacy skills
          </p>
        </div>

        {/* Assessment Info */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">What to expect:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
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
          <Label className="text-base font-semibold mb-4 block">
            Choose your preferred language:
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLanguage === 'en'
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-orange-200'
              }`}
            >
              <div className="text-center">
                <span className="text-3xl mb-2 block">🇬🇧</span>
                <span className="font-semibold text-gray-900">English</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedLanguage('hi')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLanguage === 'hi'
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-orange-200'
              }`}
            >
              <div className="text-center">
                <span className="text-3xl mb-2 block">🇮🇳</span>
                <span className="font-semibold text-gray-900">हिंदी</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedLanguage('as')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLanguage === 'as'
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-orange-200'
              }`}
            >
              <div className="text-center">
                <span className="text-3xl mb-2 block">🇮🇳</span>
                <span className="font-semibold text-gray-900">অসমীয়া</span>
              </div>
            </button>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleStartAssessment}
            disabled={loading}
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
      </Card>
    </div>
  )
}

export default function AssessmentStartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    }>
      <AssessmentStartContent />
    </Suspense>
  )
}
