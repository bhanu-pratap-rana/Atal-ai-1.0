"use client";

/**
 * Real-time Student Progress Grid
 *
 * Shows all enrolled students' progress with live updates.
 * Uses Supabase real-time subscriptions for instant visibility.
 *
 * Features:
 * - Real-time mastery score updates
 * - At-risk student highlighting
 * - Activity status indicators
 * - Click to view detailed progress
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientLogger } from "@/lib/client-logger";
import { getModules } from "@/lib/services/curriculum-service";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";

interface StudentProgress {
  readonly id: string;
  readonly student_id: string;
  readonly student_name: string;
  readonly email: string;
  readonly module_id: string;
  readonly topics_mastered: number;
  readonly total_topics: number;
  readonly average_mastery: number;
  readonly last_activity: string | null;
  readonly is_at_risk: boolean;
  readonly current_topic?: string;
}

interface StudentProgressGridProps {
  readonly classId: string;
}

/**
 * Get activity status indicator color based on status
 */
function getActivityStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-success";
    case "recent":
      return "bg-warning";
    default:
      return "bg-surface";
  }
}

/**
 * Get progress bar color based on mastery percentage and at-risk status
 */
function getProgressBarColor(
  progressPercent: number,
  isAtRisk: boolean,
): string {
  if (isAtRisk) {
    return "bg-destructive";
  }
  if (progressPercent >= MASTERY_THRESHOLDS.PASSING) {
    return "bg-success";
  }
  if (progressPercent >= 40) {
    return "bg-warning";
  }
  return "bg-primary";
}

export function StudentProgressGrid({
  classId,
}: StudentProgressGridProps) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial student data
  const fetchStudentProgress = useCallback(async () => {
    try {
      const supabase = createClient();

      // Fetch actual total topics from database
      const modules = await getModules();
      const totalCurriculumTopics = modules.reduce(
        (sum, m) => sum + (Number(m.topic_count) || 0),
        0
      );

      // Get enrolled student IDs (simple query, no join)
      const { data: enrollmentData, error: fetchError } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", classId);

      if (fetchError) throw fetchError;

      const studentIds = enrollmentData?.map((e) => e.student_id) || [];

      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Get student names via SECURITY DEFINER RPC (bypasses RLS on student_profiles)
      const { data: rosterData } = await supabase.rpc("get_class_roster", {
        p_class_id: classId,
      });

      // Build name lookup from roster
      const nameMap = new Map<string, { name: string; roll_number: string }>();
      for (const row of rosterData || []) {
        nameMap.set(row.student_id, {
          name: row.student_name || "Unknown Student",
          roll_number: row.roll_number || "",
        });
      }

      // Get progress via database aggregation RPC
      const { data: progressData, error: progressError } = await supabase.rpc(
        "get_class_student_progress",
        { p_student_ids: studentIds },
      );

      if (progressError) {
        clientLogger.error(
          "[StudentProgressGrid] Error fetching progress:",
          progressError,
        );
        throw progressError;
      }

      // Build lookup map from RPC results - O(n) instead of O(n²)
      type ProgressDataItem = {
        student_id: string;
        total_topics: number;
        topics_mastered: number;
        avg_mastery_score: number;
        last_activity: string | null;
        topics_total?: number;
      };
      const progressDataMap = new Map<string, ProgressDataItem>(
        (progressData || []).map((p: ProgressDataItem) => [p.student_id, p])
      );

      // Build final student progress list
      const progressMap = new Map<string, StudentProgress>();

      for (const studentId of studentIds) {
        const profile = nameMap.get(studentId);
        const progress = progressDataMap.get(studentId);

        const masteredTopics = progress?.topics_mastered || 0;
        const totalTopics = progress?.topics_total || 0;
        const avgMastery = progress?.avg_mastery_score || 0;
        const latestActivity = progress?.last_activity || null;

        // Check if at-risk (low average mastery)
        const isAtRisk = avgMastery < 40 && totalTopics > 0;

        progressMap.set(studentId, {
          id: `${studentId}-progress`,
          student_id: studentId,
          student_name: profile?.name || "Unknown Student",
          email: profile?.roll_number || "",
          module_id: "all",
          topics_mastered: masteredTopics,
          total_topics: totalCurriculumTopics || 50,
          average_mastery: Math.round(avgMastery * 100) / 100,
          last_activity: latestActivity,
          is_at_risk: isAtRisk,
        });
      }

      setStudents(Array.from(progressMap.values()));
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      clientLogger.error("[StudentProgressGrid] Error: " + errorMessage);
      setError("Failed to load student progress");
      setLoading(false);
    }
  }, [classId]);

  // Set up real-time subscription
  useEffect(() => {
    fetchStudentProgress();

    const supabase = createClient();

    // Subscribe to knowledge state changes
    const channel = supabase
      .channel(`class-progress-${classId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_knowledge_state",
        },
        () => {
          // Refetch when any progress changes
          // In a production app, we'd do smarter updates
          fetchStudentProgress();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]); // Only depend on classId to avoid subscription recreation

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={`progress-skeleton-${i}`} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-surface rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-error">
        <p>{error}</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No students enrolled in this class yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((student) => (
        <StudentProgressCard key={student.id} student={student} />
      ))}
    </div>
  );
}

/**
 * Individual Student Progress Card
 */
function StudentProgressCard({
  student,
}: {
  readonly student: StudentProgress;
}) {
  const progressPercent = Math.round(
    (student.topics_mastered / student.total_topics) * 100,
  );

  // Memoize activity status calculation to isolate impure Date.now() call
  const activity = useMemo(() => {
    const lastActivity = student.last_activity;
    if (!lastActivity) return { status: "inactive", label: "No activity" };

    // Get current time to calculate time difference
    // Impure Date.now() is safe here as it's memoized and only updated when lastActivity changes
    const hours = Math.floor(
      // eslint-disable-next-line react-hooks/purity
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60),
    );

    if (hours < 1) return { status: "active", label: "Active now" };
    if (hours < 24) return { status: "recent", label: `${hours}h ago` };
    if (hours < 168)
      return { status: "week", label: `${Math.floor(hours / 24)}d ago` };
    return { status: "inactive", label: "Over a week" };
  }, [student.last_activity]);

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        student.is_at_risk ? "border-destructive/50 bg-destructive/10" : ""
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">
            {student.student_name}
          </CardTitle>
          <span
            className={`w-2 h-2 rounded-full ${getActivityStatusColor(activity.status)}`}
            title={activity.label}
          />
        </div>
        {student.email && (
          <p className="text-xs text-text-secondary truncate">
            Roll No: {student.email}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressBarColor(progressPercent, student.is_at_risk)}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-secondary">Mastered:</span>{" "}
            <span className="font-medium">
              {student.topics_mastered}/{student.total_topics}
            </span>
          </div>
          <div>
            <span className="text-text-secondary">Avg:</span>{" "}
            <span className="font-medium">{student.average_mastery}%</span>
          </div>
        </div>

        {/* At-Risk Badge */}
        {student.is_at_risk && (
          <div className="mt-2 text-xs text-destructive font-medium flex items-center gap-1">
            <span>⚠️</span> Needs attention
          </div>
        )}

        {/* Activity */}
        <div className="mt-2 text-xs text-text-secondary">
          {activity.label}
        </div>
      </CardContent>
    </Card>
  );
}
