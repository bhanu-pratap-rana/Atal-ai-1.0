import Image from 'next/image'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface via-background to-surface px-4 py-8 sm:px-6 md:px-8 md:py-12">
      {/* Header with Logo - Responsive sizing */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12 w-full">
        {/* Logo - 32px on mobile, 40px on tablet, 44px on desktop */}
        <div
          className="mx-auto w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 mb-4 sm:mb-5 relative"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <Image
            src="/assets/Logo animated.gif"
            alt="ATAL AI Logo"
            width={160}
            height={160}
            className="w-full h-full object-contain rounded-full"
            style={{
              boxShadow: `
                0 0 0 2px white,
                0 0 0 4px rgba(255, 140, 66, 1),
                0 0 0 6px white,
                0 0 0 8px rgba(255, 140, 66, 0.3),
                0 4px 16px rgba(255, 140, 66, 0.25)
              `
            }}
            priority
            unoptimized
          />
        </div>
        {/* Title - scales from 24px to 40px */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#333] mb-1.5">
          ATAL AI Tutorial
        </h1>
        {/* Subtitle - responsive text size */}
        <p className="text-xs sm:text-sm md:text-base text-[#666]">
          Smart Learning Platform
        </p>
      </div>

      {/* Login Card with Gradient Border - Responsive container */}
      <div className="w-full sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary-light p-[2px] sm:p-[3px] shadow-[0_8px_20px_rgba(255,126,51,0.15)] sm:shadow-[0_12px_32px_rgba(255,126,51,0.2)] mb-6">
          {/* Inner white card - responsive padding */}
          <div className="bg-white rounded-2xl sm:rounded-[21px] p-5 sm:p-6 md:p-8">
            {/* Card header - responsive spacing */}
            <div className="mb-5 sm:mb-6 md:mb-7">
              {/* Card title - responsive sizing */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#333] mb-1.5">
                {title}
              </h2>
              {/* Card description - responsive text size */}
              {description && (
                <p className="text-xs sm:text-sm text-[#666]">
                  {description}
                </p>
              )}
            </div>
            {/* Card content */}
            <div className="space-y-3 sm:space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
