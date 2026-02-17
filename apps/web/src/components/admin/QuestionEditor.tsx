"use client";

/**
 * Question Editor Component
 *
 * Allows admins to view and edit IRT item bank questions.
 * Supports editing:
 * - IRT parameters (difficulty, discrimination, guessing)
 * - Active status
 * - Question text and options (view-only for safety)
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  AlertCircle,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IRTQuestion {
  id: string;
  item_code: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: number;
  category: string;
  level: string;
  language: string;
  difficulty: number;
  discrimination: number;
  guessing: number;
  is_active: boolean | null;
  times_administered: number | null;
  times_correct: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface QuestionEditorProps {
  question: IRTQuestion;
  onUpdate: (
    questionId: string,
    updates: Partial<
      Pick<IRTQuestion, "difficulty" | "discrimination" | "guessing" | "is_active">
    >
  ) => Promise<void>;
}

function getDifficultyColor(difficulty: number): string {
  if (difficulty <= -1) return "text-success bg-success/10";
  if (difficulty <= 0.5) return "text-warning bg-warning/10";
  if (difficulty <= 1.5) return "text-accent bg-accent/10";
  return "text-error bg-error/10";
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= -1) return "Easy";
  if (difficulty <= 0.5) return "Medium";
  if (difficulty <= 1.5) return "Hard";
  return "Very Hard";
}

export function QuestionEditor({ question, onUpdate }: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Local edit state
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [discrimination, setDiscrimination] = useState(question.discrimination);
  const [guessing, setGuessing] = useState(question.guessing);
  const [isActive, setIsActive] = useState(question.is_active ?? true);

  const hasChanges =
    difficulty !== question.difficulty ||
    discrimination !== question.discrimination ||
    guessing !== question.guessing ||
    isActive !== (question.is_active ?? true);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(question.id, {
        difficulty,
        discrimination,
        guessing,
        is_active: isActive,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDifficulty(question.difficulty);
    setDiscrimination(question.discrimination);
    setGuessing(question.guessing);
    setIsActive(question.is_active ?? true);
    setIsEditing(false);
  };

  // Calculate accuracy rate
  const accuracyRate =
    question.times_administered && question.times_administered > 0
      ? Math.round(
          ((question.times_correct || 0) / question.times_administered) * 100
        )
      : null;

  const optionKeys = Object.keys(question.options).sort();
  const _correctOptionKey = optionKeys[question.correct_answer] || "?";

  return (
    <Card
      className={cn(
        "overflow-hidden",
        !isActive && "opacity-60 border-dashed"
      )}
    >
      {/* Header Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-surface/50 transition-colors"
      >
        {/* Status Indicator */}
        <div
          className={cn(
            "w-3 h-3 rounded-full shrink-0",
            isActive ? "bg-success" : "bg-surface-dark"
          )}
          title={isActive ? "Active" : "Inactive"}
        />

        {/* Item Code */}
        <code className="text-xs bg-surface px-2 py-1 rounded shrink-0">
          {question.item_code}
        </code>

        {/* Question Preview */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text truncate">
            {question.question_text}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
            <span className="capitalize">{question.category}</span>
            <span>•</span>
            <span className="capitalize">{question.level}</span>
            <span>•</span>
            <span>{question.language.toUpperCase()}</span>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div
          className={cn(
            "px-2 py-1 rounded text-xs font-medium shrink-0",
            getDifficultyColor(question.difficulty)
          )}
        >
          {getDifficultyLabel(question.difficulty)}
        </div>

        {/* Stats */}
        {accuracyRate !== null && (
          <div className="text-xs text-text-tertiary shrink-0">
            {accuracyRate}% ({question.times_administered} attempts)
          </div>
        )}

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-tertiary shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-tertiary shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <CardContent className="border-t border-border bg-white pt-4">
          {/* Question Text */}
          <div className="mb-4">
            <Label className="text-sm text-text-secondary">Question</Label>
            <p className="mt-1 text-text">{question.question_text}</p>
          </div>

          {/* Options */}
          <div className="mb-4">
            <Label className="text-sm text-text-secondary">Options</Label>
            <div className="mt-1 space-y-2">
              {optionKeys.map((key, index) => {
                const isCorrect = index === question.correct_answer;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded border",
                      isCorrect
                        ? "border-success bg-success/5"
                        : "border-border"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        isCorrect
                          ? "bg-success text-white"
                          : "bg-surface-dark text-text-secondary"
                      )}
                    >
                      {key}
                    </span>
                    <span className="flex-1 text-sm">
                      {question.options[key]}
                    </span>
                    {isCorrect && (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* IRT Parameters */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-text">
                IRT Parameters
              </Label>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Difficulty */}
              <div>
                <Label className="text-xs text-text-secondary">
                  Difficulty (b)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 font-medium">{question.difficulty.toFixed(2)}</div>
                )}
                <p className="text-xs text-text-tertiary mt-1">
                  -3 (easy) to +3 (hard)
                </p>
              </div>

              {/* Discrimination */}
              <div>
                <Label className="text-xs text-text-secondary">
                  Discrimination (a)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={discrimination}
                    onChange={(e) =>
                      setDiscrimination(parseFloat(e.target.value))
                    }
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 font-medium">
                    {question.discrimination.toFixed(2)}
                  </div>
                )}
                <p className="text-xs text-text-tertiary mt-1">
                  0 to 3 (higher = more discriminating)
                </p>
              </div>

              {/* Guessing */}
              <div>
                <Label className="text-xs text-text-secondary">
                  Guessing (c)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={guessing}
                    onChange={(e) => setGuessing(parseFloat(e.target.value))}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 font-medium">
                    {question.guessing.toFixed(2)}
                  </div>
                )}
                <p className="text-xs text-text-tertiary mt-1">
                  0 to 0.5 (prob. of lucky guess)
                </p>
              </div>

              {/* Active Status */}
              <div>
                <Label className="text-xs text-text-secondary">Status</Label>
                {isEditing ? (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                        isActive ? "bg-success" : "bg-surface-dark"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                          isActive ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className="ml-2 text-sm">
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    {(question.is_active ?? true) ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="font-medium text-success">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-text-tertiary" />
                        <span className="font-medium text-text-tertiary">Inactive</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-text-tertiary">
            <span>ID: {question.id.slice(0, 8)}...</span>
            {question.created_at && (
              <span>
                Created: {new Date(question.created_at).toLocaleDateString()}
              </span>
            )}
            {question.updated_at && (
              <span>
                Updated: {new Date(question.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
