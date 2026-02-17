"use server";

import { z } from "zod";
import {
  createClient,
  verifyClassOwnership,
  verifyTeacherAuth,
} from "@/lib/supabase-server";
import { queryCache } from "@/lib/cache/query-cache";
import { ClassIdSchema } from "@/lib/validation-schemas";
import { authLogger } from "@/lib/auth-logger";
import { handleZodError } from "@/lib/action-error-handler";

/**
 * Type definitions for Supabase responses
 *
 * Note: Some interfaces include `[key: string]: unknown` to allow for additional fields
 * from Supabase responses. This is necessary because:
 * 1. Supabase may include extra metadata fields depending on the select() clause
 * 2. User-defined custom fields may be present in raw_user_meta_data
 * 3. Future schema extensions may add new fields
 *
 * When accessing these interfaces, always validate known required fields first.
 */

/**
 * Get assessment results for students in a teacher's class
 * Teachers can view aggregate and individual student results
 */
export interface StudentAssessmentResult {
  studentId: string;
  studentName: string;
  rollNumber: string | null;
  sessionsCompleted: number;
  averageScore: number | null;
  lastAssessmentDate: string | null;
  totalQuestions: number;
  correctAnswers: number;
}

export interface ClassAssessmentResults {
  classId: string;
  className: string;
  totalStudents: number;
  studentsWithAssessments: number;
  classAverageScore: number | null;
  results: StudentAssessmentResult[];
}

/**
 * Type for enrollment query result with nested student_profiles
 * TYPE SAFETY: Avoids double casting (as unknown as X) by defining expected shape
 * Note: Supabase may return nested relations as arrays
 */
interface EnrollmentQueryResult {
  student_id: string;
  student_profiles: Array<{ name: string; roll_number: string | null }>;
}

/**
 * Normalized enrollment with single student profile
 */
interface EnrollmentWithProfile {
  student_id: string;
  student_profiles: { name: string; roll_number: string | null } | null;
}

/**
 * Normalize enrollment data from Supabase (converts array to single object)
 */
function normalizeEnrollments(
  enrollments: EnrollmentQueryResult[] | null
): EnrollmentWithProfile[] {
  if (!enrollments) return [];
  return enrollments.map((e) => ({
    student_id: e.student_id,
    student_profiles: e.student_profiles?.[0] || null,
  }));
}

/**
 * Type guard to safely validate student profile structure from Supabase
 */
function isValidStudentProfile(
  data: unknown,
): data is { name: string; roll_number: string | null } {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.name === "string" &&
    (obj.roll_number === null || typeof obj.roll_number === "string")
  );
}

/**
 * Helper: Build lookup maps for sessions and responses
 */
function buildLookupMaps(
  allSessions: Array<{
    id: string;
    user_id: string;
    submitted_at: string;
  }> | null,
  allResponses: Array<{ session_id: string; is_correct: boolean }> | null,
): {
  sessionsByStudent: Map<string, Array<{ id: string; submitted_at: string }>>;
  responsesBySession: Map<string, Array<{ is_correct: boolean }>>;
} {
  const sessionsByStudent = new Map<
    string,
    Array<{ id: string; submitted_at: string }>
  >();
  const responsesBySession = new Map<string, Array<{ is_correct: boolean }>>();

  allSessions?.forEach((session) => {
    if (!sessionsByStudent.has(session.user_id)) {
      sessionsByStudent.set(session.user_id, []);
    }
    const studentSessions = sessionsByStudent.get(session.user_id);
    if (studentSessions) {
      studentSessions.push({
        id: session.id,
        submitted_at: session.submitted_at,
      });
    }
  });

  allResponses?.forEach((response) => {
    if (!responsesBySession.has(response.session_id)) {
      responsesBySession.set(response.session_id, []);
    }
    const sessionResponses = responsesBySession.get(response.session_id);
    if (sessionResponses) {
      sessionResponses.push({
        is_correct: response.is_correct,
      });
    }
  });

  return { sessionsByStudent, responsesBySession };
}

/**
 * Helper: Calculate student assessment statistics
 */
