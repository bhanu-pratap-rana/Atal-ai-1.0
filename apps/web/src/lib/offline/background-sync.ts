/**
 * Background Sync - Service Worker Background Sync API Integration
 *
 * Provides utilities for:
 * - Registering background sync events
 * - Periodic background sync (where supported)
 * - Service worker communication
 *
 * Best practices from:
 * - https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs
 * - https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
 */

import { clientLogger } from "@/lib/client-logger";

/**
 * Background Sync API type definitions
 * Extends standard ServiceWorkerRegistration with sync capabilities
 */

// SyncManager interface for one-time background sync
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// PeriodicSyncManager interface for periodic background sync
interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval?: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

// Extend ServiceWorkerRegistration with sync properties
declare global {
  interface ServiceWorkerRegistration {
    sync?: SyncManager;
    periodicSync?: PeriodicSyncManager;
  }
}

/**
 * Sync tags for different mutation types
 * Used to identify what type of data needs syncing
 */
export const SYNC_TAGS = {
  /** Assessment submissions - highest priority */
  ASSESSMENT: "sync-assessments",
  /** Progress updates - medium priority */
  PROGRESS: "sync-progress",
  /** AI chat messages - can be batched */
  CHAT: "sync-chat",
  /** Points awards - low priority */
  POINTS: "sync-points",
  /** All pending data */
  ALL: "sync-all",
} as const;

export type SyncTag = (typeof SYNC_TAGS)[keyof typeof SYNC_TAGS];

/**
 * Periodic sync tags for regular background updates
 */
export const PERIODIC_SYNC_TAGS = {
  /** Sync curriculum content for offline access */
  CURRICULUM: "periodic-curriculum-sync",
  /** Check for new badges */
  BADGES: "periodic-badges-check",
} as const;

export type PeriodicSyncTag =
  (typeof PERIODIC_SYNC_TAGS)[keyof typeof PERIODIC_SYNC_TAGS];

/**
 * Check if Service Worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/**
 * Check if Background Sync API is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    isServiceWorkerSupported() &&
    typeof globalThis !== "undefined" &&
    "SyncManager" in globalThis
  );
}

/**
 * Check if Periodic Background Sync API is supported
 */
export function isPeriodicSyncSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "periodicSync" in ServiceWorkerRegistration.prototype
  );
}

/**
 * Register a one-time background sync
 *
 * @example
 * ```tsx
 * // Queue an assessment sync when offline
 * await registerSync(SYNC_TAGS.ASSESSMENT);
 * ```
 */
