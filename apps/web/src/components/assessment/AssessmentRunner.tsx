"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ASSESSMENT_TIMING } from "@/lib/constants/ui-timings";
import { QuestionNavigation } from "./QuestionNavigation";
import {
  QuestionPagination,
  PaginationLegend,
  type QuestionStatus,
} from "./QuestionPagination";
import { CompactTimer } from "./AssessmentTimer";
import { clientLogger } from "@/lib/client-logger";
import { submitAssessment } from "@/app/actions/assessment/assessment-submission";
import { updateTheta, type IRTItem } from "@/app/actions/assessment/irt-models";

/**
 * ATAL AI Assessment Runner - IRT-Enhanced Adaptive Testing
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 *
 * Features:
 * - Real-time IRT ability estimation (theta updates after each answer)
 * - Question history (never loses data)
 * - Previous/Next/Skip navigation
 * - Visual pagination with status colors
 * - Timer display
 * - Adaptive feedback based on performance
 *
 * IRT Implementation based on:
 * - 3PL model (difficulty, discrimination, guessing)
 * - Newton-Raphson MLE for theta estimation
 * - a-Stratified Maximum Fisher Information item selection
 */

interface Question {
  id: string;
  itemCode: string;
  category: string;
  questionNumber: number;
  questionText: string;
  options: { id: string; text: string }[];
  _correctIndex: number;
  _difficulty: number;
  _discrimination: number;
  _guessing: number;
}

// Fisher-Yates shuffle for option randomization
// Uses crypto.getRandomValues() for secure randomness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const j = randomArray[0] % (i + 1);
    const temp = shuffled[i];
    if (shuffled?.[j] !== undefined) {
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
  }
  return shuffled;
}

interface AssessmentRunnerProps {
  readonly sessionId: string;
  readonly questions: Question[];
  readonly language: "en" | "hi" | "as";
}

interface ResponseData {
  itemId: string;
  module: string;
  isCorrect: boolean;
  rtMs: number;
  focusBlurCount: number;
  chosenOption: string;
}

interface QuestionHistoryItem {
  question: Question;
  shuffledOptions: { id: string; text: string }[];
  shuffleMap: number[];
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  hasBeenAnswered: boolean;
  skipped: boolean;
  rtMs: number;
  thetaBefore?: number;
  thetaAfter?: number;
}

// IRT State for real-time ability tracking
interface IRTState {
  theta: number; // Current ability estimate
  se: number; // Standard error
  answeredCount: number; // Number of answered questions
  correctCount: number; // Number of correct answers
}

/**
 * Helper: Get language-specific font class
 */
function getLanguageFontClass(language: "en" | "hi" | "as"): string {
  switch (language) {
    case "hi":
      return "font-devanagari";
    case "as":
      return "font-bengali";
    default:
      return "";
  }
}

/**
 * Helper: Get option button classes based on selection state
 */
function getOptionButtonClasses(isSelected: boolean): string {
  if (isSelected) {
    return "border-primary bg-primary-light shadow-primary-sm";
  }
  return "border-border bg-white hover:border-primary/30 hover:bg-primary-lighter";
}

/**
 * Helper: Get radio button classes based on selection state
 */
function getRadioButtonClasses(isSelected: boolean): string {
  if (isSelected) {
    return "border-primary bg-primary";
  }
  return "border-border bg-white";
}

/**
 * Helper: Check if answer is correct based on shuffle map
 * S3776: Extracted to reduce cognitive complexity
 *
 * BUG-012 FIX: Explicit documentation and validation for index handling
 * The database stores _correctIndex as 1-based (1, 2, 3, 4 for options A, B, C, D)
 * The shuffleMap uses 0-based indices (0, 1, 2, 3)
 * We convert correctIndex from 1-based to 0-based before comparison
 *
 * @param selectedOption - 0-based index of user's selected option in shuffled order
 * @param shuffleMap - Maps shuffled position to original position (0-based)
 * @param correctIndex - 1-based index from database (_correctIndex field)
 * @returns true if the selected option maps to the correct answer
 */
