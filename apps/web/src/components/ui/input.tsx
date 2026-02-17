"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="relative w-full">
        <motion.div
          className={cn(
            "relative rounded-lg transition-all duration-200",
            isFocused &&
              "p-[2px] bg-gradient-to-br from-primary to-primary-light",
          )}
          animate={{
            boxShadow: isFocused
              ? "var(--shadow-primary-sm)"
              : "0 0 0 transparent",
          }}
        >
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg bg-surface px-4 py-2 text-sm text-text-primary transition-all",
              "placeholder:text-text-tertiary",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isFocused ? "bg-white" : "border border-border",
              error && "border-error focus-visible:ring-error",
              className,
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
        </motion.div>
        {error && (
          <motion.p
            role="alert"
            className="mt-1.5 text-xs text-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