export async function registerSync(tag: SyncTag): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    clientLogger.warn("[BackgroundSync] Not supported in this browser");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Use properly typed sync interface
    if (!registration.sync) {
      throw new Error("Background Sync API not available");
    }
    await registration.sync.register(tag);
    clientLogger.debug("[BackgroundSync] Registered", { tag });
    return true;
  } catch (error) {
    clientLogger.warn("[BackgroundSync] Registration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Register periodic background sync
 *
 * Note: Requires user permission and may be throttled by browser
 *
 * @param tag - Sync tag identifier
 * @param minInterval - Minimum interval between syncs in milliseconds (default: 24 hours)
 *
 * @example
 * ```tsx
 * // Sync curriculum content daily
 * await registerPeriodicSync(PERIODIC_SYNC_TAGS.CURRICULUM, 24 * 60 * 60 * 1000);
 * ```
 */
export async function registerPeriodicSync(
  tag: PeriodicSyncTag,
  minInterval: number = 24 * 60 * 60 * 1000, // 24 hours default
): Promise<boolean> {
  if (!isPeriodicSyncSupported()) {
    clientLogger.warn("[PeriodicSync] Not supported in this browser");
    return false;
  }

  try {
    // Check permission
    const status = await navigator.permissions.query({
      name: "periodic-background-sync" as PermissionName,
    });

    if (status.state !== "granted") {
      clientLogger.warn("[PeriodicSync] Permission not granted", {
        state: status.state,
      });
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    // Use properly typed periodicSync interface
    if (!registration.periodicSync) {
      throw new Error("Periodic Background Sync API not available");
    }
    await registration.periodicSync.register(tag, { minInterval });

    clientLogger.debug("[PeriodicSync] Registered", {
      tag,
      interval: minInterval,
    });
    return true;
  } catch (error) {
    clientLogger.warn("[PeriodicSync] Registration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Unregister a periodic background sync
 */
export async function unregisterPeriodicSync(
  tag: PeriodicSyncTag,
): Promise<boolean> {
  if (!isPeriodicSyncSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Use properly typed periodicSync interface
    if (!registration.periodicSync) {
      throw new Error("Periodic Background Sync API not available");
    }
    await registration.periodicSync.unregister(tag);
    clientLogger.debug("[PeriodicSync] Unregistered", { tag });
    return true;
  } catch (error) {
    clientLogger.warn("[PeriodicSync] Unregistration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Get all registered periodic sync tags
 */
export async function getPeriodicSyncTags(): Promise<string[]> {
  if (!isPeriodicSyncSupported()) {
    return [];
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Use properly typed periodicSync interface
    if (!registration.periodicSync) {
      throw new Error("Periodic Background Sync API not available");
    }
    const tags = await registration.periodicSync.getTags();
    return tags;
  } catch (error) {
    clientLogger.warn("[PeriodicSync] Failed to get tags", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Send a message to the service worker
 */
export async function sendMessageToSW<T = unknown>(
  message: Record<string, unknown>,
): Promise<T | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const controller = registration.active;

    if (!controller) {
      clientLogger.warn("[ServiceWorker] No active controller");
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      let resolved = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      // BUG-007/BUG-013 FIX: Proper cleanup to prevent memory leaks
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        messageChannel.port1.onmessage = null;
        messageChannel.port1.close();
      };

      messageChannel.port1.onmessage = (event) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(event.data as T);
        }
      };

      controller.postMessage(message, [messageChannel.port2]);

      // BUG-013 FIX: Clear timeout when message received, and cleanup on timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(null);
        }
      }, 5000);
    });
  } catch (error) {
    clientLogger.warn("[ServiceWorker] Message failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Request service worker to sync now
 */
export async function requestImmediateSync(tag: SyncTag): Promise<boolean> {
  const response = await sendMessageToSW<{ success: boolean }>({
    type: "SYNC_NOW",
    tag,
  });

  return response?.success ?? false;
}

/**
 * Check service worker sync status
 */
export async function getSyncStatus(): Promise<{
  isReady: boolean;
  pendingTags: string[];
}> {
  const response = await sendMessageToSW<{
    isReady: boolean;
    pendingTags: string[];
  }>({
    type: "GET_SYNC_STATUS",
  });

  return response ?? { isReady: false, pendingTags: [] };
}

/**
 * Initialize background sync for offline-first functionality
 * Call this on app startup
 */
let bgSyncInitialized = false;

export async function initializeBackgroundSync(): Promise<void> {
  // Guard against duplicate initialization (e.g., HMR in development)
  if (bgSyncInitialized) {
    clientLogger.debug("[BackgroundSync] Already initialized, skipping");
    return;
  }

  if (!isBackgroundSyncSupported()) {
    clientLogger.debug("[BackgroundSync] Not supported - using fallback");
    return;
  }

  bgSyncInitialized = true;

  // BUG-010 FIX: Pre-register all sync tags with error handling
  // Continue with other tags if one fails to register
  for (const tag of Object.values(SYNC_TAGS)) {
    try {
      // These will only trigger when there's data to sync
      await registerSync(tag);
    } catch (error) {
      clientLogger.warn("[BackgroundSync] Failed to register sync tag", {
        tag,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue with next tag instead of crashing initialization
    }
  }

  // Register periodic sync for curriculum updates (if supported)
  if (isPeriodicSyncSupported()) {
    await registerPeriodicSync(
      PERIODIC_SYNC_TAGS.CURRICULUM,
      24 * 60 * 60 * 1000, // Daily
    );
  }

  clientLogger.debug("[BackgroundSync] Initialized");
}
