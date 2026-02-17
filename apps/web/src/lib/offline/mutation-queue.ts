/**
 * Offline Mutation Queue Helpers
 *
 * Provides client-side wrappers for server mutations with automatic
 * offline queueing when connection is unavailable.
 *
 * Usage:
 * ```tsx
 * // Try to submit assessment, queue if offline
 * await enqueueAssessmentResponse(responseData);
 *
 * // Try to log AI interaction, queue if offline
 * await enqueueChatMessage(interactionData);
 *
 * // Try to award points, queue if offline
 * await enqueuePointsAward(pointsData);
 *
 * // Try to update knowledge state, queue if offline
 * await enqueueProgressUpdate(stateData);
 * ```
 */

import { syncQueue } from "./sync-queue";
import { clientLogger } from "@/lib/client-logger";
import { validateMutationQueuePayload } from "@/lib/validation/rpc-schemas";

/**
 * Assessment response data structure
 */
export interface AssessmentResponsePayload {
  session_id: string;
  item_id: string;
  module: string;
  is_correct: boolean;
  rt_ms: number;
  focus_blur_count: number;
  chosen_option: string;
}

/**
 * AI chat interaction data structure
 */
export interface ChatMessagePayload {
  student_id: string;
  session_id: string;
  topic_id?: string;
  message_content: string;
  message_role: "user" | "assistant";
  input_mode: "text" | "voice";
  language: "en" | "hi" | "as";
  tokens_used?: number;
  created_at?: string;
}

/**
 * Points award data structure
 */
export interface PointsAwardPayload {
  student_id: string;
  points: number;
  source: string;
  description?: string;
  created_at?: string;
}

/**
 * Knowledge state update data structure
 */
export interface ProgressUpdatePayload {
  student_id: string;
  topic_id: string;
  module_id: string;
  mastery_score: number;
  confidence_level: "low" | "medium" | "high";
  attempts: number;
  time_spent_seconds: number;
  last_attempt_at?: string;
  status: "not_started" | "in_progress" | "mastered";
}

/**
 * Enqueue assessment response for offline support
 *
 * @param payload Assessment response data
 * @returns Queue ID if offline, null if online and already processed
 */
export async function enqueueAssessmentResponse(
  payload: AssessmentResponsePayload,
): Promise<number | undefined> {
  try {
    // Check if online - if online, mutation should be handled by server action
    if (typeof navigator !== "undefined" && navigator.onLine) {
      clientLogger.debug(
        "[MutationQueue] Online - assessment response should use server action",
      );
      return undefined;
    }

    // Offline: enqueue for later sync
    clientLogger.info(
      "[MutationQueue] Offline - queueing assessment response",
      {
        sessionId: payload.session_id,
        itemId: payload.item_id,
      },
    );

    // Validate payload before enqueueing
    const validatedPayload = validateMutationQueuePayload(payload);
    const id = await syncQueue.enqueue("assessment_submit", validatedPayload);
    clientLogger.info("[MutationQueue] Assessment response queued", {
      queueId: id,
    });
    return id;
  } catch (error) {
    clientLogger.error(
      "[MutationQueue] Failed to enqueue assessment response",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    throw error;
  }
}

/**
 * Enqueue AI chat message for offline support
 *
 * @param payload Chat message data
 * @returns Queue ID if offline, null if online and already processed
 */
export async function enqueueChatMessage(
  payload: ChatMessagePayload,
): Promise<number | undefined> {
  try {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      clientLogger.debug(
        "[MutationQueue] Online - chat message should use TutorService",
      );
      return undefined;
    }

    // Offline: enqueue for later sync
    clientLogger.info("[MutationQueue] Offline - queueing chat message", {
      studentId: payload.student_id,
      sessionId: payload.session_id,
    });

    // Validate payload before enqueueing
    const validatedPayload = validateMutationQueuePayload(payload);
    const id = await syncQueue.enqueue("chat_message", validatedPayload);
    clientLogger.info("[MutationQueue] Chat message queued", { queueId: id });
    return id;
  } catch (error) {
    clientLogger.error("[MutationQueue] Failed to enqueue chat message", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Enqueue points award for offline support
 *
 * @param payload Points award data
 * @returns Queue ID if offline, null if online and already processed
 */
export async function enqueuePointsAward(
  payload: PointsAwardPayload,
): Promise<number | undefined> {
  try {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      clientLogger.debug(
        "[MutationQueue] Online - points award should use GamificationService",
      );
      return undefined;
    }

    // Offline: enqueue for later sync
    clientLogger.info("[MutationQueue] Offline - queueing points award", {
      studentId: payload.student_id,
      points: payload.points,
      source: payload.source,
    });

    // Validate payload before enqueueing
    const validatedPayload = validateMutationQueuePayload(payload);
    const id = await syncQueue.enqueue("points_award", validatedPayload);
    clientLogger.info("[MutationQueue] Points award queued", { queueId: id });
    return id;
  } catch (error) {
    clientLogger.error("[MutationQueue] Failed to enqueue points award", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Enqueue knowledge state update for offline support
 *
 * @param payload Knowledge state data
 * @returns Queue ID if offline, null if online and already processed
 */
export async function enqueueProgressUpdate(
  payload: ProgressUpdatePayload,
): Promise<number | undefined> {
  try {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      clientLogger.debug(
        "[MutationQueue] Online - progress update should use AdaptiveService",
      );
      return undefined;
    }

    // Offline: enqueue for later sync
    clientLogger.info("[MutationQueue] Offline - queueing progress update", {
      studentId: payload.student_id,
      topicId: payload.topic_id,
    });

    // Validate payload before enqueueing
    const validatedPayload = validateMutationQueuePayload(payload);
    const id = await syncQueue.enqueue("progress_update", validatedPayload);
    clientLogger.info("[MutationQueue] Progress update queued", {
      queueId: id,
    });
    return id;
  } catch (error) {
    clientLogger.error("[MutationQueue] Failed to enqueue progress update", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get current sync queue status
 *
 * @returns Sync queue status with pending/failed counts
 */
export async function getMutationQueueStatus() {
  try {
    return await syncQueue.getStatus();
  } catch (error) {
    clientLogger.error("[MutationQueue] Failed to get queue status", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      pendingCount: 0,
      failedCount: 0,
      isSyncing: false,
      lastSyncAt: null,
      lastError: null,
    };
  }
}

/**
 * Manually trigger sync of queued mutations
 *
 * @param onProgress Optional callback for progress updates
 * @returns Sync result with counts of successful/failed items
 */
export async function triggerMutationSync(
  onProgress?: (current: number, total: number) => void,
) {
  try {
    clientLogger.info("[MutationQueue] Triggering manual sync");
    const result = await syncQueue.manualSync(onProgress);
    clientLogger.info("[MutationQueue] Manual sync complete", {
      success: result.success,
      failed: result.failed,
      pending: result.pending,
    });
    return result;
  } catch (error) {
    clientLogger.error("[MutationQueue] Manual sync failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Subscribe to mutation queue status changes
 *
 * @param callback Function called when status changes
 * @returns Unsubscribe function
 */
export function subscribeMutationQueue(
  callback: (status: {
    pendingCount: number;
    failedCount: number;
    isSyncing: boolean;
    lastSyncAt: number | null;
    lastError: string | null;
  }) => void,
): () => void {
  return syncQueue.subscribe(callback);
}
