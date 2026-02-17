"use server";

import { z } from "zod";
import {
  createClient,
  verifyClassOwnership,
  verifyTeacherAuth,
} from "@/lib/supabase-server";
import { ANALYTICS_WINDOW_DAYS } from "@/lib/constants/analytics";
import { ClassIdSchema } from "@/lib/validation-schemas";
import { authLogger } from "@/lib/auth-logger";
import { handleZodError } from "@/lib/action-error-handler";

/**
 * Helper: Verify class ownership for analytics
 */
async function verifyClassOwnershipForAnalytics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const { data: classData, error: classDataError } = await supabase
    .from("classes")
    .select("teacher_id")
    .eq("id", classId)
    .maybeSingle();

  if (classDataError || classData?.teacher_id !== userId) {
    authLogger.warn(
      "[getClassAnalytics] Access denied: Class no longer owned by user",
      {
        userId,
        classId,
      },
    );
    return { success: false, error: "You do not own this class" };
  }

  return { success: true };
}

/**
 * Helper: Get enrolled student IDs for a class.
 * Shared by all analytics helpers.
 */
async function getEnrolledStudentIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
): Promise<
  { success: true; studentIds: string[] } | { success: false; error: string }
> {
  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("class_id", classId);

  if (enrollmentError) {
    return { success: false, error: "Failed to fetch enrolled students" };
  }

  return { success: true, studentIds: (enrollmentData || []).map((e) => e.student_id) };
}

/**
 * Type for progress data returned by get_class_student_progress RPC
 */
interface ProgressItem {
  student_id: string;
  topics_total: number;
  topics_mastered: number;
  avg_mastery_score: number;
  last_activity: string | null;
}

/**
 * Helper: Calculate active users this week from pre-fetched progress data.
 * Counts students with last_activity >= sevenDaysAgo.
 */
function calculateActiveUsersThisWeek(
  progressData: ProgressItem[],
  sevenDaysAgo: Date,
): number {
  const cutoff = sevenDaysAgo.toISOString();
  let activeCount = 0;
  for (const p of progressData) {
    if (p.last_activity && p.last_activity >= cutoff) {
      activeCount++;
    }
  }
  return activeCount;
}

/**
 * Helper: Calculate average minutes per day.
 * Queries assessment_sessions for enrolled students (by user_id, not class_id)
 * since assessment_sessions.class_id is often NULL.
 */
async function calculateAverageMinutesPerDay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentIds: string[],
  sevenDaysAgo: Date,
): Promise<
  { success: true; avgMinutes: number } | { success: false; error: string }
> {
  if (studentIds.length === 0) return { success: true, avgMinutes: 0 };

  // Get assessment sessions for enrolled students in the last 7 days
  const { data: userSessions, error: userSessionsError } = await supabase
    .from("assessment_sessions")
    .select("id, user_id")
    .in("user_id", studentIds)
    .gte("started_at", sevenDaysAgo.toISOString())
    .not("submitted_at", "is", null)
    .limit(10000);

  if (userSessionsError) {
    return { success: false, error: "Failed to fetch user sessions" };
  }

  if (!userSessions || userSessions.length === 0) {
    return { success: true, avgMinutes: 0 };
  }

  const sessionIds = userSessions.map((s) => s.id);
  const { data: responses, error: responsesError } = await supabase
    .from("assessment_responses")
    .select("session_id, rt_ms")
    .in("session_id", sessionIds);

  if (responsesError) {
    return { success: false, error: "Failed to fetch assessment responses" };
  }

  // Sum response times per user
  const sessionUserMap = new Map(userSessions.map((s) => [s.id, s.user_id]));
  const userTimes = new Map<string, number>();

  for (const r of responses || []) {
    const userId = sessionUserMap.get(r.session_id);
    if (userId && r.rt_ms) {
      userTimes.set(userId, (userTimes.get(userId) || 0) + r.rt_ms);
    }
  }

  const totalMinutes = Array.from(userTimes.values()).reduce(
    (sum, ms) => sum + ms / 60000,
    0,
  );

  const avgMinutes =
    userTimes.size > 0
      ? totalMinutes / userTimes.size / ANALYTICS_WINDOW_DAYS
      : 0;

  return { success: true, avgMinutes };
}

