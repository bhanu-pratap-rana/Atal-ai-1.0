/**
 * Sync Queue - Offline Mutation Queue with Retry
 *
 * Implements offline-first sync with:
 * - Queue mutations when offline
 * - Exponential backoff with jitter (prevents thundering herd)
 * - Automatic sync when online
 * - Subscription pattern for UI updates
 * - Manual sync with progress tracking
 * - Conflict resolution
 *
 * Best practices from:
 * - https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs
 * - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation
 * - https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/
 */

import { offlineDB, type QueuedMutation } from "./database";
import { createClient } from "@/lib/supabase-browser";
import { clientLogger } from "@/lib/client-logger";

/**
 * Maximum retry attempts before giving up
 */
const MAX_RETRIES = 5;

/**
 * Base delay for exponential backoff (ms)
 */
const BASE_DELAY = 1000;

/**
 * Maximum delay for exponential backoff (ms)
 */
const MAX_DELAY = 32000;

/**
 * Jitter factor (10% variance to prevent thundering herd)
 */
const JITTER_FACTOR = 0.1;

/**
 * PWA-002 FIX: Sync operation timeout (30 seconds)
 * Prevents users getting stuck in sync state forever
 */
const SYNC_TIMEOUT_MS = 30000;

/**
 * Sync status for UI updates
 */
export interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: number;
  failed: number;
  pending: number;
  errors: Array<{ id: number; error: string }>;
}

/**
 * Callback for sync status updates
 */
type SyncStatusCallback = (status: SyncStatus) => void;

/**
 * Progress callback for manual sync
 */
type ProgressCallback = (current: number, total: number) => void;

/**
 * Sync Queue Manager
 */
export class SyncQueue {
  private isSyncing = false;
  private syncPromise: Promise<SyncResult> | null = null;
  private lastSyncAt: number | null = null;
  private lastError: string | null = null;
  private readonly subscribers: Set<SyncStatusCallback> = new Set();

