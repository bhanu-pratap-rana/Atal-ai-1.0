import { NextRequest, NextResponse } from "next/server";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { isTeacherOrHigher } from "@/lib/auth/role-utils";

// Type definitions for API responses
// Note: Phone number intentionally excluded for privacy (minors' PII)
export interface Student {
  id: string;
  name: string;
  rollNumber: string | null;
}

export interface SearchStudentsSuccessResponse {
  students: Student[];
}

export interface ErrorResponse {
  error: string;
}

export type SearchStudentsResponse =
  | SearchStudentsSuccessResponse
  | ErrorResponse;

// Use centralized rate limit
const SEARCH_RATE_LIMIT = RATE_LIMITS.studentSearch;

/**
 * Helper: Verify teacher authorization
 */
async function verifyTeacherAuthorization(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<
  { authorized: true } | { authorized: false; status: number; error: string }
> {
  if (!user) {
    return { authorized: false, status: 401, error: "Not authenticated" };
  }

  const hasTeacherOrHigherRole = isTeacherOrHigher(user.app_metadata?.role);

  if (!hasTeacherOrHigherRole) {
    const { data: teacherProfile } = await supabase
      .from("teacher_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!teacherProfile) {
      authLogger.warn(
        "[searchStudents] Non-teacher attempted to search students",
        {
          userId: user.id,
          role: user.app_metadata?.role,
        },
      );
      return {
        authorized: false,
        status: 403,
        error: "Only teachers and administrators can search for students",
      };
    }
  }

  return { authorized: true };
}

/**
 * Helper: Validate and sanitize search query
 */
function validateSearchQuery(
  query: unknown,
):
  | { valid: true; query: string }
  | { valid: false; status: number; error: string } {
  if (!query || typeof query !== "string") {
    return {
      valid: false,
      status: 400,
      error: "Invalid query parameter",
    };
  }

  const sanitizedQuery = query.trim().slice(0, 50);

  if (sanitizedQuery.length === 0) {
    return {
      valid: false,
      status: 400,
      error: "Query is required and must not be empty",
    };
  }

  return { valid: true, query: sanitizedQuery };
}

/**
 * Helper: Get teacher's class IDs for fallback search
 */
async function getTeacherClassIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<
  | { success: true; classIds: string[] }
  | { success: false; status: number; error: string }
> {
  const { data: teacherClasses, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", userId);

  if (classError) {
    authLogger.error(
      "[searchStudents] Failed to fetch teacher classes",
      classError,
    );
    return {
      success: false,
      status: 500,
      error: "Failed to search students",
    };
  }

  const classIds = (teacherClasses || []).map((c) => c.id);

  if (classIds.length === 0) {
    return { success: true, classIds: [] };
  }

  return { success: true, classIds };
}

/**
 * Helper: Get student IDs from enrollments
 */
async function getStudentIdsFromEnrollments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  classIds: string[],
): Promise<
  | { success: true; studentIds: string[] }
  | { success: false; status: number; error: string }
> {
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("student_id")
    .in("class_id", classIds);

  if (enrollmentError) {
    authLogger.error(
      "[searchStudents] Failed to fetch enrollments",
      enrollmentError,
    );
    return {
      success: false,
      status: 500,
      error: "Failed to search students",
    };
  }

  const studentIds = (enrollments || []).map((e) => e.student_id);
  return { success: true, studentIds };
}

/**
 * Helper: Build safe filter for student search
 */
function buildSafeFilter(field: string, pattern: string): string | null {
  // Validate pattern contains only safe characters
  if (!/^[%_a-zA-Z0-9\s-]+$/.test(pattern)) {
    authLogger.warn("[searchStudents] Invalid filter pattern rejected", { field });
    return null;
  }
  return `${field}.ilike.${pattern}`;
}

/**
 * Helper: Fallback search when RPC fails
 */
async function fallbackStudentSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  sanitizedQuery: string,
): Promise<
  | { success: true; students: Student[] }
  | { success: false; status: number; error: string }
