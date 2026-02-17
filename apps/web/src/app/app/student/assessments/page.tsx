import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Format time in seconds to readable string
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

// Format date to relative time
function formatRelativeTime(dateString: string): string {
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

// Get skill level from score
function getSkillLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Advanced", color: "bg-success text-white" };
  if (score >= 60)
    return { label: "Intermediate", color: "bg-warning text-white" };
  return { label: "Beginner", color: "bg-info text-white" };
}

// Get score circle background color
function getScoreCircleColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-error";
}

interface AssessmentSession {
  id: string;
  started_at: string;
  submitted_at: string | null;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // in seconds
}

export default async function StudentAssessmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/start");
  }

  // PERF-012 FIX: Add pagination to prevent fetching unbounded data
  // Limit to most recent 50 assessments - sufficient for student history view
  // For users with 100+ assessments, this prevents memory/timeout issues
  const ASSESSMENT_LIMIT = 50;

  const { data: sessions } = await supabase
    .from("assessment_sessions")
    .select("id, started_at, submitted_at")
    .eq("user_id", user.id)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(ASSESSMENT_LIMIT);

  // Calculate stats for each session
  // PERF-001 FIX: Batch fetch all responses in one query instead of N+1 queries
  const assessmentHistory: AssessmentSession[] = [];

  // TYPE-003 FIX: Use proper null guard instead of non-null assertion
  if (sessions && sessions.length > 0) {
    // Collect all session IDs for batch query
    const sessionIds = sessions.map((s) => s.id);

    // Batch fetch all responses for all sessions in ONE query
    const { data: allResponses } = await supabase
      .from("assessment_responses")
      .select("session_id, is_correct, rt_ms")
      .in("session_id", sessionIds);

    // Build O(1) lookup map: session_id -> responses[]
    const responsesBySession = new Map<
      string,
      Array<{ is_correct: boolean | null; rt_ms: number | null }>
    >();
    // TYPE-004 FIX: Avoid non-null assertion on Map.get()
    allResponses?.forEach((resp) => {
      const existing = responsesBySession.get(resp.session_id);
      if (existing) {
        existing.push({
          is_correct: resp.is_correct,
          rt_ms: resp.rt_ms,
        });
      } else {
        responsesBySession.set(resp.session_id, [
          {
            is_correct: resp.is_correct,
            rt_ms: resp.rt_ms,
          },
        ]);
      }
    });

    // Process sessions with pre-fetched data (no additional queries)
    for (const session of sessions) {
      const responses = responsesBySession.get(session.id) || [];
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter((r) => r.is_correct).length;
      const score =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;
      const timeSpent = Math.round(
        responses.reduce((sum, r) => sum + (r.rt_ms || 0), 0) / 1000,
      );

      assessmentHistory.push({
        id: session.id,
        started_at: session.started_at,
        submitted_at: session.submitted_at,
        score,
        totalQuestions,
        correctAnswers,
        timeSpent,
      });
    }
  }

  const hasHistory = assessmentHistory.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-6xl">
        {/* Header */}
        <div className="mb-responsive">
          <Link
            href="/app/dashboard"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm md:text-base touch-target"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="heading-1 text-primary mb-2">📝 Assessments</h1>
          <p className="text-text-secondary text-sm md:text-base">
            View and complete your assessments
          </p>
        </div>

        {/* Quick Start Card */}
        <Card className="card-responsive mb-responsive bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-primary mb-1">
                  Start a New Assessment
                </h2>
                <p className="text-text-secondary text-sm">
                  Test your digital literacy skills with our comprehensive
                  assessment
                </p>
              </div>
              <Link href="/app/assessment/start">
                <Button className="bg-primary hover:bg-primary-dark text-white whitespace-nowrap">
                  Start Assessment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Assessment History */}
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <span>📊</span>
              Assessment History
              {hasHistory && (
                <span className="text-sm font-normal text-text-secondary">
                  ({assessmentHistory.length} completed)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasHistory ? (
              <div className="space-y-3">
                {assessmentHistory.map((assessment) => {
                  const skillLevel = getSkillLevel(assessment.score);
                  return (
                    <div
                      key={assessment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface rounded-lg border border-border-light gap-3"
                    >
                      <div className="flex items-center gap-4">
                        {/* Score Circle */}
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${getScoreCircleColor(assessment.score)}`}>
                          {assessment.score}%
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-text-primary">
                              Digital Literacy Assessment
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${skillLevel.color}`}
                            >
                              {skillLevel.label}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {assessment.correctAnswers}/
                            {assessment.totalQuestions} correct •{" "}
                            {formatTime(assessment.timeSpent)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <span className="text-sm text-text-tertiary">
                          {formatRelativeTime(
                            assessment.submitted_at || assessment.started_at,
                          )}
                        </span>
                        <Link
                          href={`/app/assessments/${assessment.id}`}
                        >
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-text-tertiary text-base md:text-lg font-medium">
                  No assessments completed yet
                </p>
                <p className="text-text-secondary text-sm mt-2 px-4 max-w-md mx-auto">
                  Take your first assessment to test your digital literacy
                  skills and track your progress over time.
                </p>
                <Link href="/app/assessment/start">
                  <Button className="mt-4 bg-primary hover:bg-primary-dark text-white">
                    Take Your First Assessment
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary (if has history) */}
        {hasHistory && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-responsive">
            <Card className="card-responsive bg-primary/10 border-primary/20">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {assessmentHistory.length}
                </p>
                <p className="text-xs text-text-secondary">Total Attempts</p>
              </CardContent>
            </Card>
            <Card className="card-responsive bg-success/10 border-success/20">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-success-dark">
                  {Math.round(
                    assessmentHistory.reduce((sum, a) => sum + a.score, 0) /
                      assessmentHistory.length,
                  )}
                  %
                </p>
                <p className="text-xs text-text-secondary">Average Score</p>
              </CardContent>
            </Card>
            <Card className="card-responsive bg-info/10 border-info/20">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-info-dark">
                  {Math.max(...assessmentHistory.map((a) => a.score))}%
                </p>
                <p className="text-xs text-text-secondary">Best Score</p>
              </CardContent>
            </Card>
            <Card className="card-responsive bg-warning/10 border-warning/20">
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-warning-dark">
                  {assessmentHistory.filter((a) => a.score >= 60).length}
                </p>
                <p className="text-xs text-text-secondary">Passed (60%+)</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
