"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Extend Window interface for test environment detection
declare global {
  interface Window {
    __PLAYWRIGHT_TEST__?: boolean;
  }
  interface Global {
    __PLAYWRIGHT__?: boolean;
  }
}

// Detect test environment for Playwright test stability
// Uses runtime detection to check if we're in a test/Playwright browser
const isTestEnvironment = () => {
  if (typeof globalThis === "undefined") return false;

  // Check multiple ways to detect test environment
  const testGlobal = globalThis as Record<string, unknown>;
  return (
    // Standard test env variables
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_TEST === "true" ||
    // Playwright detection - check if running in test mode
    (typeof navigator !== "undefined" &&
      (Boolean(navigator.webdriver) ||
        navigator.userAgent.includes("HeadlessChrome") ||
        // Check for test globals
        Boolean(testGlobal.__PLAYWRIGHT_TEST__))) ||
    // Check for test globals that might be set
    (typeof globalThis !== "undefined" &&
      Boolean(testGlobal.__PLAYWRIGHT__))
  );
};

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary to-primary-light text-white shadow-md hover:shadow-lg border-2 border-white/20",
        destructive:
          "bg-error text-white hover:bg-error/90 shadow-md border-2 border-white/20",
        outline:
          "border-2 border-primary bg-white text-primary hover:bg-surface",
        secondary:
          "bg-surface text-text-primary hover:bg-border border-2 border-border",
        ghost:
          "hover:bg-surface hover:text-primary border-2 border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-br from-primary to-primary-light text-white shadow-md hover:shadow-lg border-2 border-white/20",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-11 rounded-md px-4",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    Omit<HTMLMotionProps<"button">, "ref" | "children">,
    VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
  readonly loading?: boolean;
  readonly children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : motion.button;
    const inTestMode = isTestEnvironment();

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        whileHover={inTestMode ? undefined : { scale: 1.02 }}
        whileTap={inTestMode ? undefined : { scale: 0.98 }}
        transition={
          inTestMode
            ? undefined
            : { type: "spring", stiffness: 400, damping: 17 }
        }
        disabled={disabled || loading}
        {...(props as Record<string, unknown>)}
      >
        {loading && !inTestMode && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/90 to-primary-light/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
