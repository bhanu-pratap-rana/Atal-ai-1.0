'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * ATAL AI Assessment Summary - Jyoti Theme
 * 
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

interface AssessmentSummaryProps {
  score: number
  totalQuestions: number
  correctAnswers: number
  moduleBreakdown: Record<string, { total: number; correct: number }>
  avgResponseTime: number
}

export function AssessmentSummary({
  score,
  totalQuestions,
  correctAnswers,
  moduleBreakdown,
  avgResponseTime,
}: AssessmentSummaryProps) {
  const router = useRouter()

  const formatModuleName = (module: string) => {
    return module
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) {
      return {
        emoji: '🌟',
        title: 'Excellent Work!',
        message: 'You have a strong foundation in digital literacy. Great job!',
      }
    } else if (score >= 60) {
      return {
        emoji: '👍',
        title: 'Good Job!',
        message: 'You have a solid understanding. Keep building on this foundation!',
      }
    } else if (score >= 40) {
      return {
        emoji: '📚',
        title: 'Great Start!',
        message: 'You are on your way! The lessons will help strengthen your skills.',
      }
    } else {
      return {
        emoji: '🚀',
        title: 'Ready to Learn!',
        message: 'This is your starting point. Every expert was once a beginner!',
      }
    }
  }

  const scoreMessage = getScoreMessage(score)

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card with Gradient Border */}
        <div className="card-gradient mb-6">
          <div className="bg-white rounded-[17px] p-6 md:p-8 text-center">
            {/* Score Icon - Primary Gradient */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-[20px] mb-4">
              <span className="text-5xl">{scoreMessage.emoji}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
              {scoreMessage.title}
            </h1>
            <p className="text-lg text-text-secondary mb-6">{scoreMessage.message}</p>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-8 mb-4">
              <div>
                <div className="text-5xl md:text-6xl font-bold text-primary">
                  {score}%
                </div>
                <div className="text-sm text-text-tertiary mt-2">Overall Score</div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-semibold text-text-primary">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-sm text-text-tertiary">Correct Answers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Breakdown */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Performance by Module
          </h2>
          <div className="space-y-4">
            {Object.entries(moduleBreakdown).map(([module, stats]) => {
              const moduleScore = Math.round((stats.correct / stats.total) * 100)
              return (
                <div key={module}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">
                      {formatModuleName(module)}
                    </span>
                    <span className="text-sm font-semibold text-text-secondary">
                      {stats.correct}/{stats.total} ({moduleScore}%)
                    </span>
                  </div>
                  {/* Progress Bar - Primary Gradient */}
                  <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${moduleScore}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Additional Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Response Time - Primary Light */}
            <div className="bg-primary-light p-5 rounded-[16px] border border-primary/20">
              <div className="text-sm text-primary font-semibold mb-1">
                Average Response Time
              </div>
              <div className="text-3xl font-bold text-primary-dark">
                {Math.round(avgResponseTime / 1000)}s
              </div>
              <div className="text-xs text-primary/70 mt-1">
                Time spent per question
              </div>
            </div>

            {/* Modules - Success Light */}
            <div className="bg-success-light p-5 rounded-[16px] border border-success/20">
              <div className="text-sm text-success font-semibold mb-1">
                Modules Covered
              </div>
              <div className="text-3xl font-bold text-success-dark">
                {Object.keys(moduleBreakdown).length}
              </div>
              <div className="text-xs text-success/70 mt-1">
                Digital literacy areas assessed
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            What&apos;s Next?
          </h2>
          <p className="text-text-secondary mb-6">
            Based on your assessment, we&apos;ve identified learning modules that will help you
            grow your digital literacy skills. Start your learning journey now!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push('/app/modules')}
              size="lg"
              className="flex-1"
            >
              Start Learning
            </Button>
            <Button
              onClick={() => router.push('/app/dashboard')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
