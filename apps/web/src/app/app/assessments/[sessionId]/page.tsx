import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AssessmentBreakdown } from "@/components/assessment/AssessmentBreakdown";
import { ArrowLeft, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";

/**
 * Assessment Detail Page
 *
 * Shows detailed per-question breakdown for a completed assessment session.
 * Displays:
 * - Overall score and stats
 * - Per-question analysis with correct/incorrect status
 * - Question text and answer options
 * - Time spent per question
 * - IRT difficulty parameters
 */

interface QuestionDetails {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  difficulty: number | null;
  discrimination: number | null;
  category: string | null;
}

// Format time helper (kept for potential future use)
function _formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes} minutes`;
}

// Get score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-warning/10";
  return "bg-error/10";
}

export default async function AssessmentDetailPage({
  params,
}: Readonly<{
  params: Promise<{ sessionId: string }>;
}>) {
  const resolvedParams = await params;
  const sessionId = resolvedParams.sessionId;

  const user = await getCurrentUser();

  if (!user) {
    redirect("/student/start");
  }

  const supabase = await createClient();

  // PERF: Fetch session and responses in parallel (both use sessionId from URL)
  const [sessionResult, responsesResult] = await Promise.all([
    supabase
      .from("assessment_sessions")
      .select("id, user_id, started_at, submitted_at")
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("assessment_responses")
      .select("id, item_id, module, chosen_option, is_correct, rt_ms, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true }),
  ]);

  const { data: session, error: sessionError } = sessionResult;
  const { data: responses, error: responsesError } = responsesResult;

  if (sessionError || !session || session.user_id !== user.id) {
    redirect("/app/student/assessments");
  }

  if (responsesError || !responses || responses.length === 0) {
    redirect("/app/student/assessments");
  }

  // Fetch IRT item details (depends on response item_ids)
  const itemIds = responses.map((r) => r.item_id);
  const { data: irtItems } = await supabase
    .from("irt_item_bank")
    .select(
      "id, question_text, options, correct_answer, difficulty, discrimination, category"
    )
    .in("id", itemIds);

  // Create question details map
  const questionDetailsMap = new Map<string, QuestionDetails>();

  if (irtItems) {
    for (const item of irtItems) {
      questionDetailsMap.set(item.id, {
        id: item.id,
        question_text: item.question_text || "Question text unavailable",
        options: (item.options as Record<string, string>) || {},
        correct_answer: item.correct_answer || "",
        difficulty: item.difficulty,
        discrimination: item.discrimination,
        category: item.category,
      });
    }
  }

  // Calculate stats
  const totalQuestions = responses.length;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  for (const r of responses) {
    if (r.is_correct === true) correctAnswers++;
    else if (r.is_correct === false) incorrectAnswers++;
  }
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const totalTimeMs = responses.reduce((sum, r) => sum + (r.rt_ms || 0), 0);
  const avgTimeMs = Math.round(totalTimeMs / totalQuestions);

  // Module breakdown
  const moduleStats = responses.reduce(
    (acc, r) => {
      if (!acc[r.module]) {
        acc[r.module] = { total: 0, correct: 0 };
      }
      acc[r.module].total++;
      if (r.is_correct) {
        acc[r.module].correct++;
      }
      return acc;
    },
    {} as Record<string, { total: number; correct: number }>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/app/student/assessments"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assessments
          </Link>
          <h1 className="heading-1 text-primary mb-2">Assessment Details</h1>
          <p className="text-text-secondary text-sm">
            Completed on{" "}
            {session.submitted_at
              ? new Date(session.submitted_at).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "In progress"}
          </p>
        </div>

        {/* Score Summary Card */}
        <Card className="mb-6 overflow-hidden">
          <div
            className={`p-6 ${getScoreBg(score)} border-b border-border`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Score Circle */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold ${getScoreColor(score)} bg-white shadow-lg`}
                >
                  {score}%
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text">
                    {score >= 80
                      ? "Excellent!"
                      : score >= 60
                        ? "Good Job!"
                        : "Keep Learning!"}
                  </h2>
                  <p className="text-sm sm:text-base text-text-secondary">
                    {correctAnswers} of {totalQuestions} correct
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 sm:gap-6 text-center">
                <div>
                  <div className="flex items-center gap-1 justify-center text-success">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xl sm:text-2xl font-bold">{correctAnswers}</span>
                  </div>
                  <p className="text-xs text-text-secondary">Correct</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 justify-center text-error">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xl sm:text-2xl font-bold">{incorrectAnswers}</span>
                  </div>
                  <p className="text-xs text-text-secondary">Incorrect</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 justify-center text-info">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xl sm:text-2xl font-bold">
                      {Math.round(avgTimeMs / 1000)}s
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">Avg Time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Module Breakdown */}
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-text-tertiary" />
              <h3 className="font-medium text-text">Performance by Module</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(moduleStats).map(([module, stats]) => {
                const moduleScore = Math.round(
                  (stats.correct / stats.total) * 100
                );
                return (
                  <div
                    key={module}
                    className="p-3 bg-surface rounded-lg text-center"
                  >
                    <div className={`text-lg font-bold ${getScoreColor(moduleScore)}`}>
                      {moduleScore}%
                    </div>
                    <div className="text-xs text-text-secondary capitalize truncate">
                      {module.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {stats.correct}/{stats.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Question Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Question-by-Question Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentBreakdown
              responses={responses}
              questionDetails={questionDetailsMap}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/app/assessment/start">
            <Button className="w-full sm:w-auto">Retake Assessment</Button>
          </Link>
          <Link href="/app/curriculum">
            <Button variant="outline" className="w-full sm:w-auto">
              Continue Learning
            </Button>
          </Link>
          <Link href="/app/dashboard">
            <Button variant="ghost" className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
