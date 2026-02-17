"use server";

import { createAdminClient } from "@/lib/supabase-server";
import { fetchAllAuthUsers, findAuthUserById, verifyAdminAuthAndRateLimit } from "@/lib/admin-utils";
import { authLogger } from "@/lib/auth-logger";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { queryCache } from "@/lib/cache/query-cache";
import type { SupabaseAuthUser } from "@/types/auth";

/**
 * PERFORMANCE: Batch fetch auth users by IDs using parallel getUserById calls
 * This is O(k) where k is the number of IDs, vs O(n) for fetchAllAuthUsers where n is total users
 * For 50 teachers out of 1000+ total users, this is 20x faster
 */
async function batchFetchAuthUsersByIds(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  userIds: string[],
): Promise<Map<string, SupabaseAuthUser>> {
  const userMap = new Map<string, SupabaseAuthUser>();

  if (userIds.length === 0) return userMap;

  // Use Promise.allSettled for fault tolerance - failed lookups don't break the batch
  const results = await Promise.allSettled(
    userIds.map((id) => findAuthUserById(adminClient, id)),
  );

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      userMap.set(userIds[index], result.value);
    }
  });

  return userMap;
}

export interface DashboardMetrics {
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  activePins: number;
  inactivePins: number;
  totalAdmins: number;
}

export interface SchoolStats {
  schoolId: string;
  schoolName: string;
  districtName: string;
  teacherCount: number;
  studentCount: number;
  pinCount: number;
  activePinCount: number;
}

/**
 * Note: Supabase query results have complex inferred types based on the select clause.
 * Using explicit type assertions in map callbacks for type safety.
 */

/**
 * Internal function to fetch dashboard metrics from database
 * This is wrapped by getDashboardMetrics() with query caching
 */
async function fetchDashboardMetricsFromDB(): Promise<DashboardMetrics> {
  const supabase = await createAdminClient();

  // PERFORMANCE: Run all metric queries in parallel to avoid N+1 query pattern
  // This significantly improves dashboard load time, especially under load
  const [
    { count: schoolCount, error: schoolError },
    { count: profileCount, error: teacherError },
    { count: activePinCount, error: activePinError },
    { data: allCredentials, error: credentialsError },
    { count: studentProfileCount, error: studentError },
    authUsersResult,
  ] = await Promise.all([
    // Query 1: Get school count
    supabase.from("schools").select("*", { count: "exact", head: true }),

    // Query 2: Get teacher count from teacher_profiles table
    supabase
      .from("teacher_profiles")
      .select("*", { count: "exact", head: true }),

    // Query 3: Get active PINs (deleted_at is NULL)
    supabase
      .from("school_staff_credentials")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),

    // Query 4: Get all schools with ANY credential (to calculate schools without PINs)
    supabase
      .from("school_staff_credentials")
      .select("school_id"),

    // Query 5: Get student count from student_profiles table
    supabase
      .from("student_profiles")
      .select("*", { count: "exact", head: true }),

    // Query 6: Get admin count from auth users (async operation)
    (async () => {
      try {
        const authUsers = await fetchAllAuthUsers(supabase);
        return {
          authUsers,
          error: null,
        };
      } catch (error) {
        return {
          authUsers: null,
          error: error,
        };
      }
    })(),
  ]);

  // Check for errors
  if (schoolError) {
    authLogger.error(
      "[getDashboardMetrics] Failed to get school count",
      schoolError,
    );
    throw schoolError;
  }

  if (authUsersResult.error) {
    authLogger.error(
      "[getDashboardMetrics] Failed to fetch auth users for admin count",
      authUsersResult.error,
    );
    throw authUsersResult.error;
  }

  // Extract counts with error handling for individual queries
  let teacherCount = 0;
  if (teacherError) {
    authLogger.error(
      "[getDashboardMetrics] Failed to get teacher count from profiles",
      teacherError,
    );
  } else {
    teacherCount = profileCount || 0;
  }

  let studentCount = 0;
  if (studentError) {
    authLogger.error(
      "[getDashboardMetrics] Failed to get student count from profiles",
      studentError,
    );
  } else {
    studentCount = studentProfileCount || 0;
  }

  const activePins = activePinCount || 0;

  // Calculate schools without PINs: total schools - schools with any credential
  const schoolsWithPINs = new Set(
    (allCredentials || []).map((c: { school_id: string }) => c.school_id),
  ).size;
  const inactivePins = Math.max(0, (schoolCount || 0) - schoolsWithPINs);

  if (activePinError) {
    authLogger.error(
      "[getDashboardMetrics] Failed to get active PIN count",
      activePinError,
    );
  }
  if (credentialsError) {
    authLogger.error(
      "[getDashboardMetrics] Failed to get credentials for inactive PIN count",
      credentialsError,
    );
  }

  // Count admins from auth users
  let adminCount = 0;
  let authTeacherCount = 0;
  const authUsers = authUsersResult.authUsers;
  // TypeScript fix: Use explicit null check instead of non-null assertion
  if (authUsers && authUsers.length > 0) {
    // Count admins (admin or super_admin role)
    adminCount = authUsers.filter(
      (u: SupabaseAuthUser) =>
        u.app_metadata?.role === "admin" ||
        u.app_metadata?.role === "super_admin",
    ).length;
    // Count teachers from auth users
    authTeacherCount = authUsers.filter(
      (u: SupabaseAuthUser) => u.app_metadata?.role === "teacher",
    ).length;
  }

  // Use the higher count between profiles and auth users
  const finalTeacherCount = Math.max(teacherCount, authTeacherCount);

  return {
    totalSchools: schoolCount || 0,
    totalTeachers: finalTeacherCount,
    totalStudents: studentCount,
    activePins: activePins,
    inactivePins: inactivePins,
    totalAdmins: adminCount,
  };
}