> {
  const classResult = await getTeacherClassIds(supabase, userId);
  if (!classResult.success) {
    return classResult;
  }

  if (classResult.classIds.length === 0) {
    return { success: true, students: [] };
  }

  const enrollmentResult = await getStudentIdsFromEnrollments(
    supabase,
    classResult.classIds,
  );
  if (!enrollmentResult.success) {
    return enrollmentResult;
  }

  if (enrollmentResult.studentIds.length === 0) {
    return { success: true, students: [] };
  }

  const searchPattern = `%${sanitizedQuery}%`;
  const nameFilter = buildSafeFilter("name", searchPattern);
  const rollFilter = buildSafeFilter("roll_number", searchPattern);

  // Build filter from non-null results only
  const filters = [nameFilter, rollFilter].filter(Boolean);
  if (filters.length === 0) {
    return {
      success: false,
      status: 400,
      error: "Invalid search query",
    };
  }

  // Note: Phone excluded for privacy - only fetch needed fields
  const { data: studentProfiles, error: searchError } = await supabase
    .from("student_profiles")
    .select("user_id, name, roll_number")
    .in("user_id", enrollmentResult.studentIds)
    .or(filters.join(","))
    .limit(10);

  if (searchError) {
    authLogger.error("[searchStudents] Fallback search failed", searchError);
    return {
      success: false,
      status: 500,
      error: "Failed to search students",
    };
  }

  const students: Student[] = (studentProfiles || []).map((profile) => ({
    id: profile.user_id,
    name: profile.name,
    rollNumber: profile.roll_number,
  }));

  return { success: true, students };
}

/**
 * Search students API route (refactored to reduce cognitive complexity)
 * CRITICAL FIX: Reduced complexity from 23 to <15 by extracting helper functions
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const authCheck = await verifyTeacherAuthorization(supabase, user);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status },
      );
    }

    const isAllowed = await checkRateLimit(
      `search-students:${user.id}`,
      SEARCH_RATE_LIMIT,
    );
    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            "Too many search requests. Please wait a moment before trying again.",
        },
        { status: 429 },
      );
    }

    const { query } = await request.json();
    const queryValidation = validateSearchQuery(query);
    if (!queryValidation.valid) {
      return NextResponse.json(
        { error: queryValidation.error },
        { status: queryValidation.status },
      );
    }

    const { data: studentProfiles, error } = await supabase.rpc(
      "search_students_for_teacher",
      {
        p_search_query: queryValidation.query,
        p_limit: 10,
      },
    );

    if (error) {
      authLogger.warn(
        "[searchStudents] RPC failed, falling back to restricted query",
        error,
      );
      const fallbackResult = await fallbackStudentSearch(
        supabase,
        user.id,
        queryValidation.query,
      );
      if (!fallbackResult.success) {
        return NextResponse.json(
          { error: fallbackResult.error },
          { status: fallbackResult.status },
        );
      }
      // Cache search results for 10 minutes (private - teacher-specific)
      return NextResponse.json({ students: fallbackResult.students }, {
        headers: {
          "Cache-Control": "private, max-age=600, stale-while-revalidate=60",
        },
      });
    }

    // Note: Phone excluded for privacy - minors' PII should not be exposed
    const students: Student[] = (studentProfiles || []).map(
      (profile: {
        user_id: string;
        name: string | null;
        roll_number: string | null;
        class_name: string | null;
      }) => ({
        id: profile.user_id,
        name: profile.name || "Unknown",
        rollNumber: profile.roll_number || null,
      }),
    );

    // Cache search results for 10 minutes (private - teacher-specific)
    return NextResponse.json({ students }, {
      headers: {
        "Cache-Control": "private, max-age=600, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    authLogger.error("[searchStudents] Unexpected error", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
