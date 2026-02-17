import Image from "next/image";

interface AuthCardProps {
  readonly children: React.ReactNode;
  readonly title: string;
  readonly description?: string;
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4 py-8 sm:px-6 md:px-8 md:py-12">
      {/* Header with Logo - Responsive sizing */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12 w-full">
        {/* Logo - ATAL AI branding */}
        <div
          className="mx-auto w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 mb-4 sm:mb-5 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light animate-[float_3s_ease-in-out_infinite] shadow-[0_0_0_2px_white,0_0_0_4px_var(--color-primary),0_0_0_6px_white,0_0_0_8px_var(--color-primary-light),var(--shadow-primary-sm)] overflow-hidden"
        >
          <Image
            src="/assets/logo.png"
            alt="ATAL AI Logo"
            width={144}
            height={144}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        {/* Title - scales from 24px to 40px */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-1.5">
          ATAL AI Tutorial
        </h1>
        {/* Subtitle - responsive text size */}
        <p className="text-xs sm:text-sm md:text-base text-text-secondary">
          Smart Learning Platform
        </p>
      </div>

      {/* Login Card with Gradient Border - Responsive container */}
      <div className="w-full sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary-light p-[2px] sm:p-[3px] shadow-[var(--shadow-primary-sm)] sm:shadow-[var(--shadow-primary)] mb-6">
          {/* Inner white card - responsive padding */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8">
            {/* Card header - responsive spacing */}
            <div className="mb-5 sm:mb-6 md:mb-7">
              {/* Card title - responsive sizing */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-1.5">
                {title}
              </h2>
              {/* Card description - responsive text size */}
              {description && (
                <p className="text-xs sm:text-sm text-text-secondary">
                  {description}
                </p>
              )}
            </div>
            {/* Card content */}
            <div className="space-y-3 sm:space-y-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
