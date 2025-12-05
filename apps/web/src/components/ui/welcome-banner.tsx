'use client'

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface WelcomeBannerProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  emoji?: string
}

export function WelcomeBanner({ 
  title, 
  subtitle, 
  action, 
  className,
  emoji = "👋"
}: WelcomeBannerProps) {
  return (
    <motion.div
      className={cn(
        "bg-gradient-primary rounded-xl p-6 text-white",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <h2 
              className="text-2xl font-bold" 
              style={{ fontFamily: "'Baloo 2', sans-serif" }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-white/90 text-sm mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0">{action}</div>
        )}
      </div>
    </motion.div>
  )
}
