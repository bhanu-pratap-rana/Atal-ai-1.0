import { Card } from '@/components/ui/card'

export function AssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar Skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full"></div>
        </div>

        {/* Question Card Skeleton */}
        <Card className="p-6 md:p-8 shadow-lg animate-pulse">
          {/* Module Badge */}
          <div className="mb-6">
            <div className="h-6 bg-orange-100 rounded-full w-32 mb-4"></div>
            {/* Question Text */}
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-full"></div>
              <div className="h-8 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>

          {/* Options Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 bg-white"></div>
                  <div className="h-6 bg-gray-200 rounded flex-1"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Button Skeleton */}
          <div className="mt-6 flex justify-end">
            <div className="h-11 bg-gray-200 rounded-md w-32"></div>
          </div>
        </Card>

        {/* Helper Text Skeleton */}
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-96 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
