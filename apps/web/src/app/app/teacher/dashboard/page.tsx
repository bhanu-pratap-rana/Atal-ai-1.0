/**
 * Teacher Dashboard - Main Overview
 *
 * Combines StudentProgressGrid and AIInteractionsLog for real-time visibility.
 * Teachers can monitor student progress and AI tutor usage from one place.
 *
 * Features:
 * - Real-time student progress updates
 * - AI tutor interaction monitoring
 * - At-risk student identification
 * - Class-level analytics
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentProgressGrid } from "@/components/teacher/StudentProgressGrid";
import { AIInteractionsLog } from "@/components/teacher/AIInteractionsLog";
import { isTeacherOrHigher } from "@/lib/auth/role-utils";

// Dashboard metrics
async function getDashboardMetrics(teacherId: string) {
  const supabase = await createClient();

  // Get all classes for this teacher
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .eq("teacher_id", teacherId);

  if (classesError) {
    console.error("[TeacherDashboard] Classes query error:", classesError.message);
  }

  if (!classes || classes.length === 0) {
    return {
      totalClasses: 0,
      totalStudents: 0,
      activeStudents: 0,
      atRiskStudents: 0,
      classes: [],
    };
  }

  const classIds = classes.map((c) => c.id);

  // Get total enrolled students
  const { data: enrollments, error: enrollError } = await supabase
    .from("enrollments")
    .select("student_id")
    .in("class_id", classIds);

  if (enrollError) {
    console.error("[TeacherDashboard] Enrollments query error:", enrollError.message);
  }

  const studentIds = enrollments?.map((e) => e.student_id) || [];

  // Guard: empty studentIds would cause .in() issues
  if (studentIds.length === 0) {
    return {
      totalClasses: classes.length,
      totalStudents: 0,
      activeStudents: 0,
      atRiskStudents: 0,
      classes: classes.map((c) => ({ ...c, studentCount: 0 })),
    };
  }

  // Get active students (activity in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: activeKnowledgeState, error: activeError } = await supabase
    .from("student_knowledge_state")
    .select("student_id")
    .in("student_id", studentIds)
    .gte("last_attempt_at", sevenDaysAgo.toISOString());

  if (activeError) {
    console.error("[TeacherDashboard] Active students query error:", activeError.message);
  }

  const activeStudentIds = new Set(
    activeKnowledgeState?.map((k) => k.student_id) || [],
  );

  // Get at-risk students (low mastery after multiple attempts)
  const { data: atRiskData, error: riskError } = await supabase
    .from("student_knowledge_state")
    .select("student_id")
    .in("student_id", studentIds)
    .lt("mastery_score", 40)
    .gt("attempts", 3);

  if (riskError) {
    console.error("[TeacherDashboard] At-risk query error:", riskError.message);
  }

  const atRiskStudentIds = new Set(atRiskData?.map((k) => k.student_id) || []);

  return {
    totalClasses: classes.length,
    totalStudents: studentIds.length,
    activeStudents: activeStudentIds.size,
    atRiskStudents: atRiskStudentIds.size,
    classes,
  };
}

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/teacher/start");
  }

  // Verify teacher role
  if (!isTeacherOrHigher(user.app_metadata?.role)) {
    redirect("/app/dashboard");
  }

  const metrics = await getDashboardMetrics(user.id);

  // If teacher has no classes, show onboarding
  if (metrics.totalClasses === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-surface/30 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>

          <Card className="text-center p-8">
            <CardContent>
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-2xl font-semibold mb-2">
                Welcome to ATAL AI!
              </h2>
              <p className="text-text-secondary mb-6">
                Create your first class to start tracking student progress.
              </p>
              <Link href="/app/teacher/classes">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-cyan"
                >
                  Create Your First Class
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Select first class by default (in future, can add class selector)
  const selectedClass = metrics.classes[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-surface/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-text-secondary">
              Monitor student progress and AI tutor usage in real-time
            </p>
          </div>
          <Link href="/app/teacher/classes">
            <Button variant="outline">Manage Classes</Button>
          </Link>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Total Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalClasses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Active (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {metrics.activeStudents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                At Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {metrics.atRiskStudents}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Selector (if multiple classes) */}
        {metrics.classes.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Select Class to View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {metrics.classes.map((cls) => (
                  <Button
                    key={cls.id}
                    variant={
                      cls.id === selectedClass.id ? "default" : "outline"
                    }
                    size="sm"
                  >
                    {cls.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Class Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {selectedClass.name} - Student Progress
          </h2>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Real-time updates</span>
          </div>
        </div>

        {/* Student Progress Grid */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-surface rounded w-3/4 mb-2" />
                    <div className="h-3 bg-surface rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <StudentProgressGrid classId={selectedClass.id} />
        </Suspense>

        {/* AI Interactions Log */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">
              Recent AI Tutor Interactions
            </h2>
            <p className="text-sm text-text-secondary">
              Monitor student questions and AI responses for quality assurance
            </p>
          </div>

          <Suspense
            fallback={
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-surface rounded w-1/4 mb-2" />
                      <div className="h-3 bg-surface rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          >
            <AIInteractionsLog classId={selectedClass.id} limit={15} />
          </Suspense>
        </div>

        {/* Help Card */}
        <Card className="bg-gradient-to-r from-cyan/10 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm">💡 Teaching Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              • Check the &quot;At Risk&quot; students regularly for early
              intervention
            </p>
            <p>
              • Review AI interactions to understand common student questions
            </p>
            <p>• Students with 🔴 indicator need attention</p>
            <p>• Progress updates happen in real-time as students work</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
