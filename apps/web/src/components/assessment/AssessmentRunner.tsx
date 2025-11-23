'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { submitAssessment } from '@/app/actions/assessment'
import { shuffleArray } from '@/data/assessment-questions'

interface Question {
  id: string
  module: string
  question: string
  options: string[]
  correctAnswer: number
}

interface AssessmentRunnerProps {
  sessionId: string
  questions: Question[]
  language: 'en' | 'hi' | 'as'
}

interface ResponseData {
  itemId: string
  module: string
  isCorrect: boolean
  rtMs: number
  focusBlurCount: number
  chosenOption: string
}

export function AssessmentRunner({
  sessionId,
  questions,
  language,
}: AssessmentRunnerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<ResponseData[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([])
  const [shuffleMap, setShuffleMap] = useState<number[]>([])
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [focusBlurCount, setFocusBlurCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRapidWarning, setShowRapidWarning] = useState(false)
  const [firstSelectionTime, setFirstSelectionTime] = useState<number | null>(null)

  // Refs for accessibility
  const questionRef = useRef<HTMLHeadingElement>(null)
  const optionsContainerRef = useRef<HTMLDivElement>(null)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  // Language-specific font classes
  const fontClass = language === 'hi' ? 'font-devanagari' : language === 'as' ? 'font-bengali' : ''

  // Memoized shuffle to prevent unnecessary recalculations
  const { shuffled, shuffleMapping } = useMemo(() => {
    if (!currentQuestion) return { shuffled: [], shuffleMapping: [] }

    const indices = currentQuestion.options.map((_, i) => i)
    const shuffledIndices = shuffleArray([...indices])
    const shuffled = shuffledIndices.map((i) => currentQuestion.options[i])

    return { shuffled, shuffleMapping: shuffledIndices }
  }, [currentQuestion])

  // Update shuffled options when question changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setShuffledOptions(shuffled)
    setShuffleMap(shuffleMapping)
    setSelectedOption(null)
    setStartTime(Date.now())
    setShowRapidWarning(false)
    setFirstSelectionTime(null)

    // Focus on question for screen readers
    if (questionRef.current) {
      questionRef.current.focus()
    }
  }, [currentIndex, shuffled, shuffleMapping])

  // Submit assessment data
  const submitAssessmentData = useCallback(async (finalResponses: ResponseData[]) => {
    setIsSubmitting(true)

    try {
      const result = await submitAssessment(sessionId, finalResponses)

      if (result.success) {
        toast.success('Assessment completed!')
        router.push(`/app/assessment/summary?session=${sessionId}`)
      } else {
        toast.error(result.error || 'Failed to submit assessment')
        setIsSubmitting(false)
      }
    } catch {
      toast.error('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }, [sessionId, router])

  // Handle option selection
  const handleOptionSelect = useCallback((optionIndex: number) => {
    // Track first selection time
    if (firstSelectionTime === null) {
      setFirstSelectionTime(Date.now() - startTime)
    }

    setSelectedOption(optionIndex)
  }, [firstSelectionTime, startTime])

  const handleNext = useCallback(() => {
    if (selectedOption === null) {
      toast.error('Please select an answer')
      return
    }

    const rtMs = Date.now() - startTime
    const originalOptionIndex = shuffleMap[selectedOption]
    const isCorrect = originalOptionIndex === currentQuestion.correctAnswer

    // Show rapid tap warning if response time < 5 seconds
    if (rtMs < 5000) {
      setShowRapidWarning(true)
      setTimeout(() => setShowRapidWarning(false), 3000)
    }

    const response: ResponseData = {
      itemId: currentQuestion.id,
      module: currentQuestion.module,
      isCorrect,
      rtMs,
      focusBlurCount,
      chosenOption: shuffledOptions[selectedOption],
    }

    setResponses([...responses, response])
    setFocusBlurCount(0)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Last question - submit
      submitAssessmentData([...responses, response])
    }
  }, [selectedOption, shuffleMap, currentQuestion, startTime, focusBlurCount, setShowRapidWarning, setResponses, setFocusBlurCount, setCurrentIndex, currentIndex, questions.length, responses, submitAssessmentData, shuffledOptions])

  // Track focus/blur events
  useEffect(() => {
    const handleBlur = () => {
      setFocusBlurCount((prev) => prev + 1)
    }

    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return

      // Arrow key navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const direction = e.key === 'ArrowDown' ? 1 : -1
        const newIndex = selectedOption === null
          ? 0
          : (selectedOption + direction + shuffledOptions.length) % shuffledOptions.length
        handleOptionSelect(newIndex)
      }

      // Enter or Space to confirm
      if ((e.key === 'Enter' || e.key === ' ') && selectedOption !== null) {
        e.preventDefault()
        handleNext()
      }

      // Number keys 1-4 for quick selection
      const num = parseInt(e.key)
      if (num >= 1 && num <= shuffledOptions.length) {
        e.preventDefault()
        handleOptionSelect(num - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedOption, shuffledOptions.length, isSubmitting, handleOptionSelect, handleNext])

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading assessment...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6" role="status" aria-live="polite">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700" id="progress-text">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress
            value={progress}
            className="h-2"
            aria-labelledby="progress-text"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Rapid Tap Warning */}
        {showRapidWarning && (
          <div
            className="mb-4 bg-amber-100 border-l-4 border-amber-500 p-4 rounded"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-amber-800">
              ⏱️ Take your time! Reading the question carefully helps you learn better.
            </p>
          </div>
        )}

        {/* Question Card */}
        <Card className="p-6 md:p-8 shadow-lg">
          <div className="mb-6">
            <span
              className="inline-block px-3 py-1 text-xs font-semibold text-orange-600 bg-orange-100 rounded-full mb-4"
              aria-label={`Module: ${currentQuestion.module.replace(/-/g, ' ')}`}
            >
              {currentQuestion.module.replace(/-/g, ' ').toUpperCase()}
            </span>
            <h2
              ref={questionRef}
              id="question-text"
              className={`text-xl md:text-2xl font-bold text-gray-900 ${fontClass}`}
              tabIndex={-1}
            >
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div
            ref={optionsContainerRef}
            role="radiogroup"
            aria-labelledby="question-text"
            className="space-y-3"
          >
            {shuffledOptions.map((option, index) => (
              <button
                key={index}
                role="radio"
                aria-checked={selectedOption === index}
                aria-label={`Option ${index + 1}: ${option}`}
                onClick={() => handleOptionSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                  selectedOption === index
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50'
                }`}
                disabled={isSubmitting}
                tabIndex={0}
              >
                <div className="flex items-start gap-3">
                  <div
                    aria-hidden="true"
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === index
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selectedOption === index && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>
                  <span className={`text-base text-gray-700 ${fontClass}`} id={`option-${index}`}>
                    {option}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Next Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleNext}
              disabled={selectedOption === null || isSubmitting}
              size="lg"
              className="min-w-[120px]"
            >
              {isSubmitting
                ? 'Submitting...'
                : currentIndex < questions.length - 1
                ? 'Next'
                : 'Submit'}
            </Button>
          </div>
        </Card>

        {/* Helper Text */}
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-600 text-center">
            💡 Tip: Take your time to read each question carefully
          </p>
          <p className="text-xs text-gray-500 text-center">
            ⌨️ Use arrow keys to navigate, Enter/Space to submit, or 1-4 for quick selection
          </p>
        </div>
      </div>
    </div>
  )
}
