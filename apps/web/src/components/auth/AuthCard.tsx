import Image from 'next/image'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 md:p-8">
      {/* Header with Logo */}
      <div className="text-center mb-10">
        <div
          className="mx-auto w-36 h-36 md:w-40 md:h-40 mb-5 relative"
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
                0 0 0 3px white,
                0 0 0 6px rgba(255, 140, 66, 1),
                0 0 0 9px white,
                0 0 0 12px rgba(255, 140, 66, 0.3),
                0 8px 24px rgba(255, 140, 66, 0.3)
              `
            }}
            priority
            unoptimized
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#333] mb-1.5">
          ATAL AI Tutorial
        </h1>
        <p className="text-sm md:text-base text-[#666]">Smart Learning Platform</p>
      </div>

      {/* Login Card with Gradient Border */}
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-light p-[3px] shadow-[0_12px_32px_rgba(255,140,66,0.2)] mb-6">
          <div className="bg-white rounded-[21px] p-8">
            <div className="mb-7">
              <h2 className="text-2xl md:text-3xl font-bold text-[#333] mb-1.5">{title}</h2>
              {description && (
                <p className="text-sm text-[#666]">{description}</p>
              )}
            </div>
            {children}
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