/**
 * Helper: Calculate at-risk student count from pre-fetched progress data.
 * Uses mastery-based criteria: students with avg mastery < 40% who have started learning.
 * This aligns with the StudentProgressGrid at-risk indicator.
 */
function calculateAtRiskCount(progressData: ProgressItem[]): number {
  let atRiskCount = 0;
  for (const progress of progressData) {
    const avgMastery = progress.avg_mastery_score || 0;
    const totalTopics = progress.topics_total || 0;
    if (avgMastery < 40 && totalTopics > 0) {
      atRiskCount++;
    }
  }
  return atRiskCount;
}

/**
 * Get class analytics (refactored to reduce cognitive complexity)
 * CRITICAL FIX: Reduced complexity from 49 to <15 by extracting helper functions
 */
export async function getClassAnalytics(classId: string) {
  try {
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      return handleZodError(error);
    }

    const auth = await verifyClassOwnership(
      "getClassAnalytics",
      validatedClassId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = await createClient();
    const ownershipCheck = await verifyClassOwnershipForAnalytics(
      supabase,
      validatedClassId,
      auth.user.id,
    );
    if (!ownershipCheck.success) {
      return ownershipCheck;
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - ANALYTICS_WINDOW_DAYS);

    // PERF: Fetch enrolled students once (was called 3x before)
    const enrolled = await getEnrolledStudentIds(supabase, validatedClassId);
    if (!enrolled.success) return enrolled;
    if (enrolled.studentIds.length === 0) {
      return {
        success: true,
        data: { activeThisWeek: 0, avgMinutesPerDay: 0, atRiskCount: 0 },
      };
    }

    // PERF: Fetch progress once (was called 2x before) + avg minutes in parallel
    const [progressResult, avgMinutesResult] = await Promise.all([
      supabase.rpc("get_class_student_progress", {
        p_student_ids: enrolled.studentIds,
      }),
      calculateAverageMinutesPerDay(supabase, enrolled.studentIds, sevenDaysAgo),
    ]);

    if (progressResult.error) {
      return { success: false, error: "Failed to fetch student progress" };
    }
    if (!avgMinutesResult.success) {
      return avgMinutesResult;
    }

    const progressData = (progressResult.data || []) as ProgressItem[];

    return {
      success: true,
      data: {
        activeThisWeek: calculateActiveUsersThisWeek(progressData, sevenDaysAgo),
        avgMinutesPerDay: Math.round(avgMinutesResult.avgMinutes * 10) / 10,
        atRiskCount: calculateAtRiskCount(progressData),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    authLogger.error("[getClassAnalytics] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Export student progress data for a class
 * Returns: Student name, progress percentage, mastery score, last activity
 */
export async function exportStudentProgress(classId: string) {
  try {
    const auth = await verifyTeacherAuth("exportStudentProgress");
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = await createClient();

    // Verify class ownership
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .maybeSingle();

    if (classError || !classData) {
      return { success: false, error: "Class not found" };
    }

    if (classData.teacher_id !== auth.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get enrolled students with profile info
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("student_id, student_profiles!inner(name, roll_number)")
      .eq("class_id", classId);

    if (enrollmentError) {
      return { success: false, error: "Failed to fetch student data" };
    }

    const studentIds = (enrollmentData || []).map((e) => e.student_id);

    if (studentIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get aggregated progress from existing RPC
    const { data: progressData, error: progressError } = await supabase.rpc(
      "get_class_student_progress",
      { p_student_ids: studentIds },
    );

    if (progressError) {
      return { success: false, error: "Failed to fetch progress data" };
    }

    // Build lookup maps (reuses module-level ProgressItem interface)
    const progressMap = new Map<string, ProgressItem>(
      (progressData || []).map((p: ProgressItem) => [p.student_id, p]),
    );
    const profileMap = new Map(
      (enrollmentData || []).map((e) => {
        const rawProfile = e.student_profiles as unknown;
        const profile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as { name: string; roll_number?: string } | null;
        return [e.student_id, profile];
      }),
    );

    // Format for export
    const exportData = studentIds.map((studentId: string) => {
      const profile = profileMap.get(studentId);
      const state = progressMap.get(studentId);

      // Sanitize user-generated content to prevent formula injection and XSS
      const sanitizeName = (name: unknown): string => {
        // S6551/S3358: Handle non-string types properly to avoid [object Object]
        let str: string;
        if (typeof name === "string") {
          str = name;
        } else if (typeof name === "number") {
          str = String(name);
        } else {
          str = "Unknown";
        }
        // SECURITY FIX: Comprehensive CSV formula injection prevention
        // Protect against all Excel/CSV injection vectors
        // S7776: Use Set for O(1) lookup instead of Array.includes()
        const dangerousChars = new Set(["=", "+", "-", "@", "\t", "\r", "\n"]);
        const firstChar = str[0] || "";

        // Check for formula injection attempts
        if (dangerousChars.has(firstChar)) {
          // Prefix with single quote to neutralize formula
          return "'" + str.replaceAll('"', '""');
        }

        // Check for hidden formula injection (e.g., "  =cmd")
        const trimmedStr = str.trim();
        if (trimmedStr.length > 0 && dangerousChars.has(trimmedStr[0])) {
          return "'" + str.replaceAll('"', '""');
        }

        // Escape quotes for CSV safety
        return str.replaceAll('"', '""');
      };

      return {
        name: sanitizeName(profile?.name),
        roll_number: profile?.roll_number || "",
        progress_percentage: state
          ? Math.round((state.topics_mastered / (state.topics_total || 1)) * 100)
          : 0,
        mastery_score: state?.avg_mastery_score || 0,
        last_active: state?.last_activity || "Never",
      };
    });

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    authLogger.error("[exportStudentProgress] Error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export data",
    };
  }
}

/**
 * Export AI tutor interactions for a class
 * Returns: Student, topic, message content, role, language, timestamp
 */
export async function exportAIInteractions(
  classId: string,
  limit: number = 500,
) {
  try {
    const auth = await verifyTeacherAuth("exportAIInteractions");
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = await createClient();

    // PERFORMANCE: Run class verification and enrollments query in parallel
    const [classResult, enrollmentsResult] = await Promise.all([
      supabase
        .from("classes")
        .select("teacher_id")
        .eq("id", classId)
        .maybeSingle(),
      supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", classId),
    ]);

    // Verify teacher has access to this class
    if (classResult.error || !classResult.data) {
      return { success: false, error: "Class not found" };
    }

    if (classResult.data.teacher_id !== auth.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check enrollments query result
    if (enrollmentsResult.error) {
      return { success: false, error: "Failed to fetch enrollments" };
    }

    const studentIds = (enrollmentsResult.data || []).map((e) => e.student_id);

    if (studentIds.length === 0) {
      return { success: true, data: [] };
    }

    // Get AI interactions and student names in parallel
    const [interactionsResult, profilesResult] = await Promise.all([
      supabase
        .from("ai_tutor_interactions")
        .select("id, student_id, topic_id, message_content, message_role, language, input_mode, tokens_used, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("student_profiles")
        .select("user_id, name")
        .in("user_id", studentIds),
    ]);

    if (interactionsResult.error) {
      return { success: false, error: "Failed to fetch interactions" };
    }

    // Build name lookup map from student_profiles
    const nameMap = new Map(
      (profilesResult.data || []).map((p) => [p.user_id, p.name]),
    );

    // Format for export
    const exportData = (interactionsResult.data || []).map(
      (interaction) => {
        return {
          student_name: nameMap.get(interaction.student_id) || "Unknown",
          topic_id: interaction.topic_id || "",
          message: interaction.message_content || "",
          role: interaction.message_role || "user",
          language: interaction.language || "en",
          input_mode: interaction.input_mode || "text",
          created_at: interaction.created_at || "",
          tokens_used: interaction.tokens_used || 0,
        };
      },
    );

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    authLogger.error("[exportAIInteractions] Error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export data",
    };
  }
}
