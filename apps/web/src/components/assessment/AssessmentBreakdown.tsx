"use client";

/**
 * Assessment Breakdown Component
 *
 * Shows per-question details for a completed assessment:
 * - Question text with answer options
 * - User's chosen answer vs correct answer
 * - Time spent per question
 * - IRT difficulty/discrimination info
 *
 * Used on assessment detail pages to show full breakdown.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Brain,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionResponse {
  id: string;
  item_id: string;
  module: string;
  chosen_option: string | null;
  is_correct: boolean | null;
  rt_ms: number | null;
  created_at: string;
}

interface QuestionDetails {
  id: string;
  question_text: string;
  options: Record<string, string>; // { "A": "Option text", "B": "...", etc. }
  correct_answer: string;
  difficulty: number | null;
  discrimination: number | null;
  category: string | null;
}

interface AssessmentBreakdownProps {
  readonly responses: QuestionResponse[];
  readonly questionDetails: Map<string, QuestionDetails>;
  readonly showFilters?: boolean;
}

function formatTime(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getDifficultyLabel(difficulty: number | null): {
  label: string;
  color: string;
} {
  if (difficulty === null) return { label: "Unknown", color: "text-text-tertiary" };
  if (difficulty <= -1) return { label: "Easy", color: "text-success" };
  if (difficulty <= 0.5) return { label: "Medium", color: "text-warning" };
  if (difficulty <= 1.5) return { label: "Hard", color: "text-primary" };
  return { label: "Very Hard", color: "text-error" };
}

type FilterMode = "all" | "correct" | "incorrect";

export function AssessmentBreakdown({
  responses,
  questionDetails,
  showFilters = true,
}: AssessmentBreakdownProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const toggleExpanded = (responseId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(responseId)) {
      newExpanded.delete(responseId);
    } else {
      newExpanded.add(responseId);
    }
    setExpandedQuestions(newExpanded);
  };

  const expandAll = () => {
    setExpandedQuestions(new Set(responses.map((r) => r.id)));
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  // Filter responses
  const filteredResponses = responses.filter((r) => {
    if (filterMode === "correct") return r.is_correct === true;
    if (filterMode === "incorrect") return r.is_correct === false;
    return true;
  });

  // Stats
  const correctCount = responses.filter((r) => r.is_correct === true).length;
  const incorrectCount = responses.filter((r) => r.is_correct === false).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filter Buttons */}
        {showFilters && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <button
              onClick={() => setFilterMode("all")}
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors",
                filterMode === "all"
                  ? "bg-primary text-white"
                  : "bg-surface hover:bg-surface-dark"
              )}
            >
              All ({responses.length})
            </button>
            <button
              onClick={() => setFilterMode("correct")}
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors",
                filterMode === "correct"
                  ? "bg-success text-white"
                  : "bg-surface hover:bg-surface-dark"
              )}
            >
              Correct ({correctCount})
            </button>
            <button
              onClick={() => setFilterMode("incorrect")}
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors",
                filterMode === "incorrect"
                  ? "bg-error text-white"
                  : "bg-surface hover:bg-surface-dark"
              )}
            >
              Incorrect ({incorrectCount})
            </button>
          </div>
        )}

        {/* Expand/Collapse */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredResponses.map((response, index) => {
          const details = questionDetails.get(response.item_id);
          const isExpanded = expandedQuestions.has(response.id);
          const isCorrect = response.is_correct === true;
          const difficulty = getDifficultyLabel(details?.difficulty ?? null);

          return (
            <Card
              key={response.id}
              className={cn(
                "overflow-hidden transition-colors",
                isCorrect
                  ? "border-success/30 bg-success/5"
                  : "border-error/30 bg-error/5"
              )}
            >
              {/* Header - Always Visible */}
              <button
                onClick={() => toggleExpanded(response.id)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/50 transition-colors"
              >
                {/* Question Number */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-medium",
                    isCorrect ? "bg-success" : "bg-error"
                  )}
                >
                  {index + 1}
                </div>

                {/* Status Icon */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    isCorrect
                      ? "bg-success/10 text-success"
                      : "bg-error/10 text-error"
                  )}
                >
                  {isCorrect ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </div>

                {/* Question Preview */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text truncate">
                    {details?.question_text || `Question ${index + 1}`}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                    <span className="capitalize">{response.module}</span>
                    <span>•</span>
                    <span className={difficulty.color}>{difficulty.label}</span>
                    {response.rt_ms && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(response.rt_ms)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-tertiary" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && details && (
                <CardContent className="border-t border-border bg-white pt-4">
                  {/* Full Question Text */}
                  <div className="mb-4">
                    <h4 className="font-medium text-text mb-2">Question:</h4>
                    <p className="text-text-secondary">
                      {details.question_text}
                    </p>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-text">Answer Options:</h4>
                    {Object.entries(details.options).map(([key, text]) => {
                      const isChosen = response.chosen_option === key;
                      const isCorrectAnswer = details.correct_answer === key;

                      return (
                        <div
                          key={key}
                          className={cn(
                            "p-3 rounded-lg border-2 flex items-start gap-3",
                            isCorrectAnswer
                              ? "border-success bg-success/10"
                              : isChosen
                                ? "border-error bg-error/10"
                                : "border-border bg-surface"
                          )}
                        >
                          {/* Option Key */}
                          <span
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                              isCorrectAnswer
                                ? "bg-success text-white"
                                : isChosen
                                  ? "bg-error text-white"
                                  : "bg-surface-dark text-text-secondary"
                            )}
                          >
                            {key}
                          </span>

                          {/* Option Text */}
                          <span className="flex-1 text-text-secondary">
                            {text}
                          </span>

                          {/* Indicator Icons */}
                          {isCorrectAnswer && (
                            <Check className="w-5 h-5 text-success shrink-0" />
                          )}
                          {isChosen && !isCorrectAnswer && (
                            <X className="w-5 h-5 text-error shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* IRT Info (if available) */}
                  {(details.difficulty !== null ||
                    details.discrimination !== null) && (
                    <div className="flex items-center gap-4 text-xs text-text-tertiary pt-3 border-t border-border">
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        IRT Parameters:
                      </span>
                      {details.difficulty !== null && (
                        <span>
                          Difficulty: {details.difficulty.toFixed(2)}
                        </span>
                      )}
                      {details.discrimination !== null && (
                        <span>
                          Discrimination: {details.discrimination.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredResponses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">
              {filterMode === "correct" ? "🎉" : filterMode === "incorrect" ? "✨" : "📝"}
            </div>
            <h3 className="font-medium text-text mb-1">
              {filterMode === "correct"
                ? "No correct answers to show"
                : filterMode === "incorrect"
                  ? "Great! No incorrect answers!"
                  : "No questions found"}
            </h3>
            <p className="text-sm text-text-secondary">
              {filterMode !== "all" && "Try changing the filter to see more questions."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
