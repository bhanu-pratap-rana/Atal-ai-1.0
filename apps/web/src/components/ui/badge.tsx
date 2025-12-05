import { cn } from "@/lib/utils"

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'secondary'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  error: 'bg-error-light text-error',
  info: 'bg-info-light text-info',
  accent: 'bg-accent-light text-[#B8860B]',
  secondary: 'bg-secondary-light text-white',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full",
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
