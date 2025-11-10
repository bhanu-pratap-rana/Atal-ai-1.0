'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <Card className="p-6 md:p-8 mb-6 text-center shadow-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full mb-4">
            <span className="text-5xl">{scoreMessage.emoji}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {scoreMessage.title}
          </h1>
          <p className="text-lg text-gray-600 mb-6">{scoreMessage.message}</p>

          {/* Score Display */}
          <div className="flex items-center justify-center gap-8 mb-4">
            <div>
              <div className="text-5xl md:text-6xl font-bold text-orange-600">
                {score}%
              </div>
              <div className="text-sm text-gray-600 mt-2">Overall Score</div>
            </div>
            <div className="text-left">
              <div className="text-2xl font-semibold text-gray-700">
                {correctAnswers}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
          </div>
        </Card>

        {/* Module Breakdown */}
        <Card className="p-6 md:p-8 mb-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Performance by Module
          </h2>
          <div className="space-y-4">
            {Object.entries(moduleBreakdown).map(([module, stats]) => {
              const moduleScore = Math.round((stats.correct / stats.total) * 100)
              return (
                <div key={module}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">
                      {formatModuleName(module)}
                    </span>
                    <span className="text-sm font-semibold text-gray-600">
                      {stats.correct}/{stats.total} ({moduleScore}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-yellow-400 h-full transition-all"
                      style={{ width: `${moduleScore}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Additional Stats */}
        <Card className="p-6 md:p-8 mb-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Additional Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-blue-600 font-semibold mb-1">
                Average Response Time
              </div>
              <div className="text-3xl font-bold text-blue-700">
                {Math.round(avgResponseTime / 1000)}s
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Time spent per question
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
              <div className="text-sm text-green-600 font-semibold mb-1">
                Modules Covered
              </div>
              <div className="text-3xl font-bold text-green-700">
                {Object.keys(moduleBreakdown).length}
              </div>
              <div className="text-xs text-green-600 mt-1">
                Digital literacy areas assessed
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6 md:p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            What's Next?
          </h2>
          <p className="text-gray-600 mb-6">
            Based on your assessment, we've identified learning modules that will help you
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
        </Card>
      </div>
    </div>
  )
}
