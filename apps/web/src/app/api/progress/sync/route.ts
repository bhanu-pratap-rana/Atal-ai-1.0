/**
 * Progress Sync API
 *
 * Syncs offline progress to the server.
 * Handles lesson completions, quiz submissions, and progress updates.
 *
 * POST /api/progress/sync
 * Body: { items: SyncItem[] }
 * Returns: SyncResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { authenticateAndRateLimit, validateRequestBody } from "@/lib/api-utils";
import { updateProgressAtomically, recordPoints } from "@/lib/database/progress-utils";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Points awarded for each sync event type */
const SYNC_POINTS = {
  LESSON_COMPLETE: 10,
  QUIZ_BASE: 5,
  QUIZ_PASSING_BONUS: 5,
  QUIZ_PERFECT_BONUS: 5,
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface SyncItem {
  type: "lesson_complete" | "quiz_submit" | "progress_update";
  data: Record<string, unknown>;
  timestamp: string;
  idempotencyKey?: string;
}

interface SyncResponse {
  synced: number;
  failed: Array<{ index: number; error: string }>;
  pointsAwarded: number;
  badgesEarned: Array<{ id: string; name: string }>;
}

// ============================================================================
// VALIDATION
// ============================================================================

// Module/Topic IDs are TEXT (e.g., "M1", "T1.1"), not UUIDs
// SEC-14 FIX: Require uppercase first letter to match standard module ID format
const ModuleIdSchema = z.string().regex(/^[A-Z][A-Za-z0-9]{0,9}$/, "Invalid module ID");
// VAL-3 FIX: Match lesson/download topicId pattern (uppercase first, allow dots, up to 20 chars)
const TopicIdSchema = z.string().regex(/^[A-Z][A-Za-z0-9.]{0,19}$/, "Invalid topic ID format");

// SEC-006 FIX: Specific data schemas for each sync type instead of loose Record<string, unknown>
const LessonCompleteDataSchema = z.object({
  topicId: TopicIdSchema,
  moduleId: ModuleIdSchema,
  score: z.number().min(0).max(100).optional().default(0),
  completedAt: z.string().datetime().optional(),
});

const QuizSubmitDataSchema = z.object({
  topicId: TopicIdSchema,
  moduleId: ModuleIdSchema,
  score: z.number().min(0).max(100),
  completedAt: z.string().datetime().optional(),
});

const ProgressUpdateDataSchema = z.object({
  topicId: TopicIdSchema,
  moduleId: ModuleIdSchema,
  masteryScore: z.number().min(0).max(100).optional(),
  status: z.enum(["not_started", "in_progress", "mastered"]).optional(),
});

const SyncItemSchema = z.object({
  type: z.enum(["lesson_complete", "quiz_submit", "progress_update"]),
  data: z.record(z.unknown()),
  timestamp: z.string(),
  // ERR-004 FIX: Validate idempotency key format when provided
  idempotencyKey: z.string().uuid("Invalid idempotency key format").optional(),
});

/**
 * SEC-006 FIX: Validate sync item data based on type
 */
function validateSyncItemData(item: z.infer<typeof SyncItemSchema>):
  | { valid: true; data: z.infer<typeof LessonCompleteDataSchema> | z.infer<typeof QuizSubmitDataSchema> | z.infer<typeof ProgressUpdateDataSchema> }
  | { valid: false; error: string } {
  switch (item.type) {
    case "lesson_complete": {
      const result = LessonCompleteDataSchema.safeParse(item.data);
      if (!result.success) {
        return { valid: false, error: `Invalid lesson data: ${result.error.issues[0]?.message || "unknown"}` };
      }
      return { valid: true, data: result.data };
    }
    case "quiz_submit": {
      const result = QuizSubmitDataSchema.safeParse(item.data);
      if (!result.success) {
        return { valid: false, error: `Invalid quiz data: ${result.error.issues[0]?.message || "unknown"}` };
      }
      return { valid: true, data: result.data };
    }
    case "progress_update": {
      const result = ProgressUpdateDataSchema.safeParse(item.data);
      if (!result.success) {
        return { valid: false, error: `Invalid progress data: ${result.error.issues[0]?.message || "unknown"}` };
      }
      return { valid: true, data: result.data };
    }
    default:
      return { valid: false, error: "Unknown sync type" };
  }
}

const SyncRequestSchema = z.object({
  items: z.array(SyncItemSchema).min(1).max(100),
});

// ============================================================================
// SYNC HANDLERS
// ============================================================================

async function handleLessonComplete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: z.infer<typeof LessonCompleteDataSchema>,
): Promise<{ pointsAwarded: number }> {
  const { topicId, moduleId, score } = data;
  const pointsAwarded = SYNC_POINTS.LESSON_COMPLETE;

  // Use allSettled: progress is critical, points are non-critical
  const [progressResult, pointsResult] = await Promise.allSettled([
    updateProgressAtomically(supabase, userId, moduleId, topicId, score),
    recordPoints(supabase, userId, pointsAwarded, "lesson", `Completed lesson ${topicId}`),
  ]);

  if (progressResult.status === "rejected") {
    throw progressResult.reason;
  }
  if (pointsResult.status === "rejected") {
    authLogger.warn("[sync] Points recording failed (non-critical):", {
      error: pointsResult.reason instanceof Error ? pointsResult.reason.message : String(pointsResult.reason),
    });
  }

  return { pointsAwarded };
}