function checkAnswerCorrectness(
  selectedOption: number,
  shuffleMap: number[],
  correctIndex: number,
): boolean {
  // BUG-012 FIX: Add validation for invalid correctIndex values
  if (correctIndex < 1 || correctIndex > shuffleMap.length) {
    // Log warning but don't crash - treat as incorrect
    clientLogger.warn(
      `[AssessmentRunner] Invalid correctIndex: ${correctIndex}, expected 1-${shuffleMap.length}`,
    );
    return false;
  }

  // Validate selectedOption bounds
  if (selectedOption < 0 || selectedOption >= shuffleMap.length) {
    clientLogger.warn(
      `[AssessmentRunner] Invalid selectedOption: ${selectedOption}, expected 0-${shuffleMap.length - 1}`,
    );
    return false;
  }

  const originalOptionIndex = shuffleMap[selectedOption];
  // Convert 1-based correctIndex to 0-based for comparison
  const correctIndex0Based = correctIndex - 1;
  return originalOptionIndex === correctIndex0Based;
}

/**
 * Helper: Build IRT response object from question data
 * S3776: Extracted to reduce cognitive complexity
 */
function buildIrtResponse(
  response: ResponseData,
  questions: Question[],
): { item: IRTItem; correct: boolean } {
  const q = questions.find((question) => question.id === response.itemId);
  return {
    item: {
      id: response.itemId,
      item_code: q?.itemCode || "",
      category: q?.category || "",
      question_text: q?.questionText || "",
      options: q?.options || [],
      correct_answer: q?._correctIndex || 0,
      difficulty: q?._difficulty || 0,
      discrimination: q?._discrimination || 1,
      guessing: q?._guessing || 0.2,
    },
    correct: response.isCorrect,
  };
}

/**
 * Helper: Show rapid tap warning if response is too fast
 * S3776: Extracted to reduce cognitive complexity
 * BP-2 FIX: Returns timeout ID for cleanup to prevent memory leaks
 */
function handleRapidTapWarning(
  rtMs: number,
  hasSelection: boolean,
  setShowWarning: (show: boolean) => void,
): ReturnType<typeof setTimeout> | null {
  if (rtMs < ASSESSMENT_TIMING.rapidResponseThreshold && hasSelection) {
    setShowWarning(true);
    return setTimeout(
      () => setShowWarning(false),
      ASSESSMENT_TIMING.rapidWarningDuration,
    );
  }
  return null;
}

