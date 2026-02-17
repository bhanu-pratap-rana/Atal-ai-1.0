"use client";

/**
 * Offline Sync Hook
 *
 * Provides client-side integration between server actions and offline sync queue.
 * Automatically enqueues mutations when server calls fail due to offline status.
 *
 * @example
 * ```tsx
 * const { submitAssessmentWithSync, isOfflineQueued } = useOfflineSync();
 *
 * const handleSubmit = async () => {
 *   const result = await submitAssessmentWithSync(sessionId, responses);
 *   if (isOfflineQueued) {
 *     toast.info('Assessment queued for later sync');
 *   }
 * };
 * ```
 */

import { useState, useCallback } from "react";
import {
  enqueueAssessmentResponse,
  enqueueChatMessage,
  enqueuePointsAward,
  enqueueProgressUpdate,
  subscribeMutationQueue,
  type AssessmentResponsePayload,
  type ChatMessagePayload,
  type PointsAwardPayload,
  type ProgressUpdatePayload,
} from "@/lib/offline";
import { clientLogger } from "@/lib/client-logger";

/**
 * Assessment response type for submitAssessmentWithSync
 */
interface AssessmentResponse {
  itemId: string;
  module: string;
  isCorrect: boolean;
  rtMs?: number;
  focusBlurCount?: number;
  chosenOption?: string;
}

/**
 * Hook for offline-aware mutations
 */
export function useOfflineSync() {
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);
  const [queueStatus, setQueueStatus] = useState({
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
  });

  // Subscribe to queue status updates
  const subscribeToQueue = useCallback(() => {
    return subscribeMutationQueue((status) => {
      setQueueStatus({
        pendingCount: status.pendingCount,
        failedCount: status.failedCount,
        isSyncing: status.isSyncing,
      });
    });
  }, []);

  /**
   * Submit assessment with offline support
   * If online and server call succeeds, returns server result
   * If offline, enqueues and returns success: true, queued: true
   */
  const submitAssessmentWithSync = useCallback(
    async (sessionId: string, responses: AssessmentResponse[]) => {
      try {
        // Don't enqueue if online - let server action handle it
        if (typeof navigator !== "undefined" && navigator.onLine) {
          return { success: false, error: "Use server action when online" };
        }

        // Build assessment response payloads
        const payloads: AssessmentResponsePayload[] = responses.map((r) => ({
          session_id: sessionId,
          item_id: r.itemId,
          module: r.module,
          is_correct: r.isCorrect,
          rt_ms: r.rtMs || 0,
          focus_blur_count: r.focusBlurCount || 0,
          chosen_option: r.chosenOption || "",
        }));

        // PERF-014 FIX: Enqueue all responses in parallel (independent operations)
        const queueResults = await Promise.all(
          payloads.map((payload) => enqueueAssessmentResponse(payload)),
        );
        const queuedCount = queueResults.filter((id) => id != null).length;

        setIsOfflineQueued(true);
        return {
          success: true,
          queued: true,
          count: queuedCount,
        };
      } catch (error) {
        clientLogger.error("[useOfflineSync] Assessment enqueue failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        setIsOfflineQueued(false);
        throw error;
      }
    },
    [],
  );

  /**
   * Log chat message with offline support
   */
  const logChatMessageWithSync = useCallback(
    async (payload: ChatMessagePayload) => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          return { success: false, error: "Use TutorService when online" };
        }

        const queueId = await enqueueChatMessage(payload);
        setIsOfflineQueued(Boolean(queueId));

        return {
          success: true,
          queued: Boolean(queueId),
          queueId,
        };
      } catch (error) {
        clientLogger.error("[useOfflineSync] Chat message enqueue failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        setIsOfflineQueued(false);
        throw error;
      }
    },
    [],
  );

  /**
   * Award points with offline support
   */
  const awardPointsWithSync = useCallback(
    async (payload: PointsAwardPayload) => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          return {
            success: false,
            error: "Use GamificationService when online",
          };
        }

        const queueId = await enqueuePointsAward(payload);
        setIsOfflineQueued(Boolean(queueId));

        return {
          success: true,
          queued: Boolean(queueId),
          queueId,
        };
      } catch (error) {
        clientLogger.error("[useOfflineSync] Points award enqueue failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        setIsOfflineQueued(false);
        throw error;
      }
    },
    [],
  );

  /**
   * Update progress with offline support
   */
  const updateProgressWithSync = useCallback(
    async (payload: ProgressUpdatePayload) => {
      try {
        if (typeof navigator !== "undefined" && navigator.onLine) {
          return { success: false, error: "Use AdaptiveService when online" };
        }

        const queueId = await enqueueProgressUpdate(payload);
        setIsOfflineQueued(Boolean(queueId));

        return {
          success: true,
          queued: Boolean(queueId),
          queueId,
        };
      } catch (error) {
        clientLogger.error("[useOfflineSync] Progress update enqueue failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        setIsOfflineQueued(false);
        throw error;
      }
    },
    [],
  );

  return {
    // State
    isOfflineQueued,
    queueStatus,

    // Methods
    submitAssessmentWithSync,
    logChatMessageWithSync,
    awardPointsWithSync,
    updateProgressWithSync,
    subscribeToQueue,
  };
}
