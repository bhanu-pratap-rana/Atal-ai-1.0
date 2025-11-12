'use client'

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

export interface GradientCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  gradientBorder?: boolean
  hover?: boolean
}

const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  ({ children, className, innerClassName, gradientBorder = true, hover = true, ...props }, ref) => {
    if (gradientBorder) {
      return (
        <motion.div
          ref={ref}
          className={cn(
            "relative p-[3px] rounded-xl bg-gradient-to-br from-primary to-primary-light",
            className
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={hover ? { y: -4, boxShadow: "0 12px 28px rgba(255, 140, 66, 0.3)" } : undefined}
          {...props}
        >
          <div
            className={cn(
              "bg-white rounded-[10px] p-6",
              innerClassName
            )}
          >
            {children}
          </div>
        </motion.div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-white rounded-xl p-6 shadow-md",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={hover ? { y: -4, boxShadow: "0 12px 28px rgba(0, 0, 0, 0.1)" } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

GradientCard.displayName = "GradientCard"

export { GradientCard }
