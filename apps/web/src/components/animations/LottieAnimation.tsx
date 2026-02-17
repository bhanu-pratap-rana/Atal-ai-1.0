"use client";

/**
 * Lottie Animation Components
 *
 * Lightweight animations for UI feedback and engagement.
 * Uses lottie-react for smooth, offline-compatible animations.
 *
 * Benefits:
 * - Instant loading (no API calls)
 * - Works offline
 * - Small file size
 * - Smooth 60fps animations
 */

import { useEffect, useState, useMemo } from "react";
import Lottie from "lottie-react";


// Default animation data (embedded for critical animations)
const DEFAULT_SUCCESS_ANIMATION = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  layers: [
    {
      ty: 4,
      nm: "check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100], h: 0 },
            { t: 15, s: [120, 120, 100], h: 0 },
            { t: 25, s: [100, 100, 100], h: 0 },
          ],
        },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  c: false,
                  v: [[-15, 0], [-5, 10], [15, -10]],
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                },
              },
            },
            {
              ty: "st",
              c: { a: 0, k: [0.2, 0.8, 0.4, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 6 },
              lc: 2,
              lj: 2,
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },
  ],
};

const DEFAULT_LOADING_ANIMATION = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 120,
  w: 100,
  h: 100,
  layers: [
    {
      ty: 4,
      nm: "spinner",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0], h: 0 },
            { t: 120, s: [360], h: 0 },
          ],
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              s: { a: 0, k: [60, 60] },
              p: { a: 0, k: [0, 0] },
            },
            {
              ty: "st",
              c: { a: 0, k: [0.4, 0.4, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 6 },
              lc: 2,
              d: [{ n: "d", nm: "dash", v: { a: 0, k: 40 } }, { n: "g", nm: "gap", v: { a: 0, k: 100 } }],
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
    },
  ],
};

interface LottieAnimationProps {
  /**
   * Animation type (uses embedded default) or path to JSON file
   */
  animation: "success" | "loading" | "celebration" | "thinking" | string;
  /**
   * Width in pixels
   */
  width?: number;
  /**
   * Height in pixels
   */
  height?: number;
  /**
   * Loop the animation
   */
  loop?: boolean;
  /**
   * Auto-play on mount
   */
  autoPlay?: boolean;
  /**
   * CSS class name
   */
  className?: string;
  /**
   * Callback when animation completes (only if loop=false)
   */
  onComplete?: () => void;
}

// Animation file paths
const ANIMATION_PATHS: Record<string, string> = {
  celebration: "/lottie/celebration.json",
  thinking: "/lottie/thinking.json",
};

// Get built-in animation data (synchronous, no side effects)
function getBuiltInAnimation(animation: string): object | null {
  if (animation === "success") return DEFAULT_SUCCESS_ANIMATION;
  if (animation === "loading") return DEFAULT_LOADING_ANIMATION;
  return null;
}

export function LottieAnimation({
  animation,
  width = 100,
  height = 100,
  loop = true,
  autoPlay = true,
  className = "",
  onComplete,
}: LottieAnimationProps) {
  // Get built-in animation synchronously via useMemo
  const builtInData = useMemo(() => getBuiltInAnimation(animation), [animation]);

  // State for dynamically loaded animations
  const [loadedData, setLoadedData] = useState<object | null>(null);

  // Only fetch if not a built-in animation
  useEffect(() => {
    // Skip if we have built-in data
    if (builtInData) {
      return;
    }

    // Load from file for custom animations
    const path = ANIMATION_PATHS[animation] || animation;
    if (path.startsWith("/") || path.startsWith("http")) {
      let cancelled = false;
      fetch(path)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to load animation`);
          }
          return res.json();
        })
        .then((data) => {
          if (!cancelled) setLoadedData(data);
        })
        .catch(() => {
          // Fallback to loading animation on any error
          if (!cancelled) setLoadedData(DEFAULT_LOADING_ANIMATION);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [animation, builtInData]);

  // Use built-in data if available, otherwise use loaded data
  const animationData = builtInData || loadedData;

  if (!animationData) {
    return (
      <div
        style={{ width, height }}
        className={`animate-pulse bg-surface rounded ${className}`}
      />
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoPlay}
      style={{ width, height }}
      className={className}
      onComplete={onComplete}
    />
  );
}

/**
 * Pre-built animation components for common use cases
 */

export function SuccessAnimation({
  size = 80,
  onComplete,
}: {
  size?: number;
  onComplete?: () => void;
}) {
  return (
    <LottieAnimation
      animation="success"
      width={size}
      height={size}
      loop={false}
      onComplete={onComplete}
    />
  );
}

export function LoadingAnimation({ size = 60 }: { size?: number }) {
  return (
    <LottieAnimation
      animation="loading"
      width={size}
      height={size}
      loop={true}
    />
  );
}

export function CelebrationAnimation({
  size = 200,
  onComplete,
}: {
  size?: number;
  onComplete?: () => void;
}) {
  return (
    <LottieAnimation
      animation="celebration"
      width={size}
      height={size}
      loop={false}
      onComplete={onComplete}
    />
  );
}

export function ThinkingAnimation({ size = 60 }: { size?: number }) {
  return (
    <LottieAnimation
      animation="thinking"
      width={size}
      height={size}
      loop={true}
    />
  );
}
