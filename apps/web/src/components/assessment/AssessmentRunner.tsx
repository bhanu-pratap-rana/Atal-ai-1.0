'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { submitAssessment } from '@/app/actions/assessment'
import { shuffleArray } from '@/data/assessment-questions'

/**
 * ATAL AI Assessment Runner - Jyoti Theme
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
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [focusBlurCount, setFocusBlurCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRapidWarning, setShowRapidWarning] = useState(false)

  // Refs for accessibility
  const questionRef = useRef<HTMLHeadingElement>(null)
  const optionsContainerRef = useRef<HTMLDivElement>(null)
  const prevIndexRef = useRef(currentIndex)

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  // Language-specific font classes
  const fontClass = language === 'hi' ? 'font-devanagari' : language === 'as' ? 'font-bengali' : ''

  // Memoized shuffle to prevent unnecessary recalculations
  const { shuffledOptions, shuffleMap } = useMemo(() => {
    if (!currentQuestion) return { shuffledOptions: [], shuffleMap: [] }

    const indices = currentQuestion.options.map((_, i) => i)
    const shuffledIndices = shuffleArray([...indices])
    const shuffledOpts = shuffledIndices.map((i) => currentQuestion.options[i])

    return { shuffledOptions: shuffledOpts, shuffleMap: shuffledIndices }
  }, [currentQuestion])

  // Reset state when question changes - only when index actually changes
  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex
      // Reset state for new question
      setSelectedOption(null)
      setStartTime(Date.now())
      setShowRapidWarning(false)

      // Focus management
      if (questionRef.current) {
        questionRef.current.focus()
      }
    }
  }, [currentIndex])

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
    setSelectedOption(optionIndex)
  }, [])

  const handleNext = useCallback(() => {
    if (selectedOption === null) {
      toast.error('Please select an answer')
      return
    }

    const rtMs = startTime ? Date.now() - startTime : 0
    const originalOptionIndex = shuffleMap[selectedOption]
    const isCorrect = originalOptionIndex === currentQuestion.correctAnswer

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

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const direction = e.key === 'ArrowDown' ? 1 : -1
        const newIndex = selectedOption === null
          ? 0
          : (selectedOption + direction + shuffledOptions.length) % shuffledOptions.length
        handleOptionSelect(newIndex)
      }

      if ((e.key === 'Enter' || e.key === ' ') && selectedOption !== null) {
        e.preventDefault()
        handleNext()
      }

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
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-tertiary">Loading assessment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6" role="status" aria-live="polite">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary" id="progress-text">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-text-primary">
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

        {/* Rapid Tap Warning - Warning Semantic Color */}
        {showRapidWarning && (
          <div
            className="mb-4 bg-warning-light border-l-4 border-warning p-4 rounded-[12px]"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-warning-dark">
              ⏱️ Take your time! Reading the question carefully helps you learn better.
            </p>
          </div>
        )}

        {/* Question Card with Gradient Border */}
        <div className="card-gradient">
          <div className="bg-white rounded-[17px] p-6 md:p-8">
            {/* Module Badge - Primary Light */}
            <div className="mb-6">
              <span
                className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary-light rounded-full mb-4"
                aria-label={`Module: ${currentQuestion.module.replace(/-/g, ' ')}`}
              >
                {currentQuestion.module.replace(/-/g, ' ').toUpperCase()}
              </span>
              <h2
                ref={questionRef}
                id="question-text"
                className={`text-xl md:text-2xl font-bold text-text-primary ${fontClass}`}
                tabIndex={-1}
              >
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options - MCQ Style */}
            <div
              ref={optionsContainerRef}
              role="radiogroup"
              aria-labelledby="question-text"
              className="space-y-3"
            >
              {shuffledOptions.map((option: string, index: number) => (
                <button
                  key={index}
                  role="radio"
                  aria-checked={selectedOption === index}
                  aria-label={`Option ${index + 1}: ${option}`}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full text-left p-4 rounded-[12px] border-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    selectedOption === index
                      ? 'border-primary bg-primary-light shadow-primary-sm'
                      : 'border-border bg-white hover:border-primary/30 hover:bg-primary-lighter'
                  }`}
                  disabled={isSubmitting}
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio Circle */}
                    <div
                      aria-hidden="true"
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedOption === index
                          ? 'border-primary bg-primary'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {selectedOption === index && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                    <span className={`text-base text-text-primary ${fontClass}`} id={`option-${index}`}>
                      {option}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleNext}
                disabled={selectedOption === null || isSubmitting}
                loading={isSubmitting}
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
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-4 space-y-2">
          <p className="text-sm text-text-secondary text-center">
            💡 Tip: Take your time to read each question carefully
          </p>
          <p className="text-xs text-text-tertiary text-center">
            ⌨️ Use arrow keys to navigate, Enter/Space to submit, or 1-4 for quick selection
          </p>
        </div>
      </div>
    </div>
  )
}