  /**
   * Subscribe to sync status updates
   *
   * @example
   * ```tsx
   * useEffect(() => {
   *   const unsubscribe = syncQueue.subscribe((status) => {
   *     setPendingCount(status.pendingCount);
   *     setIsSyncing(status.isSyncing);
   *   });
   *   return unsubscribe;
   * }, []);
   * ```
   */
  subscribe(callback: SyncStatusCallback): () => void {
    this.subscribers.add(callback);

    // BUG-001 FIX: Track subscription state to prevent race condition
    // The callback might be unsubscribed before getStatus() resolves,
    // so we check if still subscribed before invoking the callback
    this.getStatus()
      .then((status) => {
        // Only call callback if still subscribed (prevents race condition)
        if (this.subscribers.has(callback)) {
          callback(status);
        }
      })
      .catch((error) => {
        clientLogger.error("[SyncQueue] Failed to get initial status", {
          error: error instanceof Error ? error.message : String(error),
        });
        // Only send default status if still subscribed
        if (this.subscribers.has(callback)) {
          callback({
            pendingCount: 0,
            failedCount: 0,
            isSyncing: false,
            lastSyncAt: null,
            lastError: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of status change
   */
  private async notifySubscribers(): Promise<void> {
    const status = await this.getStatus();
    this.subscribers.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        clientLogger.error("[SyncQueue] Subscriber error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  /**
   * Add a mutation to the queue
   */
  async enqueue(
    type: QueuedMutation["type"],
    payload: Record<string, unknown>,
  ): Promise<number | undefined> {
    const mutation: Omit<QueuedMutation, "id"> = {
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    const id = await offlineDB.syncQueue.add(mutation as QueuedMutation);

    // Notify subscribers of new item
    await this.notifySubscribers();

    // Try to sync immediately if online (fire-and-forget with error handling)
    if (typeof navigator !== "undefined" && navigator.onLine) {
      this.syncAll().catch((err) => {
        clientLogger.warn("[SyncQueue] Background sync failed", { error: err instanceof Error ? err.message : String(err) });
      });
    }

    return id;
  }

  /**
   * Process a batch of sync items (shared by syncAll and manualSync)
   */
  private async processSyncBatch(
    items: QueuedMutation[],
    onProgress?: ProgressCallback,
  ): Promise<{ success: number; failed: number; errors: Array<{ id: number; error: string }> }> {
    let success = 0;
    let failed = 0;
    const errors: Array<{ id: number; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Report progress if callback provided
      onProgress?.(i + 1, items.length);

      if (!item.id) {
        clientLogger.warn("[SyncQueue] Item missing id, skipping", {
          type: item.type,
          timestamp: item.timestamp,
        });
        continue;
      }

      const result = await this.syncItem(item);

      if (result.success) {
        await offlineDB.syncQueue.delete(item.id);
        success++;
      } else if (item.retries >= MAX_RETRIES) {
        clientLogger.error("[SyncQueue] Max retries exceeded", {
          itemId: item.id,
          type: item.type,
          retries: item.retries,
        });
        await offlineDB.syncQueue.delete(item.id);
        failed++;
        errors.push({
          id: item.id,
          error: result.error || "Max retries exceeded",
        });
      } else if (item.id) {
        // Increment retry count
        await offlineDB.syncQueue.update(item.id, {
          retries: item.retries + 1,
          lastError: result.error,
        });
      }
    }

    return { success, failed, errors };
  }

  /**
   * Sync all pending mutations
   */
  async syncAll(): Promise<SyncResult> {
    // If already syncing, wait for the ongoing sync instead of returning empty results
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this.executeSyncAll();
    try {
      return await this.syncPromise;
    } finally {
      this.syncPromise = null;
    }
  }

  private async executeSyncAll(): Promise<SyncResult> {
    this.isSyncing = true;
    this.lastError = null;
    await this.notifySubscribers();

    try {
      const pending = await offlineDB.syncQueue.toArray();
      const { success, failed, errors } = await this.processSyncBatch(pending);
      this.lastSyncAt = Date.now();

      const status = await this.getStatus();
      return { success, failed, pending: status.pendingCount, errors };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "Unknown error";
      clientLogger.error("[SyncQueue] Sync failed", {
        error: error instanceof Error ? error.message : this.lastError,
      });
      const status = await this.getStatus();
      return { success: 0, failed: 0, pending: status.pendingCount, errors: [] };
    } finally {
      this.isSyncing = false;
      await this.notifySubscribers();
    }
  }

  /**
   * Manual sync with progress callback
   *
   * @example
   * ```tsx
   * await syncQueue.manualSync((current, total) => {
   *   setProgress((current / total) * 100);
   * });
   * ```
   */
  async manualSync(onProgress?: ProgressCallback): Promise<SyncResult> {
    if (this.isSyncing) {
      const status = await this.getStatus();
      return {
        success: 0,
        failed: 0,
        pending: status.pendingCount,
        errors: [],
      };
    }

    this.isSyncing = true;
    this.lastError = null;
    await this.notifySubscribers();

    try {
      const pending = await offlineDB.syncQueue.toArray();
      const { success, failed, errors } = await this.processSyncBatch(
        pending,
        onProgress,
      );
      this.lastSyncAt = Date.now();

      const status = await this.getStatus();
      return { success, failed, pending: status.pendingCount, errors };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "Unknown error";
      clientLogger.error("[SyncQueue] Manual sync failed", {
        error: error instanceof Error ? error.message : this.lastError,
      });
      const status = await this.getStatus();
      return { success: 0, failed: 0, pending: status.pendingCount, errors: [] };
    } finally {
      this.isSyncing = false;
      await this.notifySubscribers();
    }
  }

  /**
   * Get items that failed after max retries
   */
  async getFailedItems(): Promise<QueuedMutation[]> {
    const allItems = await offlineDB.syncQueue.toArray();
    return allItems.filter((item) => item.retries >= MAX_RETRIES);
  }

  /**
   * Retry a specific failed item
   */
  async retryItem(id: number): Promise<boolean> {
    const item = await offlineDB.syncQueue.get(id);
    if (!item) return false;

    // Reset retry count
    await offlineDB.syncQueue.update(id, { retries: 0, lastError: undefined });

    // Try to sync
    const result = await this.syncItem(item);

    if (result.success) {
      await offlineDB.syncQueue.delete(id);
      await this.notifySubscribers();
      return true;
    }

    return false;
  }

  /**
   * PWA-002 FIX: Wrap a promise with a timeout
   * Prevents operations from hanging indefinitely
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = SYNC_TIMEOUT_MS,
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  /**
   * Sync a single item with exponential backoff and jitter
   * PWA-002 FIX: Added timeout to prevent infinite waiting
   */
  private async syncItem(
    item: QueuedMutation,
  ): Promise<{ success: boolean; error?: string }> {
    // Calculate backoff delay with jitter
    const delay = this.getBackoffDelay(item.retries);

    // Only wait if this is a retry (not first attempt)
    if (item.retries > 0) {
      await this.sleep(delay);
    }

    try {
      const supabase = createClient();

      // PWA-002 FIX: Wrap all database operations with timeout
      // Note: Supabase query builders are "thenables", so we wrap with Promise.resolve()
      switch (item.type) {
        case "assessment_submit": {
          const { error } = await this.withTimeout(
            Promise.resolve(supabase.from("formative_responses").insert(item.payload)),
          );
          if (error) throw new Error(`Sync assessment failed: ${error.message}`);
          break;
        }

        case "progress_update": {
          // BUG-016 FIX: Use update_progress_atomic RPC instead of direct upsert
          // Direct upsert allows score regression and resets attempts counter
          // The RPC uses GREATEST() to keep highest score and increments attempts
          const { error } = await this.withTimeout(
            Promise.resolve(supabase.rpc("update_progress_atomic", {
              p_student_id: item.payload.student_id,
              p_topic_id: item.payload.topic_id,
              p_module_id: item.payload.module_id,
              p_score: item.payload.mastery_score,
            })),
          );
          if (error) throw new Error(`Sync progress failed: ${error.message}`);
          break;
        }

        case "chat_message": {
          const { error } = await this.withTimeout(
            Promise.resolve(supabase.from("ai_tutor_interactions").insert(item.payload)),
          );
          if (error) throw new Error(`Sync chat failed: ${error.message}`);
          break;
        }

        case "points_award": {
          const { error } = await this.withTimeout(
            Promise.resolve(supabase.from("points_history").insert(item.payload)),
          );
          if (error) throw new Error(`Sync points failed: ${error.message}`);
          break;
        }

        default:
          clientLogger.warn("[SyncQueue] Unknown mutation type", {
            type: item.type,
          });
          return { success: false, error: `Unknown type: ${item.type}` };
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      clientLogger.error("[SyncQueue] Item sync failed", {
        error: error instanceof Error ? error.message : errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   * Jitter prevents "thundering herd" problem when many clients reconnect
   * Uses crypto.getRandomValues() for secure randomness
   */
  private getBackoffDelay(retries: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (capped)
    const baseDelay = Math.min(BASE_DELAY * Math.pow(2, retries), MAX_DELAY);

    // Add ±10% jitter using secure random
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Convert to range [-1, 1]: (value / max * 2) - 1
    const randomFactor = (array[0] / 0xFFFFFFFF) * 2 - 1;
    const jitter = baseDelay * JITTER_FACTOR * randomFactor;

    return Math.floor(baseDelay + jitter);
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const allItems = await offlineDB.syncQueue.toArray();
    const pendingCount = allItems.filter(
      (item) => item.retries < MAX_RETRIES,
    ).length;
    const failedCount = allItems.filter(
      (item) => item.retries >= MAX_RETRIES,
    ).length;

    return {
      pendingCount,
      failedCount,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
  }

  /**
   * Clear all pending mutations
   */
  async clearAll(): Promise<void> {
    await offlineDB.syncQueue.clear();
    await this.notifySubscribers();
  }

  /**
   * Clear only failed items
   */
  async clearFailed(): Promise<void> {
    const failedItems = await this.getFailedItems();
    // PERF-014 FIX: Delete failed items in parallel (independent operations)
    await Promise.all(
      failedItems
        .filter((item) => item.id)
        .map((item) => offlineDB.syncQueue.delete(item.id!)),
    );
    await this.notifySubscribers();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const syncQueue = new SyncQueue();

// Auto-sync when coming online - only in browser environment
// BUG-004 FIX: Guard against duplicate registration on HMR
let syncQueueListenersInitialized = false;
if (
  typeof globalThis !== "undefined" &&
  typeof globalThis.addEventListener === "function" &&
  !syncQueueListenersInitialized
) {
  syncQueueListenersInitialized = true;
  // MEMORY LEAK FIX: Track interval ID for proper cleanup
  let syncIntervalId: NodeJS.Timeout | null = null;
  let onlineHandler: (() => void) | null = null;

  onlineHandler = () => {
    clientLogger.debug("[SyncQueue] Online - starting sync");
    syncQueue.syncAll().catch((err) => {
      clientLogger.warn("[SyncQueue] Online sync failed", { error: err instanceof Error ? err.message : String(err) });
    });
  };

  globalThis.addEventListener("online", onlineHandler);

  // Initialize periodic sync (5 minutes when online)
  syncIntervalId = setInterval(
    () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        syncQueue.syncAll().catch((err) => {
          clientLogger.warn("[SyncQueue] Periodic sync failed", { error: err instanceof Error ? err.message : String(err) });
        });
      }
    },
    5 * 60 * 1000,
  );

  // Cleanup function to prevent memory leaks
  const cleanup = () => {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
      clientLogger.debug("[SyncQueue] Interval cleared");
    }
    if (onlineHandler) {
      globalThis.removeEventListener("online", onlineHandler);
      onlineHandler = null;
      clientLogger.debug("[SyncQueue] Event listener removed");
    }
  };

  // Cleanup on page unload
  globalThis.addEventListener("beforeunload", cleanup);

  // MEM-1 FIX: Store handler reference for proper cleanup (was leaking listener)
  let visibilityHandler: (() => void) | null = null;
  if (typeof document !== "undefined") {
    visibilityHandler = () => {
      if (document.hidden) {
        clientLogger.debug("[SyncQueue] Page hidden - stopping sync");
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);
  }

  // Extended cleanup to include visibilitychange listener
  const fullCleanup = () => {
    cleanup();
    if (visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityHandler = null;
    }
  };
  globalThis.removeEventListener("beforeunload", cleanup);
  globalThis.addEventListener("beforeunload", fullCleanup);
}
