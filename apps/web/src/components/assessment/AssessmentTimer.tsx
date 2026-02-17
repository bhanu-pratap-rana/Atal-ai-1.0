"use client";

import { useTimer, formatTimeMMSS } from "@/hooks/useTimer";

/**
 * ATAL AI Assessment Timer - Jyoti Theme
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 *
 * Features:
 * - Elapsed time display (MM:SS format)
 * - Auto-incrementing every second
 * - Proper cleanup on unmount
 */

interface AssessmentTimerProps {
  /** Whether to pause the timer */
  readonly isPaused?: boolean;
  /** Initial elapsed time in seconds (for resuming) */
  readonly initialSeconds?: number;
  /** Callback when time updates (receives total seconds) */
  readonly onTimeUpdate?: (seconds: number) => void;
  /** Custom class name for styling */
  readonly className?: string;
}

export function AssessmentTimer({
  isPaused = false,
  initialSeconds = 0,
  onTimeUpdate,
  className = "",
}: AssessmentTimerProps) {
  // Use shared timer hook (eliminates duplication)
  const elapsedSeconds = useTimer({
    initialSeconds,
    isPaused,
    onTimeUpdate,
  });

  return (
    <div
      className={`inline-flex items-center gap-2 text-text-secondary ${className}`}
      role="timer"
      aria-label={`Elapsed time: ${formatTimeMMSS(elapsedSeconds)}`}
    >
      <span className="text-lg" aria-hidden="true">
        ⏱️
      </span>
      <span className="font-mono text-base font-medium tabular-nums">
        {formatTimeMMSS(elapsedSeconds)}
      </span>
    </div>
  );
}

/**
 * Compact timer for use in progress header
 */
export function CompactTimer({
  isPaused = false,
  initialSeconds = 0,
  onTimeUpdate,
}: Readonly<Omit<AssessmentTimerProps, "className">>) {
  // Use shared timer hook (eliminates duplication)
  const elapsedSeconds = useTimer({
    initialSeconds,
    isPaused,
    onTimeUpdate,
  });

  return (
    <span
      className="text-sm font-mono font-medium text-text-tertiary tabular-nums"
      role="timer"
      aria-label={`Elapsed time: ${formatTimeMMSS(elapsedSeconds)}`}
    >
      {formatTimeMMSS(elapsedSeconds)}
    </span>
  );
}
