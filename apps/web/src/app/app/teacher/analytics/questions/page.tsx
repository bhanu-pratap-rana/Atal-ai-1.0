import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Lightbulb,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

/**
 * Practice Question Analytics Page
 *
 * Shows teachers performance analytics for practice questions used in lessons:
 * - Question success rates
 * - Average response times
 * - AI hint usage patterns
 * - Most/least difficult questions
 *
 * Data comes from formative_responses table joined with practice_questions.
 */

interface QuestionStats {
  questionId: string;
  questionText: string;
  topicId: string;
  moduleId: string;
  totalAttempts: number;
  correctCount: number;
  avgTimeMs: number;
  hintUsageCount: number;
  difficulty: string | null;
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 80) return "text-success";
  if (rate >= 60) return "text-warning";
  if (rate >= 40) return "text-accent";
  return "text-error";
}

function formatTime(ms: number): string {
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default async function PracticeQuestionAnalyticsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/teacher/start");
  }

  const supabase = await createClient();

  // Verify teacher role (teacher_profiles PK is user_id, not id)
  const { data: teacherProfile } = await supabase
    .from("teacher_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!teacherProfile) {
    redirect("/teacher/start");
  }

  // Fetch practice questions (bounded)
  const { data: questions, error: questionsError } = await supabase
    .from("practice_questions")
    .select("id, question, topic_id, module_id, difficulty")
    .order("module_id")
    .limit(500);

  if (questionsError) {
    authLogger.error("[QuestionAnalytics] Failed to fetch questions:", { error: questionsError.message });
  }

  // Fetch formative responses (bounded to prevent unbounded scan)
  const { data: responses, error: responsesError } = await supabase
    .from("formative_responses")
    .select("question_id, is_correct, response_time_ms, ai_hint_requested")
    .limit(10000);

  if (responsesError) {
    authLogger.error("[QuestionAnalytics] Failed to fetch responses:", { error: responsesError.message });
  }

  // Aggregate stats by question
  const statsMap = new Map<string, QuestionStats>();

  if (questions) {
    for (const q of questions) {
      statsMap.set(q.id, {
        questionId: q.id,
        questionText: q.question,
        topicId: q.topic_id,
        moduleId: q.module_id,
        totalAttempts: 0,
        correctCount: 0,
        avgTimeMs: 0,
        hintUsageCount: 0,
        difficulty: q.difficulty,
      });
    }
  }

  // Process responses
  const timeAccumulator = new Map<string, { total: number; count: number }>();

  if (responses) {
    for (const r of responses) {
      const stats = statsMap.get(r.question_id);
      if (stats) {
        stats.totalAttempts++;
        if (r.is_correct) stats.correctCount++;
        if (r.ai_hint_requested) stats.hintUsageCount++;

        // Track time for averaging
        if (r.response_time_ms) {
          const timeData = timeAccumulator.get(r.question_id) || {
            total: 0,
            count: 0,
          };
          timeData.total += r.response_time_ms;
          timeData.count++;
          timeAccumulator.set(r.question_id, timeData);
        }
      }
    }
  }

  // Calculate averages
  for (const [questionId, timeData] of timeAccumulator) {
    const stats = statsMap.get(questionId);
    if (stats && timeData.count > 0) {
      stats.avgTimeMs = Math.round(timeData.total / timeData.count);
    }
  }

  // Convert to array and filter questions with at least 1 attempt
  const questionStats = Array.from(statsMap.values()).filter(
    (s) => s.totalAttempts > 0
  );

  // Sort by total attempts (most attempted first)
  const sortedStats = [...questionStats].sort(
    (a, b) => b.totalAttempts - a.totalAttempts
  );

  // Calculate overall metrics
  const totalAttempts = questionStats.reduce(
    (sum, q) => sum + q.totalAttempts,
    0
  );
  const totalCorrect = questionStats.reduce((sum, q) => sum + q.correctCount, 0);
  const totalHints = questionStats.reduce((sum, q) => sum + q.hintUsageCount, 0);
  const overallSuccessRate =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const hintUsageRate =
    totalAttempts > 0 ? Math.round((totalHints / totalAttempts) * 100) : 0;

  // Find hardest and easiest questions
  const questionsWithMinAttempts = questionStats.filter(
    (q) => q.totalAttempts >= 3
  );
  const sortedByDifficulty = [...questionsWithMinAttempts].sort(
    (a, b) =>
      a.correctCount / a.totalAttempts - b.correctCount / b.totalAttempts
  );
  const hardestQuestions = sortedByDifficulty.slice(0, 5);
  const easiestQuestions = sortedByDifficulty.slice(-5).reverse();

  // Group by module
  const moduleStats = questionStats.reduce(
    (acc, q) => {
      if (!acc[q.moduleId]) {
        acc[q.moduleId] = { total: 0, correct: 0, questions: 0 };
      }
      acc[q.moduleId].total += q.totalAttempts;
      acc[q.moduleId].correct += q.correctCount;
      acc[q.moduleId].questions++;
      return acc;
    },
    {} as Record<string, { total: number; correct: number; questions: number }>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-surface page-layout">
      <div className="container-responsive max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/app/teacher/dashboard"
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="heading-1 text-primary mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Practice Question Analytics
          </h1>
          <p className="text-text-secondary text-sm">
            Performance insights for lesson practice questions
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {totalAttempts.toLocaleString()}
              </p>
              <p className="text-xs text-text-secondary">Total Attempts</p>
            </CardContent>
          </Card>
          <Card className="bg-success/10 border-success/30">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-success">
                {overallSuccessRate}%
              </p>
              <p className="text-xs text-text-secondary">Success Rate</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-warning">
                {hintUsageRate}%
              </p>
              <p className="text-xs text-text-secondary">Hint Usage</p>
            </CardContent>
          </Card>
          <Card className="bg-info/10 border-info/30">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-info">
                {questionStats.length}
              </p>
              <p className="text-xs text-text-secondary">Questions Answered</p>
            </CardContent>
          </Card>
        </div>

        {/* Module Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Performance by Module</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(moduleStats).length === 0 ? (
              <p className="text-text-secondary text-center py-4">
                No module data available yet
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(moduleStats).map(([moduleId, stats]) => {
                  const successRate =
                    stats.total > 0
                      ? Math.round((stats.correct / stats.total) * 100)
                      : 0;
                  return (
                    <div
                      key={moduleId}
                      className="p-4 bg-surface rounded-lg text-center"
                    >
                      <div
                        className={`text-2xl font-bold ${getSuccessRateColor(successRate)}`}
                      >
                        {successRate}%
                      </div>
                      <div className="text-sm text-text capitalize mt-1 truncate">
                        {moduleId.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {stats.total} attempts • {stats.questions} questions
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Hardest Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-error" />
                Most Challenging Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hardestQuestions.length === 0 ? (
                <p className="text-text-secondary text-center py-4">
                  Not enough data yet (min. 3 attempts per question)
                </p>
              ) : (
                <div className="space-y-3">
                  {hardestQuestions.map((q, index) => {
                    const rate = Math.round(
                      (q.correctCount / q.totalAttempts) * 100
                    );
                    return (
                      <div
                        key={q.questionId}
                        className="p-3 bg-error/10 rounded-lg border border-error/20"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-error text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text line-clamp-2">
                              {q.questionText}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                              <span
                                className={`font-medium ${getSuccessRateColor(rate)}`}
                              >
                                {rate}% success
                              </span>
                              <span>•</span>
                              <span>{q.totalAttempts} attempts</span>
                              {q.hintUsageCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3" />
                                    {q.hintUsageCount} hints
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Easiest Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Well-Mastered Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {easiestQuestions.length === 0 ? (
                <p className="text-text-secondary text-center py-4">
                  Not enough data yet (min. 3 attempts per question)
                </p>
              ) : (
                <div className="space-y-3">
                  {easiestQuestions.map((q, index) => {
                    const rate = Math.round(
                      (q.correctCount / q.totalAttempts) * 100
                    );
                    return (
                      <div
                        key={q.questionId}
                        className="p-3 bg-success/5 rounded-lg border border-success/20"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text line-clamp-2">
                              {q.questionText}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                              <span
                                className={`font-medium ${getSuccessRateColor(rate)}`}
                              >
                                {rate}% success
                              </span>
                              <span>•</span>
                              <span>{q.totalAttempts} attempts</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(q.avgTimeMs)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Questions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Question Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedStats.length === 0 ? (
              <p className="text-text-secondary text-center py-8">
                No practice question responses recorded yet. Students need to
                answer practice questions in lessons for data to appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-text-secondary">
                        Question
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Module
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Attempts
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Success Rate
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Avg Time
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Hints
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStats.slice(0, 20).map((q) => {
                      const rate = Math.round(
                        (q.correctCount / q.totalAttempts) * 100
                      );
                      return (
                        <tr
                          key={q.questionId}
                          className="border-b border-border hover:bg-surface"
                        >
                          <td className="py-2 px-3 max-w-[300px]">
                            <p className="truncate">{q.questionText}</p>
                          </td>
                          <td className="py-2 px-3 text-center capitalize text-text-secondary">
                            {q.moduleId.replace(/_/g, " ")}
                          </td>
                          <td className="py-2 px-3 text-center font-medium">
                            {q.totalAttempts}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`font-medium ${getSuccessRateColor(rate)}`}
                            >
                              {rate}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-text-secondary">
                            {formatTime(q.avgTimeMs)}
                          </td>
                          <td className="py-2 px-3 text-center text-text-secondary">
                            {q.hintUsageCount > 0 ? (
                              <span className="flex items-center justify-center gap-1">
                                <Lightbulb className="w-4 h-4 text-warning" />
                                {q.hintUsageCount}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sortedStats.length > 20 && (
                  <p className="text-center text-xs text-text-tertiary mt-3">
                    Showing top 20 of {sortedStats.length} questions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