async function handleQuizSubmit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: z.infer<typeof QuizSubmitDataSchema>,
): Promise<{ pointsAwarded: number }> {
  const { topicId, moduleId, score } = data;

  let pointsAwarded = SYNC_POINTS.QUIZ_BASE;
  if (score >= MASTERY_THRESHOLDS.PASSING) pointsAwarded += SYNC_POINTS.QUIZ_PASSING_BONUS;
  if (score === MASTERY_THRESHOLDS.PERFECT) pointsAwarded += SYNC_POINTS.QUIZ_PERFECT_BONUS;

  // Use allSettled: progress is critical, points are non-critical
  const [progressResult, pointsResult] = await Promise.allSettled([
    updateProgressAtomically(supabase, userId, moduleId, topicId, score),
    recordPoints(supabase, userId, pointsAwarded, "question", `Quiz score ${score}% for ${topicId}`),
  ]);

  if (progressResult.status === "rejected") {
    throw progressResult.reason;
  }
  if (pointsResult.status === "rejected") {
    authLogger.warn("[sync] Points recording failed (non-critical):", {
      error: pointsResult.reason instanceof Error ? pointsResult.reason.message : String(pointsResult.reason),
    });
  }

  return { pointsAwarded };
}

async function handleProgressUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: z.infer<typeof ProgressUpdateDataSchema>,
): Promise<{ pointsAwarded: number }> {
  const { topicId, moduleId, masteryScore } = data;
  await updateProgressAtomically(supabase, userId, moduleId, topicId, masteryScore ?? 0);
  return { pointsAwarded: 0 };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // DUP-1: Shared auth + rate limit check
    const authResult = await authenticateAndRateLimit(
      (userId) => `sync:${userId}`,
      RATE_LIMITS.progressSync,
    );
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // DUP-2: Shared request body validation
    const body = await request.json();
    const bodyResult = validateRequestBody(body, SyncRequestSchema);
    if (bodyResult instanceof NextResponse) return bodyResult;

    const { items } = bodyResult.data;
    const supabase = await createClient();
    const userId = user.id; // Capture user ID for use in closure

    // PERF-001 FIX: Batch process sync items using Promise.allSettled
    // Previously: Sequential loop with 3 queries per item (N+1 pattern)
    // Now: Parallel batch processing for significant latency reduction

    // Helper function to process a single sync item
    async function processSyncItem(
      item: SyncItem,
      index: number,
    ): Promise<{ index: number; pointsAwarded: number; skipped: boolean }> {
      // Check for idempotency (prevent duplicate processing)
      if (item.idempotencyKey) {
        const { data: existing } = await supabase
          .from("sync_log")
          .select("id")
          .eq("idempotency_key", item.idempotencyKey)
          .maybeSingle();

        if (existing) {
          // Already processed, skip but count as success
          return { index, pointsAwarded: 0, skipped: true };
        }
      }

      // SEC-006 FIX: Validate data before processing
      const dataValidation = validateSyncItemData(item);
      if (!dataValidation.valid) {
        throw new Error(dataValidation.error);
      }

      // Process based on type with validated data
      let result: { pointsAwarded: number };

      switch (item.type) {
        case "lesson_complete":
          result = await handleLessonComplete(
            supabase,
            userId,
            dataValidation.data as z.infer<typeof LessonCompleteDataSchema>,
          );
          break;
        case "quiz_submit":
          result = await handleQuizSubmit(
            supabase,
            userId,
            dataValidation.data as z.infer<typeof QuizSubmitDataSchema>,
          );
          break;
        case "progress_update":
          result = await handleProgressUpdate(
            supabase,
            userId,
            dataValidation.data as z.infer<typeof ProgressUpdateDataSchema>,
          );
          break;
        default:
          throw new Error(`Unknown sync type: ${item.type}`);
      }

      // Log successful sync (for idempotency) - non-critical, fire and forget
      if (item.idempotencyKey) {
        // BUG-021 FIX: Log errors from fire-and-forget for observability
        // Wrap in Promise.resolve() to get a full Promise with .catch()
        void Promise.resolve(
          supabase
            .from("sync_log")
            .insert({
              student_id: userId,
              idempotency_key: item.idempotencyKey,
              sync_type: item.type,
              synced_at: new Date().toISOString(),
            })
        ).then(({ error }) => {
          if (error) authLogger.warn("[sync] Failed to write sync_log:", { error: error.message });
        }).catch((err: unknown) => {
          authLogger.warn("[sync] sync_log insert rejected:", { error: err instanceof Error ? err.message : String(err) });
        });
      }

      return { index, pointsAwarded: result.pointsAwarded, skipped: false };
    }

    // Process all items in parallel batches
    const results = await Promise.allSettled(
      items.map((item, index) => processSyncItem(item, index)),
    );

    // Aggregate results
    const failed: Array<{ index: number; error: string }> = [];
    let totalPointsAwarded = 0;
    let synced = 0;

    // BUG-006 FIX: Use forEach with index instead of for...of with indexOf
    // indexOf finds the FIRST match which gives wrong index when multiple items fail
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        synced++;
        if (!result.value.skipped) {
          totalPointsAwarded += result.value.pointsAwarded;
        }
      } else {
        const errorMessage =
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown error";
        failed.push({
          index, // Use the actual loop index, not indexOf
          error: errorMessage,
        });
      }
    });

    // Check for new badges (simplified - actual implementation would use gamification service)
    const badgesEarned: Array<{ id: string; name: string }> = [];

    const response: SyncResponse = {
      synced,
      failed,
      pointsAwarded: totalPointsAwarded,
      badgesEarned,
    };

    return NextResponse.json(response);
  } catch (error) {
    authLogger.error("[/api/progress/sync] Error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 },
    );
  }
}
