import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * ATAL AI InfoBox Component - Jyoti Theme
 * 
 * STRICT RULES:
 * - default: Uses PRIMARY-light background (#FFE8DB)
 * - success/warning/error/info: Use semantic colors
 */

type InfoBoxVariant = 'default' | 'info' | 'warning' | 'success' | 'error'

const variantStyles: Record<InfoBoxVariant, string> = {
  default: 'bg-primary-light border-l-4 border-primary text-secondary',
  info: 'bg-info-light border-l-4 border-info text-info-dark',
  warning: 'bg-warning-light border-l-4 border-warning text-warning-dark',
  success: 'bg-success-light border-l-4 border-success text-success-dark',
  error: 'bg-error-light border-l-4 border-error text-error-dark',
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
  variant = 'default',
  title,
  icon,
  className = '',
}: InfoBoxProps) {
  return (
    <div 
      className={cn(
        "rounded-xl p-4",
        variantStyles[variant],
        className
      )} 
      role="alert"
    >
      <div className="flex gap-3">
        {icon && <div className="flex-shrink-0 text-lg">{icon}</div>}
        <div className="flex-1">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{children}</p>
        </div>
      </div>
    </div>
  )
}