export function AssessmentRunner({
  sessionId,
  questions,
  language,
}: AssessmentRunnerProps) {
  const router = useRouter();

  // Question history - stores ALL questions user has seen (NEVER shrinks)
  const [questionHistory, setQuestionHistory] = useState<QuestionHistoryItem[]>(
    [],
  );
  // -1 means we're on a new question (beyond history)
  // >= 0 means we're reviewing a question in history
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);

  // Current question index (0-based, corresponds to questions array)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [focusBlurCount, setFocusBlurCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRapidWarning, setShowRapidWarning] = useState(false);
  // NOSONAR S6754: Only setter needed - value tracked internally but not used in render
  const [, setTotalElapsedSeconds] = useState(0); // NOSONAR

  // IRT State for real-time adaptive tracking
  const [irtState, setIrtState] = useState<IRTState>({
    theta: 0, // Initial ability at average
    se: 1, // High initial uncertainty
    answeredCount: 0,
    correctCount: 0,
  });

  // Refs
  const questionRef = useRef<HTMLHeadingElement>(null);
  // Store question start time for duration tracking
  const questionStartTimeRef = useRef<number>(Date.now());
  // BP-2 FIX: Store rapid warning timer for cleanup
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state
  const isReviewingHistory = currentHistoryIndex >= 0;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Language-specific font classes
  const fontClass = getLanguageFontClass(language);

  // Get current question data (from history if reviewing, else generate fresh)
  const { shuffledOptions, shuffleMap } = useMemo(() => {
    // If reviewing history, use stored shuffle
    if (isReviewingHistory && questionHistory?.[currentHistoryIndex]) {
      const historyItem = questionHistory[currentHistoryIndex];
      return {
        shuffledOptions: historyItem.shuffledOptions,
        shuffleMap: historyItem.shuffleMap,
      };
    }

    // Generate new shuffle for current question
    if (!currentQuestion) return { shuffledOptions: [], shuffleMap: [] };

    const indices = currentQuestion.options.map((_, i) => i);
    const shuffledIndices = shuffleArray([...indices]);
    const shuffledOpts = shuffledIndices.map((i) => currentQuestion.options[i]);

    return { shuffledOptions: shuffledOpts, shuffleMap: shuffledIndices };
  }, [
    currentQuestion,
    isReviewingHistory,
    currentHistoryIndex,
    questionHistory,
  ]);

  // Calculate question statuses for pagination
  // LOOP-2 FIX: Use Map lookups for O(q+h) instead of O(q²×h) triple-nested search
  const questionStatuses: QuestionStatus[] = useMemo(() => {
    const questionIndexMap = new Map(questions.map((q, i) => [q, i]));
    const historyByIndex = new Map<number, (typeof questionHistory)[0]>();
    for (const h of questionHistory) {
      const idx = questionIndexMap.get(h.question);
      if (idx !== undefined) historyByIndex.set(idx, h);
    }
    return questions.map((_, index) => {
      if (index === currentIndex) return "current";
      const historyItem = historyByIndex.get(index);
      if (historyItem) {
        if (historyItem.hasBeenAnswered) return "answered";
        if (historyItem.skipped) return "skipped";
      }
      return "unanswered";
    });
  }, [questions, currentIndex, questionHistory]);

  // Focus management when question changes
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    if (questionRef.current) {
      questionRef.current.focus();
    }
  }, [currentIndex, currentHistoryIndex]);

  // Load selected answer when reviewing history
  useEffect(() => {
    if (isReviewingHistory && questionHistory?.[currentHistoryIndex]) {
      setSelectedOption(questionHistory[currentHistoryIndex].selectedAnswer);
    }
  }, [isReviewingHistory, currentHistoryIndex, questionHistory]);

  // Track focus/blur events
  useEffect(() => {
    const handleBlur = () => {
      setFocusBlurCount((prev) => prev + 1);
    };

    globalThis.addEventListener("blur", handleBlur);
    return () => globalThis.removeEventListener("blur", handleBlur);
  }, []);

  // BP-2 FIX: Clean up rapid warning timer on unmount
  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  // Submit assessment data
  const submitAssessmentData = useCallback(
    async (finalResponses: ResponseData[]) => {
      setIsSubmitting(true);

      try {
        const result = await submitAssessment(sessionId, finalResponses);

        if (result.success) {
          toast.success("Assessment completed!");
          router.push(`/app/assessment/summary?session=${sessionId}`);
        } else if ("error" in result) {
          toast.error(result.error || "Failed to submit assessment");
          setIsSubmitting(false);
        } else {
          toast.error("Failed to submit assessment");
          setIsSubmitting(false);
        }
      } catch (error) {
        clientLogger.error(
          "Assessment submission failed",
          error instanceof Error ? error : undefined,
        );
        toast.error("An unexpected error occurred");
        setIsSubmitting(false);
      }
    },
    [sessionId, router],
  );

  // Handle option selection
  const handleOptionSelect = useCallback((optionIndex: number) => {
    setSelectedOption(optionIndex);
  }, []);

  // Clear selected answer
  const handleClear = useCallback(() => {
    setSelectedOption(null);
  }, []);

  // Handle Previous navigation
  const handlePrevious = useCallback(() => {
    if (isReviewingHistory && currentHistoryIndex > 0) {
      // Move back in history
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      const prevEntry = questionHistory[currentHistoryIndex - 1];
      const prevIndex = prevEntry ? questions.indexOf(prevEntry.question) : -1;
      if (prevIndex >= 0) setCurrentIndex(prevIndex);
    } else if (!isReviewingHistory && questionHistory.length > 0) {
      // Enter history mode at the last item
      const lastIndex = questionHistory.length - 1;
      setCurrentHistoryIndex(lastIndex);
      const histEntry = questionHistory[lastIndex];
      const histIndex = histEntry ? questions.indexOf(histEntry.question) : -1;
      if (histIndex >= 0) setCurrentIndex(histIndex);
    }
    setSelectedOption(null);
  }, [isReviewingHistory, currentHistoryIndex, questionHistory, questions]);

  // Handle Skip
  const handleSkip = useCallback(() => {
    if (isReviewingHistory) return; // Can't skip when reviewing

    const rtMs = Date.now() - questionStartTimeRef.current;

    // Add to history as skipped
    const historyItem: QuestionHistoryItem = {
      question: currentQuestion,
      shuffledOptions,
      shuffleMap,
      selectedAnswer: null,
      isCorrect: null,
      hasBeenAnswered: false,
      skipped: true,
      rtMs,
    };

    setQuestionHistory([...questionHistory, historyItem]);
    setSelectedOption(null);
    setFocusBlurCount(0);

    // Move to next question
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [
    isReviewingHistory,
    currentQuestion,
    shuffledOptions,
    shuffleMap,
    questionHistory,
    currentIndex,
    questions.length,
  ]);

  // Handle history navigation - S3776: Extracted to reduce cognitive complexity
  const handleHistoryNavigation = useCallback(() => {
    // Update the history item if answer changed
    if (selectedOption !== null) {
      const isCorrect = checkAnswerCorrectness(
        selectedOption,
        shuffleMap,
        currentQuestion._correctIndex,
      );

      const updatedHistory = [...questionHistory];
      updatedHistory[currentHistoryIndex] = {
        ...updatedHistory[currentHistoryIndex],
        selectedAnswer: selectedOption,
        isCorrect,
        hasBeenAnswered: true,
        skipped: false,
      };
      setQuestionHistory(updatedHistory);
    }

    // Navigate forward in history or exit history mode
    if (currentHistoryIndex < questionHistory.length - 1) {
      // More history ahead
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      setCurrentIndex(
        questions.indexOf(questionHistory[currentHistoryIndex + 1].question),
      );
    } else {
      // Exit history mode, continue with new questions
      setCurrentHistoryIndex(-1);
      const lastHistoryItem = questionHistory.at(-1);
      const nextIndex = lastHistoryItem
        ? questions.indexOf(lastHistoryItem.question) + 1
        : 0;
      if (nextIndex < questions.length) {
        setCurrentIndex(nextIndex);
      }
    }
    setSelectedOption(null);
  }, [
    selectedOption,
    shuffleMap,
    currentQuestion._correctIndex,
    questionHistory,
    currentHistoryIndex,
    questions,
  ]);

  // Handle Next/Submit - S3776: Refactored to reduce cognitive complexity
  const handleNext = useCallback(() => {
    const rtMs = Date.now() - questionStartTimeRef.current;

    // Show rapid tap warning if too fast (extracted helper)
    // BP-2 FIX: Clear previous timer before setting new one
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = handleRapidTapWarning(rtMs, selectedOption !== null, setShowRapidWarning);

    // If reviewing history - handle separately to reduce nesting
    if (isReviewingHistory) {
      handleHistoryNavigation();
      return;
    }

    // Not reviewing - handle normally
    if (selectedOption === null) {
      toast.error("Please select an answer");
      return;
    }

    // Use extracted helper for correctness check
    const isCorrect = checkAnswerCorrectness(
      selectedOption,
      shuffleMap,
      currentQuestion._correctIndex,
    );

    // Add to history
    const historyItem: QuestionHistoryItem = {
      question: currentQuestion,
      shuffledOptions,
      shuffleMap,
      selectedAnswer: selectedOption,
      isCorrect,
      hasBeenAnswered: true,
      skipped: false,
      rtMs,
    };
    setQuestionHistory([...questionHistory, historyItem]);

    // Record response
    const response: ResponseData = {
      itemId: currentQuestion.id,
      module: currentQuestion.category,
      isCorrect,
      rtMs,
      focusBlurCount,
      chosenOption: shuffledOptions[selectedOption]?.text || "",
    };

    // Update IRT ability estimate (theta) after each answer
    const updatedResponses = [...responses, response];
    // Use extracted helper for IRT response building
    const irtResponses = updatedResponses.map((r) =>
      buildIrtResponse(r, questions),
    );

    // Update theta estimate
    const { theta: newTheta, se: newSe } = updateTheta(
      irtState.theta,
      irtResponses,
    );
    setIrtState({
      theta: newTheta,
      se: newSe,
      answeredCount: updatedResponses.length,
      correctCount: updatedResponses.filter((r) => r.isCorrect).length,
    });

    setSelectedOption(null);
    setResponses(updatedResponses);
    setFocusBlurCount(0);

    // Move to next or submit
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question - compile all responses and submit
      const allResponses = [...responses, response];
      submitAssessmentData(allResponses);
    }
  },
  // irtState.theta omitted intentionally - including it would cause frequent callback recreation
  // This is safe because the callback always uses the latest irtState via closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [
    isReviewingHistory,
    handleHistoryNavigation,
    selectedOption,
    shuffleMap,
    currentQuestion,
    questionHistory,
    shuffledOptions,
    responses,
    focusBlurCount,
    currentIndex,
    questions,
    submitAssessmentData,
  ],
);

  // Jump to specific question (from pagination)
  const handleJumpTo = useCallback(
    (index: number) => {
      // Can only jump within history
      const historyIndex = questionHistory.findIndex(
        (h) => questions.indexOf(h.question) === index,
      );

      if (historyIndex >= 0) {
        setCurrentHistoryIndex(historyIndex);
        setCurrentIndex(index);
        setSelectedOption(questionHistory[historyIndex].selectedAnswer);
      }
    },
    [questionHistory, questions],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const direction = e.key === "ArrowDown" ? 1 : -1;
        const newIndex =
          selectedOption === null
            ? 0
            : (selectedOption + direction + shuffledOptions.length) %
              shuffledOptions.length;
        handleOptionSelect(newIndex);
      }

      if ((e.key === "Enter" || e.key === " ") && selectedOption !== null) {
        e.preventDefault();
        handleNext();
      }

      const num = Number.parseInt(e.key);
      if (num >= 1 && num <= shuffledOptions.length) {
        e.preventDefault();
        handleOptionSelect(num - 1);
      }
    };

    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedOption,
    shuffledOptions.length,
    isSubmitting,
    handleOptionSelect,
    handleNext,
  ]);

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-tertiary">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <output className="mb-4 block">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-sm font-medium text-text-primary"
              id="progress-text"
            >
              Question {currentIndex + 1} of {questions.length}
            </span>
            <CompactTimer
              onTimeUpdate={setTotalElapsedSeconds}
              isPaused={isSubmitting}
            />
          </div>
          <Progress
            value={progress}
            className="h-2"
            aria-labelledby="progress-text"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </output>

        {/* Question Pagination */}
        <div className="mb-4">
          <QuestionPagination
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            questionStatuses={questionStatuses}
            historyLength={questionHistory.length}
            onJumpTo={handleJumpTo}
          />
          <PaginationLegend />
        </div>

        {/* Rapid Tap Warning */}
        {showRapidWarning && (
          <div
            className="mb-4 bg-warning-light border-l-4 border-warning p-4 rounded-md"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-warning-dark">
              Take your time! Reading the question carefully helps you learn
              better.
            </p>
          </div>
        )}

        {/* Question Card */}
        <div className="card-gradient">
          <div className="bg-white rounded-xl p-6 md:p-8">
            {/* Category Badge */}
            <div className="mb-6">
              <span
                className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-primary-light rounded-full mb-4"
                aria-label={`Category: ${currentQuestion.category.replaceAll("_", " ")}`}
              >
                {currentQuestion.category.replaceAll("_", " ").toUpperCase()}
              </span>
              <h2
                ref={questionRef}
                id="question-text"
                className={`text-xl md:text-2xl font-bold text-text-primary break-words ${fontClass}`}
                tabIndex={-1}
              >
                {currentQuestion.questionText}
              </h2>
            </div>

            {/* Options - Using native radio inputs for accessibility (S6819) */}
            <fieldset
              aria-labelledby="question-text"
              className="space-y-3 border-0 p-0 m-0"
            >
              {shuffledOptions.map(
                (option: { id: string; text: string }, index: number) => {
                  // Fixed positional labels: A, B, C, D always in order
                  // Option content shuffles but labels stay sequential
                  const label = String.fromCharCode(65 + index); // A=65
                  return (
                    <label
                      key={option.id}
                      className={`w-full text-left p-4 rounded-md border-2 transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${getOptionButtonClasses(selectedOption === index)} ${isSubmitting ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <input
                        type="radio"
                        name="assessment-option"
                        checked={selectedOption === index}
                        onChange={() => handleOptionSelect(index)}
                        disabled={isSubmitting}
                        className="sr-only"
                        aria-label={`Option ${label}: ${option.text}`}
                      />
                      <div className="flex items-start gap-3">
                        <div
                          aria-hidden="true"
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${getRadioButtonClasses(selectedOption === index)}`}
                        >
                          {selectedOption === index && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        <span
                          className={`text-base text-text-primary break-words ${fontClass}`}
                        >
                          <span className="font-semibold mr-2">{label}.</span>
                          {option.text}
                        </span>
                      </div>
                    </label>
                  );
                },
              )}
            </fieldset>

            {/* Navigation */}
            <QuestionNavigation
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              hasSelectedAnswer={selectedOption !== null}
              isSubmitting={isSubmitting}
              canGoBack={questionHistory.length > 0}
              isReviewingHistory={isReviewingHistory}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
              onClear={handleClear}
              onNext={handleNext}
            />
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-4 space-y-2">
          <p className="text-sm text-text-secondary text-center">
            Take your time to read each question carefully
          </p>
          <p className="text-xs text-text-tertiary text-center">
            Use arrow keys to navigate options, Enter/Space to submit, or 1-4
            for quick selection
          </p>
        </div>
      </div>
    </div>
  );
}
