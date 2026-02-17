/**
 * Offline Banner - Full-width notification when offline
 *
 * Features:
 * - Animated slide-in/out
 * - Shows queue count
 * - Auto-hides when back online
 * - Accessible with proper ARIA attributes
 *
 * Best practices from:
 * - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
 */

"use client";

import { useEffect, useState } from "react";
import { WifiOff, Cloud, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { syncQueue, type SyncStatus } from "@/lib/offline/sync-queue";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  /** Additional CSS classes */
  readonly className?: string;
  /** Position of the banner */
  readonly position?: "top" | "bottom";
  /** Show pending sync count */
  readonly showPendingCount?: boolean;
}

/**
 * Pluralize a word based on count
 */
function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Offline Banner Component
 *
 * Shows a notification when the user is offline.
 * Automatically hides when back online.
 */
export function OfflineBanner({
  className,
  position = "top",
  showPendingCount = true,
}: OfflineBannerProps) {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
    lastSyncAt: null,
    lastError: null,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [showSyncingMessage, setShowSyncingMessage] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard hydration pattern
    setIsMounted(true);
  }, []);

  // Subscribe to sync status
  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setStatus);
    return unsubscribe;
  }, []);

  // Handle visibility with animation delay
  useEffect(() => {
    if (!isOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: UI state sync based on network status
      setIsVisible(true);
      setShowSyncingMessage(false);
    } else if (status.isSyncing && status.pendingCount > 0) {
      // Show syncing message when coming back online with pending items
      setShowSyncingMessage(true);
      setIsVisible(true);
    } else {
      // Delay hiding for animation
      setShowSyncingMessage(false);
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, status.isSyncing, status.pendingCount]);

  // Don't render until mounted (prevents hydration mismatch)
  // Don't render if not visible and online
  if (!isMounted || (!isVisible && isOnline)) return null;

  const getMessage = () => {
    if (!isOnline) {
      if (isSlowConnection) {
        return "Slow connection detected. Some features may be limited.";
      }
      // A11Y-007 FIX: Show more detailed sync status including failed count
      if (showPendingCount && status.pendingCount > 0) {
        let message = `You're offline. ${status.pendingCount} ${pluralize(status.pendingCount, "change", "changes")} will sync when you reconnect.`;
        if (status.failedCount > 0) {
          message += ` (${status.failedCount} failed)`;
        }
        return message;
      }
      if (status.failedCount > 0) {
        return `You're offline. ${status.failedCount} ${pluralize(status.failedCount, "item", "items")} failed to sync.`;
      }
      return "You're offline. Changes will sync when you reconnect.";
    }

    if (showSyncingMessage) {
      return `Syncing ${status.pendingCount} ${pluralize(status.pendingCount, "change", "changes")}...`;
    }

    return "Back online!";
  };

  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 flex-shrink-0" />;
    }
    if (showSyncingMessage) {
      return <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin" />;
    }
    return <Cloud className="h-4 w-4 flex-shrink-0" />;
  };

  const getBackgroundColor = () => {
    if (!isOnline) {
      return "bg-warning";
    }
    if (showSyncingMessage) {
      return "bg-primary";
    }
    return "bg-success";
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        position === "top" ? "top-0" : "bottom-0",
        isOnline && !showSyncingMessage
          ? "opacity-0 translate-y-[-100%]"
          : "opacity-100 translate-y-0",
        getBackgroundColor(),
        className,
      )}
    >
      <div className="px-4 py-2 flex items-center justify-center gap-2 text-white">
        {getIcon()}
        <span className="text-sm font-medium">{getMessage()}</span>
      </div>
    </div>
  );
}

/**
 * Inline Offline Notice - Smaller, inline version for cards/sections
 */
export function OfflineNotice({ className }: Readonly<{ className?: string }>) {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <output
      className={cn(
        "flex items-center gap-2 text-warning bg-warning/10 px-3 py-2 rounded-md text-sm",
        className,
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>Offline mode - changes will sync later</span>
    </output>
  );
}

/**
 * Connection Quality Indicator
 */
export function ConnectionQuality({ className }: Readonly<{ className?: string }>) {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div
        className={cn("flex items-center gap-1 text-error text-xs", className)}
      >
        <WifiOff className="h-3 w-3" />
        <span>Offline</span>
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-warning text-xs",
          className,
        )}
      >
        <Cloud className="h-3 w-3" />
        <span>Slow ({effectiveType})</span>
      </div>
    );
  }

  return null; // Don't show anything for good connections
}
