/**
 * ATAL AI Assessment Skeleton - Jyoti Theme
 * 
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

export function AssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar Skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-border rounded w-32"></div>
            <div className="h-4 bg-border rounded w-12"></div>
          </div>
          <div className="h-2 bg-border rounded-full"></div>
        </div>

        {/* Question Card Skeleton with Gradient Border */}
        <div className="card-gradient">
          <div className="bg-white rounded-[17px] p-6 md:p-8 animate-pulse">
            {/* Module Badge */}
            <div className="mb-6">
              <div className="h-6 bg-primary-light rounded-full w-32 mb-4"></div>
              {/* Question Text */}
              <div className="space-y-3">
                <div className="h-8 bg-border rounded w-full"></div>
                <div className="h-8 bg-border rounded w-5/6"></div>
              </div>
            </div>

            {/* Options Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-[12px] border-2 border-border bg-stone-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-stone-300 bg-white"></div>
                    <div className="h-6 bg-border rounded flex-1"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Button Skeleton */}
            <div className="mt-6 flex justify-end">
              <div className="h-11 bg-border rounded-[12px] w-32"></div>
            </div>
          </div>
        </div>

        {/* Helper Text Skeleton */}
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-border rounded w-64 mx-auto"></div>
          <div className="h-3 bg-border rounded w-96 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
