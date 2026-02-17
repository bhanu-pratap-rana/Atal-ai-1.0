"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IconBox } from "./icon-box";

interface StatCardProps {
  readonly icon: string;
  readonly value: string | number;
  readonly label: string;
  readonly className?: string;
  readonly trend?: {
    readonly value: number;
    readonly isPositive: boolean;
  };
}

export function StatCard({
  icon,
  value,
  label,
  className,
  trend,
}: StatCardProps) {
  return (
    <motion.div
      className={cn(
        "flex items-center gap-4 p-5 bg-white rounded-xl shadow-md border border-border",
        className,
      )}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)" }}
      transition={{ duration: 0.2 }}
    >
      <IconBox size="lg">{icon}</IconBox>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary font-display">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold",
                trend.isPositive ? "text-success" : "text-error",
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <div className="text-sm text-text-secondary mt-1">{label}</div>
      </div>
    </motion.div>
  );
}
