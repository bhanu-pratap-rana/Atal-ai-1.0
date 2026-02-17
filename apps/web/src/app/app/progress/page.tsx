import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getProgressStats } from "@/app/actions/dashboard-stats";

// Format time in minutes to readable string
function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

// Get score progress bar color based on performance level
function getScoreColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-error";
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/start");
  }

  // Fetch real progress stats
  const result = await getProgressStats();
  const stats = result.success ? result.data : null;

  // Check if user has any data
  const hasData =
    (stats?.assessmentsTaken ?? 0) > 0 || (stats?.moduleBreakdown?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-6xl">
        {/* Header */}
        <div className="mb-responsive text-center sm:text-left">
          <Link
            href="/app/dashboard"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm md:text-base touch-target"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="heading-1 text-primary mb-2">📊 Progress</h1>
          <p className="text-text-secondary text-sm md:text-base">
            Track your learning journey and performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-responsive mb-responsive">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 card-responsive">
            <CardHeader className="pb-2">
              <CardTitle className="text-primary-dark text-sm md:text-base">
                Courses Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {stats?.coursesCompleted ?? 0}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Score ≥60% to complete
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent-light to-accent-light/50 border-accent/30 card-responsive">
            <CardHeader className="pb-2">
              <CardTitle className="text-accent-dark text-sm md:text-base">
                Assessments Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold text-accent-dark">
                {stats?.assessmentsTaken ?? 0}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Total completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success-light to-success-light/50 border-success/30 card-responsive">
            <CardHeader className="pb-2">
              <CardTitle className="text-success-dark text-sm md:text-base">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold text-success-dark">
                {stats?.averageScore == null ? "--" : `${stats.averageScore}%`}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Across all attempts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-info-light to-info-light/50 border-info/30 card-responsive">
            <CardHeader className="pb-2">
              <CardTitle className="text-info-dark text-sm md:text-base">
                Time Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl md:text-4xl font-bold text-info-dark">
                {stats?.totalTimeSpent
                  ? formatTime(stats.totalTimeSpent)
                  : "--"}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Total learning time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Breakdown */}
        {hasData && (stats?.moduleBreakdown?.length ?? 0) > 0 && (
          <Card className="card-responsive mb-responsive">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Module Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* TYPE-001 FIX: Use optional chaining instead of non-null assertion */}
                {stats?.moduleBreakdown?.map((module) => (
                  <div key={module.module}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-text-primary">
                        {module.module}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {module.correctAnswers}/{module.questionsAttempted}{" "}
                        correct ({module.averageScore}%)
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${getScoreColor(module.averageScore)}`}
                        style={{ width: `${module.averageScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Assessments */}
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasData && (stats?.recentAssessments?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {/* TYPE-002 FIX: Use optional chaining instead of non-null assertion */}
                {stats?.recentAssessments?.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-light"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(assessment.score)}`}
                      >
                        {assessment.score}%
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          Assessment Completed
                        </p>
                        <p className="text-xs text-text-secondary">
                          {assessment.totalQuestions} questions •{" "}
                          {Math.round(assessment.timeSpent / 60)}m
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-text-tertiary">
                      {formatRelativeTime(assessment.completedAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-text-tertiary text-base md:text-lg font-medium">
                  No activity yet
                </p>
                <p className="text-text-secondary text-sm mt-2 px-4 max-w-md mx-auto">
                  Take your first assessment to start tracking your learning
                  progress and see detailed performance metrics here.
                </p>
                <Link
                  href="/app/assessment/start"
                  className="inline-flex items-center justify-center mt-4 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Start Your First Assessment
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
