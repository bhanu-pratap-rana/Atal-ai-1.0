import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isTeacherOrHigher } from "@/lib/auth/role-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getClassAssessmentResults } from "@/app/actions/teacher";

// Format date to relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// Get score color based on value
function getScoreColor(score: number | null): string {
  if (score === null) return "bg-surface text-text-tertiary";
  if (score >= 80) return "bg-success text-white";
  if (score >= 60) return "bg-warning text-white";
  return "bg-error text-white";
}

// Get skill level from score
function getSkillLevel(score: number | null): { label: string; color: string } {
  if (score === null)
    return { label: "No Data", color: "bg-surface text-text-tertiary" };
  if (score >= 80)
    return { label: "Advanced", color: "bg-success-light text-success-dark" };
  if (score >= 60)
    return {
      label: "Intermediate",
      color: "bg-warning-light text-warning-dark",
    };
  return { label: "Beginner", color: "bg-error-light text-error-dark" };
}

interface PageProps {
  readonly params: Promise<{ classId: string }>;
}

export default async function ClassAssessmentResultsPage({
  params,
}: PageProps) {
  const { classId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/teacher/start");
  }

  // Check app_metadata for role
  const role = user.app_metadata?.role;
  const isTeacherOrAdmin = isTeacherOrHigher(role);
  if (!isTeacherOrAdmin) {
    redirect("/app/dashboard");
  }

  // Fetch class assessment results
  const resultsData = await getClassAssessmentResults(classId);

  if (!resultsData.success || !resultsData.data) {
    notFound();
  }

  const results = resultsData.data;
  const hasStudents = results.results.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-6xl">
        {/* Header */}
        <div className="mb-responsive">
          <Link
            href="/app/teacher/assessments"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm md:text-base touch-target"
          >
            ← Back to Assessments
          </Link>
          <h1 className="heading-1 text-primary mb-2">{results.className}</h1>
          <p className="text-text-secondary text-sm md:text-base">
            Student Assessment Results
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-responsive">
          <Card className="card-responsive bg-primary/10 border-primary/20">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {results.totalStudents}
              </p>
              <p className="text-xs text-text-secondary">Total Students</p>
            </CardContent>
          </Card>
          <Card className="card-responsive bg-info/10 border-info/20">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-info-dark">
                {results.studentsWithAssessments}
              </p>
              <p className="text-xs text-text-secondary">Completed</p>
            </CardContent>
          </Card>
          <Card className="card-responsive bg-warning/10 border-warning/20">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-warning-dark">
                {results.totalStudents - results.studentsWithAssessments}
              </p>
              <p className="text-xs text-text-secondary">Pending</p>
            </CardContent>
          </Card>
          <Card className="card-responsive bg-success/10 border-success/20">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-success-dark">
                {results.classAverageScore === null
                  ? "-"
                  : `${results.classAverageScore}%`}
              </p>
              <p className="text-xs text-text-secondary">Class Average</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Results Table */}
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <span>📊</span>
              <span>Student Results</span>
              <span className="text-sm font-normal text-text-secondary">
                ({results.results.length} students)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasStudents ? (
              <div className="overflow-x-auto">
                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {results.results.map((student) => {
                    const skillLevel = getSkillLevel(student.averageScore);
                    return (
                      <div
                        key={student.studentId}
                        className="p-4 bg-surface rounded-lg border border-border-light"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-text-primary">
                              {student.studentName}
                            </p>
                            {student.rollNumber && (
                              <p className="text-xs text-text-secondary">
                                Roll: {student.rollNumber}
                              </p>
                            )}
                          </div>
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${getScoreColor(student.averageScore)}`}
                          >
                            {student.averageScore === null
                              ? "-"
                              : `${student.averageScore}%`}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full ${skillLevel.color}`}
                          >
                            {skillLevel.label}
                          </span>
                          <span className="text-text-secondary">
                            {student.sessionsCompleted} sessions
                          </span>
                          <span className="text-text-tertiary">
                            {student.correctAnswers}/{student.totalQuestions}{" "}
                            correct
                          </span>
                        </div>
                        {student.lastAssessmentDate && (
                          <p className="text-xs text-text-tertiary mt-2">
                            Last:{" "}
                            {formatRelativeTime(student.lastAssessmentDate)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                        Student
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">
                        Roll #
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                        Score
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                        Level
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                        Sessions
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-text-secondary">
                        Correct
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">
                        Last Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((student) => {
                      const skillLevel = getSkillLevel(student.averageScore);
                      return (
                        <tr
                          key={student.studentId}
                          className="border-b border-border-light hover:bg-surface/50"
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-text-primary">
                              {student.studentName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary">
                            {student.rollNumber || "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-12 h-8 rounded font-bold text-sm ${getScoreColor(student.averageScore)}`}
                            >
                              {student.averageScore === null
                                ? "-"
                                : `${student.averageScore}%`}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs ${skillLevel.color}`}
                            >
                              {skillLevel.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-text-secondary">
                            {student.sessionsCompleted}
                          </td>
                          <td className="py-3 px-4 text-center text-text-secondary">
                            {student.totalQuestions > 0
                              ? `${student.correctAnswers}/${student.totalQuestions}`
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-right text-text-tertiary text-sm">
                            {formatRelativeTime(student.lastAssessmentDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-text-tertiary text-base mb-2">
                  No students enrolled yet
                </p>
                <p className="text-text-secondary text-sm">
                  Share the class code with your students to get started.
                </p>
                <Link href={`/app/teacher/classes/${classId}`}>
                  <Button className="mt-4 bg-primary hover:bg-primary-dark">
                    View Class Details
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="card-responsive mt-responsive">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-text-secondary mb-3">
              Score Levels
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-success"></span>
                <span className="text-sm text-text-secondary">
                  Advanced (80%+)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-warning"></span>
                <span className="text-sm text-text-secondary">
                  Intermediate (60-79%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-error"></span>
                <span className="text-sm text-text-secondary">
                  Beginner (&lt;60%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
