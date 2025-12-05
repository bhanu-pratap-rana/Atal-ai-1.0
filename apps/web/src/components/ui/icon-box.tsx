import { cn } from "@/lib/utils"

interface IconBoxProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-10 h-10 text-lg',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl',
}

export function IconBox({ children, size = 'md', className }: IconBoxProps) {
  return (
    <div className={cn(
      "flex items-center justify-center rounded-xl bg-primary-light flex-shrink-0",
      sizes[size],
      className
    )}>
      {children}
    </div>
  )
}
