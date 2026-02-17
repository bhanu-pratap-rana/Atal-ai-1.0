/**
 * Activity tracking and aggregation
 * Handles recent activity history and engagement tracking
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { authLogger } from "@/lib/auth-logger";

export interface RecentActivity {
  id: string;
  type: "assessment" | "class_join" | "achievement";
  title: string;
  description: string;
  timestamp: string;
  score?: number;
}

/**
 * Helper: Build responses map by session
 * Used for activity tracking lookups
 */
function buildResponsesBySession(
  responses: Array<{ session_id: string; is_correct: boolean }>,
): Map<string, Array<{ is_correct: boolean }>> {
  const responsesBySession = new Map<string, Array<{ is_correct: boolean }>>();
  for (const response of responses) {
    if (!responsesBySession.has(response.session_id)) {
      responsesBySession.set(response.session_id, []);
    }
    const sessionResponses = responsesBySession.get(response.session_id);
    if (sessionResponses) {
      sessionResponses.push({ is_correct: response.is_correct });
    }
  }
  return responsesBySession;
}

/**
 * Helper: Get assessment activities from sessions
 */
async function getAssessmentActivities(
  supabase: SupabaseClient,
  userId: string,
): Promise<RecentActivity[]> {
  const { data: sessions, error: sessionError } = await supabase
    .from("assessment_sessions")
    .select("id, started_at, submitted_at")
    .eq("user_id", userId)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(5);

  if (sessionError) {
    authLogger.error(
      "[getRecentActivity] Failed to fetch sessions",
      sessionError,
    );
    return [];
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map(
    (s: { id: string; started_at?: string; submitted_at?: string }) => s.id,
  );
  const { data: allResponses, error: responseError } = await supabase
    .from("assessment_responses")
    .select("session_id, is_correct")
    .in("session_id", sessionIds)
    .limit(2500);

  if (responseError) {
    authLogger.error(
      "[getRecentActivity] Failed to fetch responses",
      responseError,
    );
  }

  const responsesBySession = buildResponsesBySession(allResponses || []);
  const activities: RecentActivity[] = [];

  for (const session of sessions) {
    const responses = responsesBySession.get(session.id) || [];
    const total = responses.length;
    const correct = responses.filter((r) => r.is_correct).length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    activities.push({
      id: session.id,
      type: "assessment",
      title: "Completed Assessment",
      description: `Scored ${score}% (${correct}/${total} correct)`,
      timestamp: session.submitted_at || session.started_at,
      score,
    });
  }

  return activities;
}

/**
 * Helper: Get class join activities for students
 */
async function getClassJoinActivities(
  supabase: SupabaseClient,
  userId: string,
): Promise<RecentActivity[]> {
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      enrolled_at,
      classes (name)
    `,
    )
    .eq("student_id", userId)
    .order("enrolled_at", { ascending: false })
    .limit(3);

  if (!enrollments) {
    return [];
  }

  const activities: RecentActivity[] = [];
  for (const enrollment of enrollments) {
    // Extract class name safely - S4619: use Object.hasOwn for property check
    const classes = enrollment.classes;
    let className = "Unknown Class";
    if (classes && typeof classes === "object" && !Array.isArray(classes)) {
      const classObj = classes as Record<string, unknown>;
      if (Object.hasOwn(classObj, "name") && typeof classObj.name === "string") {
        className = classObj.name;
      }
    }
    activities.push({
      id: enrollment.id,
      type: "class_join",
      title: "Joined Class",
      description: className,
      timestamp: enrollment.enrolled_at,
    });
  }

  return activities;
}

/**
 * Get recent activity for the user
 * CRITICAL FIX: Reduced complexity from 31 to <15 by extracting helper functions
 */
export async function getRecentActivity(
  supabase: SupabaseClient,
  userId: string,
  isTeacher: boolean,
): Promise<RecentActivity[]> {
  try {
    const [assessmentActivities, classJoinActivities] = await Promise.all([
      getAssessmentActivities(supabase, userId),
      isTeacher
        ? Promise.resolve([])
        : getClassJoinActivities(supabase, userId),
    ]);

    const allActivities = [...assessmentActivities, ...classJoinActivities];
    allActivities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return allActivities.slice(0, 5);
  } catch (error) {
    authLogger.error(
      "[getRecentActivity] Error fetching recent activity",
      error,
    );
    return [];
  }
}
