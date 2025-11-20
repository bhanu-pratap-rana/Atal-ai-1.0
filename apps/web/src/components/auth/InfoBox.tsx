import { ReactNode } from 'react'

type InfoBoxVariant = 'info' | 'warning' | 'success' | 'error'

const variantStyles: Record<InfoBoxVariant, string> = {
  info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-900',
  warning: 'bg-orange-50 border-l-4 border-orange-500 text-orange-900',
  success: 'bg-green-50 border-l-4 border-green-500 text-green-900',
  error: 'bg-red-50 border-l-4 border-red-500 text-red-900',
}

interface InfoBoxProps {
  children: ReactNode
  variant?: InfoBoxVariant
  title?: string
  icon?: ReactNode
  className?: string
}

/**
 * Reusable info/warning/success box component
 * Used for displaying user guidance and important messages
 */
export function InfoBox({
  children,
  variant = 'info',
  title,
  icon,
  className = '',
}: InfoBoxProps) {
  return (
    <div className={`rounded p-3 ${variantStyles[variant]} ${className}`} role="alert">
      <div className="flex gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{children}</p>
        </div>
      </div>
    </div>
  )
}