function calculateStudentStats(
  sessions: Array<{ id: string; submitted_at: string }>,
  responsesBySession: Map<string, Array<{ is_correct: boolean }>>,
): {
  sessionsCompleted: number;
  averageScore: number | null;
  lastAssessmentDate: string | null;
  totalQuestions: number;
  correctAnswers: number;
} {
  const sessionsCompleted = sessions.length;

  if (sessions.length === 0) {
    return {
      sessionsCompleted: 0,
      averageScore: null,
      lastAssessmentDate: null,
      totalQuestions: 0,
      correctAnswers: 0,
    };
  }

  sessions.sort(
    (a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );
  const lastAssessmentDate = sessions[0].submitted_at;

  let totalQuestions = 0;
  let correctAnswers = 0;

  for (const session of sessions) {
    const responses = responsesBySession.get(session.id) || [];
    totalQuestions += responses.length;
    correctAnswers += responses.filter((r) => r.is_correct).length;
  }

  const averageScore =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : null;

  return {
    sessionsCompleted,
    averageScore,
    lastAssessmentDate,
    totalQuestions,
    correctAnswers,
  };
}

/**
 * Helper: Process student results from enrollments
 */
function processStudentResults(
  enrollments: Array<{
    student_id: string;
    student_profiles: { name: string; roll_number: string | null } | null;
  }> | null,
  sessionsByStudent: Map<string, Array<{ id: string; submitted_at: string }>>,
  responsesBySession: Map<string, Array<{ is_correct: boolean }>>,
): StudentAssessmentResult[] {
  const studentResults: StudentAssessmentResult[] = [];

  for (const enrollment of enrollments || []) {
    if (!isValidStudentProfile(enrollment.student_profiles)) {
      authLogger.warn(
        "[getClassAssessmentResults] Invalid student profile structure",
        {
          enrollment_id: enrollment.student_id,
        },
      );
      continue;
    }

    // isValidStudentProfile already ensures student_profiles is not null
    const studentProfile = enrollment.student_profiles;
    const sessions = sessionsByStudent.get(enrollment.student_id) || [];
    const stats = calculateStudentStats(sessions, responsesBySession);

    studentResults.push({
      studentId: enrollment.student_id,
      studentName: studentProfile.name,
      rollNumber: studentProfile.roll_number || null,
      sessionsCompleted: stats.sessionsCompleted,
      averageScore: stats.averageScore,
      lastAssessmentDate: stats.lastAssessmentDate,
      totalQuestions: stats.totalQuestions,
      correctAnswers: stats.correctAnswers,
    });
  }

  return studentResults;
}

/**
 * Get class assessment results (refactored to reduce cognitive complexity)
 * CRITICAL FIX: Reduced complexity from 21 to <15 by extracting helper functions
 */
export async function getClassAssessmentResults(classId: string): Promise<{
  success: boolean;
  data?: ClassAssessmentResults;
  error?: string;
}> {
  try {
    // Validate input
    let validatedClassId;
    try {
      validatedClassId = ClassIdSchema.parse(classId);
    } catch (error) {
      const zodError = handleZodError(error);
      return { success: zodError.success, error: zodError.error };
    }

    // SECURITY: Verify caller is authenticated and owns this class
    const auth = await verifyClassOwnership(
      "getClassAssessmentResults",
      validatedClassId,
    );
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = await createClient();

    // SECURITY FIX #4 EXTENSION: Re-verify class ownership before analytics queries
    // Prevents TOCTOU vulnerability if class is deleted/transferred after initial check
    const { data: classData, error: classDataError } = await supabase
      .from("classes")
      .select("id, teacher_id, name")
      .eq("id", validatedClassId)
      .maybeSingle();

    if (classDataError || !classData || classData.teacher_id !== auth.user.id) {
      authLogger.warn(
        "[getClassAssessmentResults] Access denied: Class no longer owned by user",
        {
          userId: auth.user.id,
          classId: validatedClassId,
        },
      );
      return { success: false, error: "You do not own this class" };
    }

    // Get all enrolled students
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(
        `
        student_id,
        student_profiles!inner (
          name,
          roll_number
        )
      `,
      )
      .eq("class_id", validatedClassId);

    if (enrollmentError) {
      return { success: false, error: "Failed to fetch enrolled students" };
    }

    // OPTIMIZATION: Batch fetch all assessment data instead of looping (prevents N+1 queries)
    const studentIds = (enrollments || []).map((e) => e.student_id);

    // BUG-019 FIX: Guard against empty array in .in() query (BUG-018 pattern)
    // Get all assessment sessions for all students in this class in one query
    const { data: allSessions } = studentIds.length > 0
      ? await supabase
          .from("assessment_sessions")
          .select("id, user_id, submitted_at")
          .in("user_id", studentIds)
          .eq("class_id", validatedClassId)
          .not("submitted_at", "is", null)
      : { data: null };

    // Get all assessment session IDs for bulk response fetch
    const sessionIds = allSessions?.map((s) => s.id) || [];

    // BUG-019 FIX: Guard against empty array in .in() query (BUG-018 pattern)
    // Get all responses for all sessions in one query (instead of per-student queries)
    const { data: allResponses } = sessionIds.length > 0
      ? await supabase
          .from("assessment_responses")
          .select("is_correct, session_id")
          .in("session_id", sessionIds)
      : { data: null };

    const { sessionsByStudent, responsesBySession } = buildLookupMaps(
      allSessions,
      allResponses,
    );

    // TYPE SAFETY: Normalize and type the enrollment data properly
    const normalizedEnrollments = normalizeEnrollments(
      enrollments as EnrollmentQueryResult[] | null
    );
    const studentResults = processStudentResults(
      normalizedEnrollments,
      sessionsByStudent,
      responsesBySession,
    );

    const studentsWithScores = studentResults.filter(
      (r) => r.averageScore !== null,
    );
    const classAverageScore =
      studentsWithScores.length > 0
        ? Math.round(
            studentsWithScores.reduce(
              (sum, r) => sum + (r.averageScore || 0),
              0,
            ) / studentsWithScores.length,
          )
        : null;

    // Verify classData exists before accessing it
    if (!auth.classData) {
      authLogger.error(
        "[getClassAssessmentResults] Missing classData in auth after authorization",
        new Error("classData undefined"),
      );
      return { success: false, error: "Class data not found" };
    }

    return {
      success: true,
      data: {
        classId: validatedClassId,
        className: auth.classData.name,
        totalStudents: enrollments?.length || 0,
        studentsWithAssessments: studentsWithScores.length,
        classAverageScore,
        results: studentResults.toSorted((a, b) => {
          // Sort by roll number if available, otherwise by name
          if (a.rollNumber && b.rollNumber) {
            return a.rollNumber.localeCompare(b.rollNumber);
          }
          return a.studentName.localeCompare(b.studentName);
        }),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }
    authLogger.error("[getClassAssessmentResults] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Helper: Build enrollment count map by class
 */
function buildEnrollmentCountMap(
  enrollments: Array<{ class_id: string }> | null,
): Map<string, number> {
  const countByClass = new Map<string, number>();
  enrollments?.forEach((enrollment) => {
    const count = (countByClass.get(enrollment.class_id) || 0) + 1;
    countByClass.set(enrollment.class_id, count);
  });
  return countByClass;
}

/**
 * Helper: Build sessions by class map
 */
function buildSessionsByClassMap(
  sessions: Array<{ id: string; class_id: string }> | null,
): Map<string, string[]> {
  const sessionsByClass = new Map<string, string[]>();
  sessions?.forEach((session) => {
    const classSessions = sessionsByClass.get(session.class_id) || [];
    classSessions.push(session.id);
    sessionsByClass.set(session.class_id, classSessions);
  });
  return sessionsByClass;
}

/**
 * Helper: Build response counts by session map
 */
function buildResponseCountMap(
  responses: Array<{ session_id: string; is_correct: boolean }> | null,
): Map<string, { correct: number; total: number }> {
  const countBySession = new Map<string, { correct: number; total: number }>();
  responses?.forEach((response) => {
    const current = countBySession.get(response.session_id) || {
      correct: 0,
      total: 0,
    };
    current.total += 1;
    if (response.is_correct) {
      current.correct += 1;
    }
    countBySession.set(response.session_id, current);
  });
  return countBySession;
}

/**
 * Helper: Calculate class average score from sessions
 */
function calculateClassAverageScore(
  sessionIds: string[],
  responseCountBySession: Map<string, { correct: number; total: number }>,
): number | null {
  if (sessionIds.length === 0) return null;

  let totalCorrect = 0;
  let totalQuestions = 0;

  for (const sessionId of sessionIds) {
    const counts = responseCountBySession.get(sessionId);
    if (counts) {
      totalCorrect += counts.correct;
      totalQuestions += counts.total;
    }
  }

  return totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : null;
}

/**
 * Helper: Process class results from pre-fetched data
 */
function processClassResults(
  classes: Array<{ id: string; name: string; subject: string | null }> | null,
  enrollmentCountByClass: Map<string, number>,
  sessionsByClass: Map<string, string[]>,
  responseCountBySession: Map<string, { correct: number; total: number }>,
): {
  classResults: Array<{
    classId: string;
    className: string;
    subject: string | null;
    studentCount: number;
    assessmentsTaken: number;
    averageScore: number | null;
  }>;
  totalAssessments: number;
  totalScore: number;
  scoredAssessments: number;
} {
  const classResults: Array<{
    classId: string;
    className: string;
    subject: string | null;
    studentCount: number;
    assessmentsTaken: number;
    averageScore: number | null;
  }> = [];
  let totalAssessments = 0;
  let totalScore = 0;
  let scoredAssessments = 0;

  for (const cls of classes || []) {
    const studentCount = enrollmentCountByClass.get(cls.id) || 0;
    const sessions = sessionsByClass.get(cls.id) || [];
    const assessmentsTaken = sessions.length;
    totalAssessments += assessmentsTaken;

    const averageScore = calculateClassAverageScore(
      sessions,
      responseCountBySession,
    );

    if (averageScore !== null) {
      totalScore += averageScore;
      scoredAssessments++;
    }

    classResults.push({
      classId: cls.id,
      className: cls.name,
      subject: cls.subject,
      studentCount,
      assessmentsTaken,
      averageScore,
    });
  }

  return { classResults, totalAssessments, totalScore, scoredAssessments };
}

/**
 * Internal function to fetch teacher assessment overview from database
 * This is wrapped by getTeacherAssessmentOverview() with query caching
 * REFACTORED: Reduced complexity from 49 to <15 by extracting helper functions
 */
async function fetchTeacherAssessmentOverviewFromDB(
  teacherId: string,
): Promise<{
  classes: Array<{
    classId: string;
    className: string;
    subject: string | null;
    studentCount: number;
    assessmentsTaken: number;
    averageScore: number | null;
  }>;
  totalAssessments: number;
  overallAverageScore: number | null;
}> {
  const supabase = await createClient();

  // Get all classes for this teacher
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, subject")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (classesError) {
    throw classesError;
  }

  // OPTIMIZATION: Batch fetch all data for all classes (prevents N+1 queries)
  const classIds = (classes || []).map((c) => c.id);

  // BUG-018 FIX: Early return if no classes - .in() with empty array returns unexpected results
  if (classIds.length === 0) {
    return {
      classes: [],
      totalAssessments: 0,
      overallAverageScore: null,
    };
  }

  // Fetch all data in parallel
  const [enrollmentsResult, sessionsResult] = await Promise.all([
    supabase.from("enrollments").select("class_id").in("class_id", classIds),
    supabase
      .from("assessment_sessions")
      .select("id, class_id")
      .in("class_id", classIds)
      .not("submitted_at", "is", null),
  ]);

  const sessionIds = sessionsResult.data?.map((s) => s.id) || [];

  // BUG-018 FIX: Skip responses query if no sessions exist
  if (sessionIds.length === 0) {
    const { classResults, totalAssessments, totalScore, scoredAssessments } =
      processClassResults(classes, buildEnrollmentCountMap(enrollmentsResult.data), new Map(), new Map());
    const overallAverageScore =
      scoredAssessments > 0 ? Math.round(totalScore / scoredAssessments) : null;
    return { classes: classResults, totalAssessments, overallAverageScore };
  }

  const { data: allResponses } = await supabase
    .from("assessment_responses")
    .select("is_correct, session_id")
    .in("session_id", sessionIds);

  // Build lookup maps using helper functions
  const enrollmentCountByClass = buildEnrollmentCountMap(enrollmentsResult.data);
  const sessionsByClass = buildSessionsByClassMap(sessionsResult.data);
  const responseCountBySession = buildResponseCountMap(allResponses);

  // Process class results
  const { classResults, totalAssessments, totalScore, scoredAssessments } =
    processClassResults(
      classes,
      enrollmentCountByClass,
      sessionsByClass,
      responseCountBySession,
    );

  const overallAverageScore =
    scoredAssessments > 0 ? Math.round(totalScore / scoredAssessments) : null;

  return {
    classes: classResults,
    totalAssessments,
    overallAverageScore,
  };
}

export async function getTeacherAssessmentOverview(): Promise<{
  success: boolean;
  data?: {
    classes: Array<{
      classId: string;
      className: string;
      subject: string | null;
      studentCount: number;
      assessmentsTaken: number;
      averageScore: number | null;
    }>;
    totalAssessments: number;
    overallAverageScore: number | null;
  };
  error?: string;
}> {
  try {
    // SECURITY: Verify caller is authenticated and is a teacher
    const auth = await verifyTeacherAuth("getTeacherAssessmentOverview");
    if (!auth.authorized) {
      return auth.error;
    }

    // PERFORMANCE: Use query cache - 3 minute TTL for teacher dashboard
    // Teacher dashboards change more frequently than admin, so shorter TTL
    const data = await queryCache.getOrFetch(
      `teacher:${auth.user.id}:assessment:overview`,
      () => fetchTeacherAssessmentOverviewFromDB(auth.user.id),
      3 * 60 * 1000, // 3 minutes
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    authLogger.error("[getTeacherAssessmentOverview] Unexpected error", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
