/**
 * Sync Status Indicator - Visual sync status for offline-first UX
 *
 * Features:
 * - Shows online/offline status
 * - Displays pending sync count
 * - Manual sync button
 * - Last sync time tooltip
 *
 * Best practices from:
 * - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { WifiOff, RefreshCw, AlertCircle, Check } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Button } from "@/components/ui/button";
import { syncQueue, type SyncStatus } from "@/lib/offline/sync-queue";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SyncStatusIndicatorProps {
  /** Additional CSS classes */
  readonly className?: string;
  /** Show pending count badge */
  readonly showBadge?: boolean;
  /** Compact mode (icon only) */
  readonly compact?: boolean;
}

/**
 * Format relative time (e.g., "2 min ago")
 */
function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Get badge count display (caps at 9+)
 */
function getBadgeCountDisplay(count: number): string | number {
  return count > 9 ? "9+" : count;
}

/**
 * Sync Status Indicator Component
 *
 * Shows the current sync status with:
 * - Green checkmark: All synced
 * - Yellow spinning: Syncing in progress
 * - Yellow with badge: Pending items to sync
 * - Red wifi-off: Offline
 * - Red alert: Sync errors
 */
export function SyncStatusIndicator({
  className,
  showBadge = true,
  compact = false,
}: SyncStatusIndicatorProps) {
  const { isOnline } = useNetworkStatus();
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
    lastSyncAt: null,
    lastError: null,
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Subscribe to sync status updates
  useEffect(() => {
    const unsubscribe = syncQueue.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  // Handle manual sync
  const handleManualSync = useCallback(async () => {
    if (!isOnline || isManualSyncing) return;

    setIsManualSyncing(true);
    try {
      await syncQueue.manualSync();
    } finally {
      setIsManualSyncing(false);
    }
  }, [isOnline, isManualSyncing]);

  // Determine icon and color
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        color: "text-error",
        label: "Offline - changes will sync when you reconnect",
      };
    }

    if (status.isSyncing || isManualSyncing) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        color: "text-warning",
        label: "Syncing...",
      };
    }

    if (status.failedCount > 0) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: "text-error",
        label: `${status.failedCount} failed - tap to retry`,
      };
    }

    if (status.pendingCount > 0) {
      return {
        icon: <RefreshCw className="h-4 w-4" />,
        color: "text-warning",
        label: `${status.pendingCount} pending - tap to sync`,
      };
    }

    return {
      icon: <Check className="h-4 w-4" />,
      color: "text-success",
      label: status.lastSyncAt
        ? `All synced (${formatRelativeTime(status.lastSyncAt)})`
        : "All synced",
    };
  };

  const { icon, color, label } = getStatusDisplay();
  const canSync =
    isOnline &&
    !status.isSyncing &&
    !isManualSyncing &&
    status.pendingCount > 0;
  const hasBadge = showBadge && status.pendingCount > 0 && !status.isSyncing;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative inline-flex items-center justify-center",
                className,
              )}
            >
              <span className={color}>{icon}</span>
              {hasBadge && (
                <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {getBadgeCountDisplay(status.pendingCount)}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("relative", className)}
            onClick={canSync ? handleManualSync : undefined}
            disabled={!canSync && status.pendingCount > 0}
          >
            <span className={color}>{icon}</span>
            {hasBadge && (
              <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                {status.pendingCount > 9 ? "9+" : status.pendingCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
          {status.lastError && (
            <p className="text-error text-xs mt-1">Error: {status.lastError}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to get sync status for custom UI
 */
export function useSyncStatus() {
  const { isOnline } = useNetworkStatus();
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
    lastSyncAt: null,
    lastError: null,
  });

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return {
    ...status,
    isOnline,
    canSync: isOnline && !status.isSyncing && status.pendingCount > 0,
    sync: () => syncQueue.manualSync(),
  };
}