/**
 * Get dashboard metrics for super admin dashboard
 * SECURITY: Requires admin or super_admin role
 * PERFORMANCE: Results cached for 5 minutes to reduce database load
 */
export async function getDashboardMetrics(): Promise<{
  success: boolean;
  data?: DashboardMetrics;
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getDashboardMetrics",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    // PERFORMANCE: Use query cache - 5 minute TTL for dashboard metrics
    // This reduces database load significantly as this query is called frequently
    const metrics = await queryCache.getOrFetch(
      "admin:dashboard:metrics",
      fetchDashboardMetricsFromDB,
      5 * 60 * 1000, // 5 minutes
    );

    authLogger.info("[getDashboardMetrics] Metrics fetched successfully", {
      ...metrics,
    });
    return {
      success: true,
      data: metrics,
    };
  } catch (error) {
    authLogger.error("[getDashboardMetrics] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get school statistics by district
 * Uses correct table names per DATABASE.md:
 * - teacher_profiles (not 'teachers')
 * - student_profiles (not 'students')
 * - school_staff_credentials (not 'pins')
 * - schools.district column (not 'districts' table)
 * SECURITY: Requires admin or super_admin role
 */
export async function getSchoolStatsByDistrict(): Promise<{
  success: boolean;
  data?: SchoolStats[];
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getSchoolStatsByDistrict",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = await createAdminClient();

    // Get schools - district is a column in schools table, not a separate table
    const { data: schools, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_name, district");

    if (schoolError) {
      authLogger.error(
        "[getSchoolStatsByDistrict] Failed to get schools",
        schoolError,
      );
      return {
        success: false,
        error: "Failed to fetch school statistics",
      };
    }

    if (!schools || schools.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Define proper type for school data
    interface SchoolData {
      id: string;
      school_name: string;
      district: string;
    }

    const schoolData = schools as SchoolData[];
    const schoolIds = schoolData.map((s) => s.id);

    // PERFORMANCE FIX: Use database aggregation RPC instead of client-side pagination
    // Old pattern: Multiple paginated queries + in-memory aggregation (20-50MB memory)
    // New pattern: Single RPC with GROUP BY aggregation (<1MB memory)
    const { data: metricsData, error: metricsError } =
      await supabase.rpc("get_school_metrics");

    if (metricsError) {
      authLogger.error(
        "[getSchoolStatsByDistrict] Failed to get school metrics",
        metricsError,
      );
      return {
        success: false,
        error: "Failed to fetch school statistics",
      };
    }

    // Filter metrics for schools in the specified district (if district parameter was used)
    const schoolIdSet = new Set(schoolIds);
    // Type: GetSchoolMetricsResponse from apps/db/migrations/127_fix_get_school_metrics.sql
    const filteredMetrics =
      metricsData?.filter(
        (m: {
          school_id: string;
          school_name: string;
          teacher_count: number;
          student_count: number;
          active_pin_count: number;
          total_classes: number;
        }) => schoolIdSet.has(m.school_id),
      ) || [];

    // PERFORMANCE FIX: Build Map for O(1) district lookups instead of O(n) find() in loop
    // Previously: O(n*m) where n=metrics, m=schools
    // Now: O(n+m) - build map once, then O(1) lookups
    const schoolDistrictMap = new Map(
      schoolData.map((s) => [s.id, s.district || "Unknown"]),
    );

    // Build results from RPC response
    const schoolStats: SchoolStats[] = filteredMetrics.map(
      (metrics: {
        school_id: string;
        school_name: string;
        teacher_count: number;
        student_count: number;
        active_pin_count: number;
        total_classes: number;
      }) => ({
        schoolId: metrics.school_id,
        schoolName: metrics.school_name,
        districtName: schoolDistrictMap.get(metrics.school_id) || "Unknown",
        teacherCount: Number(metrics.teacher_count),
        studentCount: Number(metrics.student_count),
        pinCount: Number(metrics.active_pin_count) > 0 ? 1 : 0,
        activePinCount: Number(metrics.active_pin_count),
      }),
    );

    return {
      success: true,
      data: schoolStats,
    };
  } catch (error) {
    authLogger.error("[getSchoolStatsByDistrict] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get schools with active PINs
 * SECURITY: Requires admin or super_admin role
 */
export async function getSchoolsWithActivePINs(): Promise<{
  success: boolean;
  data?: Array<{
    schoolId: string;
    schoolName: string;
    schoolCode: string;
    districtName: string;
    lastRotatedAt: string | null;
  }>;
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getSchoolsWithActivePINs",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = await createAdminClient();

    // Get all schools with PINs
    const { data: pins, error: pinError } = await supabase
      .from("school_staff_credentials")
      .select("school_id, rotated_at, created_at");

    if (pinError) {
      authLogger.error(
        "[getSchoolsWithActivePINs] Failed to get PINs",
        pinError,
      );
      return {
        success: false,
        error: "Failed to fetch PIN data",
      };
    }

    if (!pins || pins.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Get school details for schools with PINs
    const schoolIds = pins.map((p) => p.school_id);
    // BUG-018: Supabase .in() with empty array returns unexpected results
    if (schoolIds.length === 0) {
      return { success: true, data: [] };
    }
    const { data: schools, error: schoolError } = await supabase
      .from("schools")
      .select("id, school_name, school_code, district")
      .in("id", schoolIds);

    if (schoolError) {
      authLogger.error(
        "[getSchoolsWithActivePINs] Failed to get schools",
        schoolError,
      );
      return {
        success: false,
        error: "Failed to fetch school data",
      };
    }

    // Define proper type for school data
    interface SchoolWithPINData {
      id: string;
      school_name: string;
      school_code: string | null;
      district: string | null;
    }

    // Map PIN data to schools
    const pinMap = new Map(pins.map((p) => [p.school_id, p]));
    const schoolsWithPins = (schools as SchoolWithPINData[]) ?? [];
    const result = schoolsWithPins.map((school) => {
      const pin = pinMap.get(school.id);
      return {
        schoolId: school.id,
        schoolName: school.school_name,
        schoolCode: school.school_code || "N/A",
        districtName: school.district || "Unknown",
        lastRotatedAt: pin?.rotated_at || pin?.created_at || null,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    authLogger.error("[getSchoolsWithActivePINs] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get recent activity count for last N days
 * SECURITY: Requires admin or super_admin role
 */
export async function getRecentActivityCount(days: number = 7): Promise<{
  success: boolean;
  data?: { date: string; count: number }[];
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getRecentActivityCount",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = await createAdminClient();

    // Validate days parameter to prevent excessive queries
    const validatedDays = Math.min(Math.max(1, Math.floor(days)), 365);

    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - validatedDays + 1);

    // OPTIMIZATION: Single batch query instead of per-day loop (N+1 fix)
    const { data: allProfiles, error: profileError } = await supabase
      .from("teacher_profiles")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", today.toISOString() + " 23:59:59");

    if (profileError) {
      authLogger.error(
        "[getRecentActivityCount] Failed to fetch activity data",
        profileError,
      );
      return {
        success: false,
        error: "Failed to fetch activity data",
      };
    }

    // Build activity count by date using in-memory aggregation
    const countByDate = new Map<string, number>();

    if (allProfiles) {
      for (const profile of allProfiles) {
        const date = new Date(profile.created_at).toISOString().split("T")[0];
        const count = countByDate.get(date) || 0;
        countByDate.set(date, count + 1);
      }
    }

    // Build result array for all days in range
    const activityData: { date: string; count: number }[] = [];
    for (let i = validatedDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      activityData.push({
        date: dateStr,
        count: countByDate.get(dateStr) || 0,
      });
    }

    return {
      success: true,
      data: activityData,
    };
  } catch (error) {
    authLogger.error("[getRecentActivityCount] Unexpected error", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get all schools list
 * SECURITY: Requires admin or super_admin role
 */
export async function getAllSchools(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    schoolName: string;
    schoolCode: string;
    district: string;
    block: string | null;
    hasPIN: boolean;
  }>;
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getAllSchools",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = await createAdminClient();

    // PERF-008 FIX: Parallelize independent queries with Promise.all
    // Previously: Sequential queries for schools and PINs
    // Now: Concurrent execution
    const [schoolsResult, pinsResult] = await Promise.all([
      supabase
        .from("schools")
        .select("id, school_name, school_code, district, block")
        .order("school_name"),
      supabase.from("school_staff_credentials").select("school_id"),
    ]);

    const { data: schools, error } = schoolsResult;
    const { data: pins } = pinsResult;

    if (error) {
      authLogger.error("[getAllSchools] Failed to get schools", error);
      return { success: false, error: "Failed to fetch schools" };
    }

    const schoolsWithPINs = new Set(
      (pins || []).map((p: { school_id: string }) => p.school_id),
    );

    const result = (schools || []).map(
      (school: {
        id: string;
        school_name: string;
        school_code: string;
        district: string;
        block: string | null;
      }) => ({
        id: school.id,
        schoolName: school.school_name,
        schoolCode: school.school_code || "N/A",
        district: school.district || "Unknown",
        block: school.block,
        hasPIN: schoolsWithPINs.has(school.id),
      }),
    );

    return { success: true, data: result };
  } catch (error) {
    authLogger.error("[getAllSchools] Unexpected error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all teachers list
 * Uses teacher_profiles table as the source of truth (not app_metadata.role)
 * SECURITY: Requires admin or super_admin role
 */
export async function getAllTeachers(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    schoolName: string;
    schoolCode: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getAllTeachers",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = await createAdminClient();

    // Get teacher profiles with school info - teacher_profiles is the source of truth
    const { data: profiles, error: profileError } = await supabase.from(
      "teacher_profiles",
    ).select(`
        user_id,
        name,
        phone,
        school_code,
        created_at,
        schools!inner(school_name)
      `);

    if (profileError) {
      authLogger.error(
        "[getAllTeachers] Failed to fetch teacher profiles",
        profileError,
      );
      return { success: false, error: "Failed to fetch teacher profiles" };
    }

    // Type for profile data with joined school
    // Note: Supabase PostgREST returns many-to-one joins as a single object (not array).
    // schools!inner guarantees schools is never null (INNER JOIN behavior)
    interface TeacherProfileData {
      user_id: string;
      name: string;
      phone: string | null;
      school_code: string;
      created_at: string;
      schools: { school_name: string } | null;
    }

    // PERFORMANCE FIX: Use batch fetch instead of fetchAllAuthUsers
    // Previously: Fetched ALL 1000+ auth users, then filtered to ~50 teachers (O(n))
    // Now: Parallel getUserById for only the teacher IDs we need (O(k) where k << n)
    //
    // Note: Supabase PostgREST returns many-to-one joins (schools!inner) as a single
    // object at runtime, but TypeScript infers it as an array. Cast through unknown.
    const teacherProfiles = (profiles as unknown as TeacherProfileData[]) ?? [];
    const teacherIds = teacherProfiles.map((p) => p.user_id);

    const adminClient = await createAdminClient();
    const userMap = await batchFetchAuthUsersByIds(adminClient, teacherIds);

    // Type-safe profile validation - filter and validate in one pass
    const result = teacherProfiles
      .filter((profile) => {
        if (!profile || typeof profile !== "object") return false;
        if (typeof profile.user_id !== "string") return false;
        // schools is a single object (many-to-one join), not an array
        if (!profile.schools || !profile.schools.school_name) {
          authLogger.warn(
            "[getAllTeachers] Skipping profile with missing school data",
            {
              userId: profile.user_id,
              profile,
            },
          );
          return false;
        }
        return true;
      })
      .map((profile) => {
        const authUser = userMap.get(profile.user_id);
        return {
          id: profile.user_id,
          email: authUser?.email || "",
          name: profile.name || "Unknown",
          phone: profile.phone || null,
          schoolName: profile.schools?.school_name || "Unknown",
          schoolCode: profile.school_code || "N/A",
          createdAt: profile.created_at,
        };
      });

    return { success: true, data: result };
  } catch (error) {
    authLogger.error("[getAllTeachers] Unexpected error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all students list
 * Students are fetched from student_profiles table (actual enrolled students)
 * SECURITY: Requires admin or super_admin role
 */
export async function getAllStudents(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    email: string;
    username: string | null;
    name: string;
    phone: string | null;
    className: string | null;
    schoolName: string | null;
    createdAt: string;
    lastSignIn: string | null;
  }>;
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getAllStudents",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = await createAdminClient();

    // Get student profiles with class and school info
    const { data: profiles, error: profileError } = await supabase
      .from("student_profiles")
      .select(
        `
        user_id,
        name,
        phone,
        class_name,
        school_name,
        created_at
      `,
      )
      .order("created_at", { ascending: false });

    if (profileError) {
      authLogger.error(
        "[getAllStudents] Failed to fetch student profiles",
        profileError,
      );
      return { success: false, error: "Failed to fetch student profiles" };
    }

    // Type for profile data
    interface StudentProfileData {
      user_id: string;
      name: string | null;
      phone: string | null;
      class_name: string | null;
      school_name: string | null;
      created_at: string;
    }

    // PERFORMANCE FIX: Use batch fetch instead of fetchAllAuthUsers
    // Previously: Fetched ALL 1000+ auth users, then filtered to ~100 students (O(n))
    // Now: Parallel getUserById for only the student IDs we need (O(k) where k << n)
    const typedProfiles = (profiles as StudentProfileData[]) ?? [];
    const studentIds = typedProfiles.map((p) => p.user_id);

    const userMap = await batchFetchAuthUsersByIds(supabase, studentIds);
    const result = typedProfiles
      .filter((profile): profile is StudentProfileData => {
        // Validate required fields exist before processing
        if (!profile.user_id || !profile.created_at) {
          authLogger.warn(
            "[getAllStudents] Skipping profile with missing required data",
            {
              userId: profile.user_id,
              profile,
            },
          );
          return false;
        }
        return true;
      })
      .map((profile) => {
        const authUser = userMap.get(profile.user_id);
        const username = (authUser?.user_metadata?.username as string | undefined) ?? null;
        const authType = (authUser?.user_metadata?.auth_type as string | undefined) ?? "email";
        // For username auth, don't show the internal email
        const displayEmail =
          authType === "username" ? "" : authUser?.email ?? "";

        return {
          id: profile.user_id,
          email: displayEmail,
          username: username,
          name: profile.name || "Unknown",
          phone: profile.phone || null,
          className: profile.class_name || null,
          schoolName: profile.school_name || null,
          createdAt: profile.created_at,
          lastSignIn: authUser?.last_sign_in_at ?? null,
        };
      });

    return { success: true, data: result };
  } catch (error) {
    authLogger.error("[getAllStudents] Unexpected error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get schools without PINs (inactive)
 * SECURITY: Requires admin or super_admin role
 */
export async function getSchoolsWithoutPINs(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    schoolName: string;
    schoolCode: string;
    district: string;
  }>;
  error?: string;
}> {
  try {
    // SECURITY: Verify admin authorization and check rate limits
    const authResult = await verifyAdminAuthAndRateLimit(
      "getSchoolsWithoutPINs",
      RATE_LIMITS.adminMetrics,
    );
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = await createAdminClient();

    // PERF-009 FIX: Parallelize independent queries with Promise.all
    // Previously: Sequential queries for schools and PINs
    // Now: Concurrent execution
    const [schoolsResult, pinsResult] = await Promise.all([
      supabase
        .from("schools")
        .select("id, school_name, school_code, district")
        .order("school_name"),
      supabase.from("school_staff_credentials").select("school_id"),
    ]);

    const { data: schools, error: schoolError } = schoolsResult;
    const { data: pins } = pinsResult;

    if (schoolError) {
      authLogger.error(
        "[getSchoolsWithoutPINs] Failed to get schools",
        schoolError,
      );
      return { success: false, error: "Failed to fetch schools" };
    }

    const schoolsWithPINs = new Set(
      (pins || []).map((p: { school_id: string }) => p.school_id),
    );

    // Filter schools without PINs
    const result = (schools || [])
      .filter((school: { id: string }) => !schoolsWithPINs.has(school.id))
      .map(
        (school: {
          id: string;
          school_name: string;
          school_code: string;
          district: string;
        }) => ({
          id: school.id,
          schoolName: school.school_name,
          schoolCode: school.school_code || "N/A",
          district: school.district || "Unknown",
        }),
      );

    return { success: true, data: result };
  } catch (error) {
    authLogger.error("[getSchoolsWithoutPINs] Unexpected error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
