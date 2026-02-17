"use client";

/**
 * useTimer Hook
 *
 * Reusable timer hook for tracking elapsed time
 * Handles pause/resume and automatic cleanup
 *
 * Replaces duplicate timer logic in:
 * - AssessmentTimer component
 * - CompactTimer component
 */

import { useEffect, useRef, useState } from "react";

export interface UseTimerOptions {
  initialSeconds?: number;
  isPaused?: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

/**
 * Timer hook for tracking elapsed time
 *
 * @param options - Configuration options
 * @param options.initialSeconds - Starting time in seconds (default: 0)
 * @param options.isPaused - Whether timer is paused (default: false)
 * @param options.onTimeUpdate - Callback fired every second with elapsed time
 *
 * @returns Current elapsed time in seconds
 *
 * @example
 * ```tsx
 * function MyTimer() {
 *   const [isPaused, setIsPaused] = useState(false);
 *   const elapsedSeconds = useTimer({
 *     isPaused,
 *     onTimeUpdate: (seconds) => console.log('Elapsed:', seconds)
 *   });
 *
 *   return <div>{elapsedSeconds}s</div>;
 * }
 * ```
 */
export function useTimer({
  initialSeconds = 0,
  isPaused = false,
  onTimeUpdate,
}: UseTimerOptions = {}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use ref for callback to avoid interval restarts when parent re-renders
  const onTimeUpdateRef = useRef(onTimeUpdate);
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  });

  // Propagate time updates via useEffect (not inside setState updater)
  // Calling parent setState inside a setState updater causes:
  // "Cannot update a component while rendering a different component"
  useEffect(() => {
    onTimeUpdateRef.current?.(elapsedSeconds);
  }, [elapsedSeconds]);

  // Handle pause/resume
  useEffect(() => {
    // Clear interval if paused
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start interval if not paused
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Cleanup on unmount or pause state change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused]);

  // Handle initial seconds change
  useEffect(() => {
    setElapsedSeconds(initialSeconds);
  }, [initialSeconds]);

  return elapsedSeconds;
}

/**
 * Format seconds into MM:SS format
 *
 * @param seconds - Total seconds
 * @returns Formatted time string (e.g., "05:23")
 *
 * @example
 * ```tsx
 * formatTimeMMSS(323); // "05:23"
 * formatTimeMMSS(45);  // "00:45"
 * ```
 */
export function formatTimeMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
