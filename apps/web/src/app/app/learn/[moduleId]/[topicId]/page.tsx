/**
 * Lesson Page with AI Tutor Sidebar
 *
 * Main learning interface for individual topics.
 * Features:
 * - Adaptive content based on learning style
 * - AI Tutor sidebar for questions
 * - Practice questions with feedback
 * - Progress tracking
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ConversationalVoiceChat } from "@/components/voice/ConversationalVoiceChat";
import type { Language } from "@/hooks/useConversationalVoice";
import { createClient } from "@/lib/supabase-browser";
import { clientLogger } from "@/lib/client-logger";
import { useLanguage, LanguageSelector } from "@/components/learn/LanguageSelector";
import { LessonPlayer, LessonPlayerSkeleton, LessonCompletionModal } from "@/components/microlearning";
import { useDynamicLesson } from "@/hooks/useDynamicLesson";
import { useOfflineLesson } from "@/hooks/useOfflineLesson";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import type { SupportedLanguage } from "@/types/common";
import { WifiOff, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { awardLessonCompletionPoints } from "@/app/actions/gamification";
import { completeLessonAndUpdateProgress } from "@/app/actions/lesson-completion";
import { stopTTS } from "@/lib/utils/client-tts";
import { MASTERY_THRESHOLDS, MAX_SCORE_WITHOUT_QUIZ } from "@/lib/constants/thresholds";

// Lesson content interface
interface LessonContent {
  title_en: string;
  title_as: string;
  sections: Array<{
    type:
      | "text"
      | "image"
      | "video"
      | "activity"
      | "curriculum"
      | "definition"
      | "example"
      | "exercise"
      | "cultural_context";
    content: string;
    image_url?: string;
  }>;
  practice_questions: Array<{
    id: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>;
}

/**
 * Section navigation button info
 */
interface SectionNavButton {
  readonly label: string;
  readonly onClick: () => void;
  readonly className?: string;
}

/**
 * Get next section navigation button based on section and question state
 */
function getNextSectionButton(
  currentSection: number,
  totalSections: number,
  hasPracticeQuestions: boolean,
  onNextSection: () => void,
  onShowPractice: () => void,
  onComplete: () => void,
): SectionNavButton {
  if (currentSection < totalSections - 1) {
    return {
      label: "Next →",
      onClick: onNextSection,
    };
  }

  if (hasPracticeQuestions) {
    return {
      label: "Practice Questions →",
      onClick: onShowPractice,
    };
  }

  return {
    label: "Complete Lesson ✓",
    onClick: onComplete,
    className: "bg-success hover:bg-success-dark",
  };
}

// Default content for topics without specific content in database
const DEFAULT_LESSON: LessonContent = {
  title_en: "Lesson Content",
  title_as: "পাঠ বিষয়বস্তু",
  sections: [
    {
      type: "text",
      content:
        "This lesson content is being prepared. In the meantime, you can ask the AI Tutor any questions about this topic!",
    },
  ],
  practice_questions: [],
};

/**
 * Helper: Generate AI welcome message based on language and lesson
 */
function getAIWelcomeMessage(
  language: SupportedLanguage,
  lesson: LessonContent,
): string {
  if (language === "as") {
    return `নমস্কাৰ! মই আপোনাৰ AI শিক্ষক। "${lesson.title_as}" বিষয়ে কিবা প্ৰশ্ন আছে নেকি?`;
  }
  if (language === "hi") {
    return `नमस्ते! मैं आपका AI शिक्षक हूँ। "${lesson.title_en}" के बारे में कोई सवाल है?`;
  }
  return `Hello! I'm your AI Tutor. Do you have any questions about "${lesson.title_en}"?`;
}

/**
 * Helper: Fetch practice questions for topic filtered by language
 * FIX: Added language parameter to prevent mixed-language questions
 */
async function fetchPracticeQuestions(
  supabase: ReturnType<typeof createClient>,
  topicId: string,
  language: SupportedLanguage,
): Promise<
  Array<{
    id: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>
> {
  // PERFORMANCE: Select only needed columns instead of *
  const { data: questionsData, error: questionsError } = await supabase
    .from("practice_questions")
    .select("id, question, options, correct_index, explanation")
    .eq("topic_id", topicId)
    .eq("language", language) // Filter by selected language
    .order("order_index", { ascending: true });

  if (questionsError) {
    clientLogger.error(
      "[LessonPage] Error fetching practice questions",
      questionsError instanceof Error
        ? questionsError
        : { error: String(questionsError) },
    );
  }

  return (questionsData || []).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options || [],
    correct: q.correct_index || 0,
    explanation: q.explanation || "",
  }));
}

/**
 * Helper: Build lesson content from database data
 */
function buildLessonFromData(
  contentData: Array<{
    content_type: string;
    content: string;
    metadata?: { title_en?: string; title_as?: string; image_url?: string };
  }>,
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>,
  topicId: string,
): LessonContent {
  const sections = contentData.map((c) => ({
    type: c.content_type as LessonContent["sections"][0]["type"],
    content: c.content,
    image_url: c.metadata?.image_url,
  }));

  const firstContent = contentData[0].content || "";
  const firstLine = firstContent.split("\n")[0].trim();
  const extractedTitle = firstLine.replace(/^#*\s*/, "");

  return {
    title_en:
      contentData[0].metadata?.title_en ||
      extractedTitle ||
      `Topic ${topicId}`,
    title_as: contentData[0].metadata?.title_as || topicId,
    sections,
    practice_questions: questions,
  };
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const moduleId = params.moduleId as string;
  const topicId = params.topicId as string;

  // Track pathname for cleanup on route change
  const prevPathnameRef = useRef(pathname);

  // Stop TTS when navigating away from this page
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      clientLogger.debug("[LessonPage] Route changed, stopping TTS");
      stopTTS();
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      clientLogger.debug("[LessonPage] Unmounting, stopping TTS");
      stopTTS();
    };
  }, []);

  const [currentSection, setCurrentSection] = useState(0);
  const [showPractice, setShowPractice] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<
    Record<string, number | null>
  >({});
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [showAITutor, setShowAITutor] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  // Use shared language hook with localStorage persistence
  const { language, setLanguage } = useLanguage();
  const [lesson, setLesson] = useState<LessonContent>(DEFAULT_LESSON);
  const [loading, setLoading] = useState(true);
  const [languageKey, setLanguageKey] = useState(0); // Force refetch when language changes

  // Dynamic AI-generated lesson mode - default to AI mode
  // Note: setUseDynamicMode kept for future feature toggle
  const [useDynamicMode, _setUseDynamicMode] = useState(true);

  // Completion modal state
  const [completionData, setCompletionData] = useState<{
    score: number;
    status: "in_progress" | "mastered";
    attempts: number;
    pointsAwarded: number;
    newBadges: Array<{ id: string; name_en: string }>;
  } | null>(null);

  // Offline support
  const { isOnline } = useNetworkStatus();
  const { loadOfflineLesson, isAvailableOffline } = useOfflineLesson();
  const [offlineLesson, setOfflineLesson] = useState<ReturnType<typeof useDynamicLesson>["lesson"]>(null);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const {
    lesson: dynamicLesson,
    loading: dynamicLoading,
    error: dynamicError,
  } = useDynamicLesson({
    moduleId,
    topicId,
    language,
    enabled: useDynamicMode && isOnline, // Only fetch when online
  });

  // Offline content loading effect
  useEffect(() => {
    const loadOfflineContent = async () => {
      if (!isOnline && useDynamicMode) {
        setOfflineLoading(true);
        // When offline, try to load cached content
        const hasOffline = await isAvailableOffline(moduleId, topicId, language);
        if (hasOffline) {
          const offlineData = await loadOfflineLesson(moduleId, topicId, language);
          if (offlineData?.lesson) {
            setOfflineLesson(offlineData.lesson as ReturnType<typeof useDynamicLesson>["lesson"]);
            setOfflineError(null);
            clientLogger.debug("[LessonPage] Loaded offline lesson", {
              moduleId,
              topicId,
              chunksCount: offlineData.lesson.chunks?.length || 0,
            });
          } else {
            setOfflineError("Failed to load offline content. Please re-download the lesson.");
          }
        } else {
          setOfflineError("No internet connection. Please connect to the internet to download content.");
          setOfflineLesson(null);
        }
        setOfflineLoading(false);
      } else {
        setOfflineError(null);
        setOfflineLoading(false);
      }
    };

    loadOfflineContent();
  }, [isOnline, useDynamicMode, moduleId, topicId, language, isAvailableOffline, loadOfflineLesson]);

  // Determine which lesson to show (online dynamic or offline cached)
  const activeDynamicLesson = isOnline ? dynamicLesson : offlineLesson;
  const activeDynamicLoading = isOnline ? dynamicLoading : offlineLoading;
  const activeDynamicError = isOnline ? dynamicError : offlineError;

  // Track AI response text for ConversationalVoiceChat to speak
  const [pendingAIResponse, setPendingAIResponse] = useState<string | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  /**
   * Fetch lesson content from database (refactored to reduce cognitive complexity)
   * CRITICAL FIX: Reduced complexity from 26 to <15 by extracting helper functions
   */
  useEffect(() => {
    const fetchLessonContent = async () => {
      try {
        const supabase = createClient();

        // PERF: Fetch language content + English fallback + questions in parallel
        // Eliminates waterfall of 4 sequential queries for non-English users
        const needsFallback = language !== "en";
        const contentQuery = supabase
          .from("curriculum_content")
          .select("content_type, content, metadata")
          .eq("topic_id", topicId)
          .eq("module_id", moduleId)
          .eq("language", language);
        const fallbackContentQuery = needsFallback
          ? supabase
              .from("curriculum_content")
              .select("content_type, content, metadata")
              .eq("topic_id", topicId)
              .eq("module_id", moduleId)
              .eq("language", "en")
          : Promise.resolve({ data: null, error: null });
        const questionsQuery = fetchPracticeQuestions(supabase, topicId, language);
        const fallbackQuestionsQuery = needsFallback
          ? fetchPracticeQuestions(supabase, topicId, "en")
          : Promise.resolve([]);

        const [contentResult, fallbackResult, langQuestions, fallbackQuestions] =
          await Promise.all([contentQuery, fallbackContentQuery, questionsQuery, fallbackQuestionsQuery]);

        if (contentResult.error) {
          clientLogger.error(
            "[LessonPage] Error fetching lesson content",
            contentResult.error instanceof Error
              ? contentResult.error
              : { error: String(contentResult.error) },
          );
          setLesson(DEFAULT_LESSON);
          setLoading(false);
          return;
        }

        // Use language-specific content, fall back to English
        const contentData = contentResult.data?.length
          ? contentResult.data
          : fallbackResult.data;
        const questions = langQuestions.length ? langQuestions : fallbackQuestions;

        if (contentData && contentData.length > 0) {
          const lesson = buildLessonFromData(contentData, questions, topicId);
          setLesson(lesson);
        } else {
          setLesson(DEFAULT_LESSON);
        }

        setLoading(false);
      } catch (error) {
        clientLogger.error(
          "[LessonPage] Error fetching lesson",
          error instanceof Error ? error : { error: String(error) },
        );
        setLesson(DEFAULT_LESSON);
        setLoading(false);
      }
    };

    fetchLessonContent();
  }, [moduleId, topicId, language, languageKey]); // Force refetch when language changes

  // AI Chat integration
  const { messages, input, handleInputChange, handleSubmit, append, status: chatStatus, error: chatError } =
    useChat({
      api: "/api/tutor/chat",
      body: {
        language,
        topicId,
        moduleId,
        inputMode,
      },
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content: getAIWelcomeMessage(language, lesson),
        },
      ],
    });

  // Derive loading state from status (replaces deprecated isLoading)
  const isLoading = chatStatus === "submitted" || chatStatus === "streaming";

  // PERF-007: Limit rendered messages for performance
  const [showAllMessages, setShowAllMessages] = useState(false);
  const VISIBLE_MESSAGE_LIMIT = 20;

  const visibleMessages = useMemo(() => {
    if (showAllMessages || messages.length <= VISIBLE_MESSAGE_LIMIT) {
      return messages;
    }
    return messages.slice(-VISIBLE_MESSAGE_LIMIT);
  }, [messages, showAllMessages]);

  const hasHiddenMessages = messages.length > VISIBLE_MESSAGE_LIMIT && !showAllMessages;
  const hiddenMessageCount = messages.length - VISIBLE_MESSAGE_LIMIT;

  // Language-specific suggested questions for AI Tutor
  const suggestedQuestions = useMemo(() => {
    if (language === "hi") {
      return [
        "कंप्यूटर क्या है?",
        "इंटरनेट कैसे काम करता है?",
        "ऑनलाइन सुरक्षित कैसे रहें?",
      ];
    }
    if (language === "as") {
      return [
        "কম্পিউটাৰ কি?",
        "ইণ্টাৰনেট কেনেকৈ কাম কৰে?",
        "অনলাইনত কেনেকৈ সুৰক্ষিত থাকিব?",
      ];
    }
    return [
      "What is a computer?",
      "How does the internet work?",
      "How to stay safe online?",
    ];
  }, [language]);

  // Track AI responses for voice mode - ConversationalVoiceChat handles TTS
  useEffect(() => {
    // Only speak in voice mode when not streaming
    if (inputMode !== "voice" || chatStatus === "streaming") return;
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    // Set pending AI response for ConversationalVoiceChat to speak
    if (
      lastMessage.role === "assistant" &&
      lastMessage.id !== "welcome" &&
      lastMessage.id !== lastSpokenIdRef.current &&
      lastMessage.content
    ) {
      lastSpokenIdRef.current = lastMessage.id;
      queueMicrotask(() => setPendingAIResponse(lastMessage.content));
    }
  }, [messages, inputMode, chatStatus]);

  // Handle voice transcript - use append() to directly send message
  // FIX: Previously tried to submit a form element that doesn't exist in voice mode,
  // causing silent failure. Using append() bypasses the need for a form element entirely.
  const handleVoiceTranscript = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      append({
        role: "user",
        content: text,
      });
    },
    [append],
  );

  // Calculate practice score
  // ROOT CAUSE FIX: Check dynamic mode FIRST before practice questions
  // Bug: Static lesson.practice_questions was being checked even in dynamic mode,
  // causing score=0 because practiceAnswers is empty when using LessonPlayer
  const calculateScore = (completedChunksCount?: number, totalChunksCount?: number) => {
    // DYNAMIC MODE: Calculate from chunk completion (LessonPlayer provides counts)
    // Must check this FIRST because static lesson may have practice_questions
    // that would incorrectly be used for score calculation
    if (useDynamicMode && totalChunksCount && totalChunksCount > 0) {
      const safeCompleted = completedChunksCount ?? totalChunksCount;
      const completionRatio = safeCompleted / totalChunksCount;
      // Max score without quiz verification to ensure students demonstrate knowledge
      return Math.round(completionRatio * MAX_SCORE_WITHOUT_QUIZ);
    }

    // STATIC MODE with practice questions: Calculate from practice answers
    if (lesson.practice_questions.length > 0) {
      let correct = 0;
      for (const q of lesson.practice_questions) {
        if (practiceAnswers[q.id] === q.correct) {
          correct++;
        }
      }
      return Math.round((correct / lesson.practice_questions.length) * 100);
    }

    // Static mode without questions - minimal score
    return 0;
  };

  // Helper: Get option button styling based on state
  // Reduces nested ternary from 4 levels to simple if/else
  const getOptionButtonClassName = (
    showResult: boolean,
    isCorrect: boolean,
    isSelected: boolean,
  ): string => {
    if (showResult) {
      if (isCorrect) return "bg-success-light border-success";
      return isSelected ? "bg-error-light border-error" : "bg-surface";
    }
    return isSelected
      ? "border-primary bg-primary/10"
      : "hover:border-primary/50";
  };

  // Helper: Get input placeholder text by language
  const getInputPlaceholder = (): string => {
    switch (language) {
      case "as":
        return "আপোনাৰ প্ৰশ্ন লিখক...";
      case "hi":
        return "अपना प्रश्न टाइप करें...";
      default:
        return "Type your question...";
    }
  };

  const handlePracticeSubmit = async () => {
    setPracticeSubmitted(true);

    // Save practice responses to database
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // PERF-014 FIX: Save all responses in parallel (independent inserts)
        const results = await Promise.all(
          lesson.practice_questions
            .filter((q) => practiceAnswers[q.id] !== null && practiceAnswers[q.id] !== undefined)
            .map((q) =>
              supabase.from("formative_responses").insert({
                student_id: user.id,
                topic_id: topicId,
                question_id: q.id,
                is_correct: practiceAnswers[q.id] === q.correct,
                response_time_ms: null,
                ai_hint_requested: false,
              }),
            ),
        );
        const insertErrors = results.filter((r) => r.error);
        if (insertErrors.length > 0) {
          clientLogger.error("[LessonPage] Some practice responses failed to save:", {
            failedCount: insertErrors.length,
            totalCount: results.length,
          });
        }
      }
    } catch (error) {
      clientLogger.error(
        "[LessonPage] Error saving practice responses",
        error instanceof Error ? error : { error: String(error) },
      );
    }
  };

  const handleComplete = async (completedChunksCount?: number, totalChunksCount?: number) => {
    // ROOT CAUSE FIX: Use server action with proper cache invalidation
    // instead of client-side mutation + timestamp cache-busting workaround
    try {
      const score = calculateScore(completedChunksCount, totalChunksCount);

      clientLogger.debug("[LessonPage] Completing lesson", {
        moduleId,
        topicId,
        score,
        completedChunks: completedChunksCount,
        totalChunks: totalChunksCount,
      });

      // Use atomic server action - handles progress update + cache invalidation
      const result = await completeLessonAndUpdateProgress(moduleId, topicId, score);

      if (!result.success) {
        clientLogger.error("[LessonPage] Failed to update progress", {
          error: result.error,
        });
        // Still show completion modal with the calculated score on failure
        setCompletionData({
          score,
          status: score >= 70 ? "mastered" : "in_progress",
          attempts: 1,
          pointsAwarded: 0,
          newBadges: [],
        });
      } else {
        clientLogger.debug("[LessonPage] Progress updated successfully", {
          score: result.masteryScore,
          status: result.status,
          attempts: result.attempts,
        });

        // Award points for lesson completion
        const pointsResult = await awardLessonCompletionPoints(
          moduleId,
          topicId,
          result.masteryScore || score,
        );

        if (pointsResult.success) {
          clientLogger.debug("[LessonPage] Points awarded", {
            points: pointsResult.pointsAwarded,
            newBadges: pointsResult.newBadges?.length || 0,
          });
        }

        // Show personalized completion modal instead of navigating immediately
        setCompletionData({
          score: result.masteryScore || score,
          status: result.status === "mastered" ? "mastered" : "in_progress",
          attempts: result.attempts || 1,
          pointsAwarded: pointsResult?.pointsAwarded || 0,
          newBadges: pointsResult?.newBadges || [],
        });
      }
    } catch (error) {
      clientLogger.error(
        "[LessonPage] Error completing lesson",
        error instanceof Error ? error : { error: String(error) },
      );
      // Navigate on unexpected error as fallback
      router.push(`/app/learn/${moduleId}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-surface/30 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-surface rounded" />
            <Card>
              <CardHeader>
                <div className="h-8 w-64 bg-surface rounded" />
                <div className="h-4 w-48 bg-surface rounded mt-2" />
              </CardHeader>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="h-4 w-full bg-surface rounded" />
                <div className="h-4 w-full bg-surface rounded" />
                <div className="h-4 w-3/4 bg-surface rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-surface/30">
      <div className="flex">
        {/* Main Content Area */}
        <main
          className={`flex-1 p-4 md:p-6 transition-all ${showAITutor ? "lg:mr-96" : ""}`}
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header with Back Link and Language Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href={`/app/learn/${moduleId}`}
                className="inline-flex items-center text-sm text-text-secondary hover:text-primary"
              >
                ← Back to Module
              </Link>
              <LanguageSelector
                onChange={(newLang) => {
                  // Stop any playing TTS before switching language
                  stopTTS();
                  setLanguage(newLang);
                  setLanguageKey(prev => prev + 1); // Force content refetch
                  // Reset all content state for clean language transition
                  setCurrentSection(0);
                  setShowPractice(false);
                  setPracticeAnswers({});
                  setPracticeSubmitted(false);
                }}
              />
            </div>

            {/* Lesson Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {activeDynamicLesson ? activeDynamicLesson.title : lesson.title_en}
                      {!isOnline && (
                        <span className="text-sm text-text-secondary flex items-center gap-1">
                          <WifiOff className="h-4 w-4" />
                          Offline
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-text-secondary">
                      {activeDynamicLesson ? activeDynamicLesson.description : lesson.title_as}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* AI Tutor Toggle */}
                    <Button
                      variant="outline"
                      onClick={() => setShowAITutor(!showAITutor)}
                      className="gap-2"
                    >
                      🤖 {showAITutor ? "Hide" : "Show"} AI Tutor
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Dynamic AI Lesson Mode */}
            {useDynamicMode ? (
              <div className="space-y-4">
                {activeDynamicLoading && <LessonPlayerSkeleton />}
                {activeDynamicError && (
                  <Card className="border-destructive">
                    <CardContent className="p-6 text-center">
                      <WifiOff className="h-12 w-12 mx-auto mb-4 text-text-secondary" />
                      <p className="text-destructive mb-2 font-medium">
                        {!isOnline ? "No Internet Connection" : "Failed to generate AI lesson"}
                      </p>
                      <p className="text-text-secondary mb-4 text-sm">
                        {activeDynamicError}
                      </p>
                      {!isOnline && (
                        <p className="text-text-secondary text-sm">
                          Please connect to the internet to download the content.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                {activeDynamicLesson && !activeDynamicLoading && (
                  <LessonPlayer
                    key={`${moduleId}-${topicId}-${language}`}
                    lesson={activeDynamicLesson}
                    language={language}
                    voiceEnabled={inputMode === "voice"}
                    onComplete={handleComplete}
                  />
                )}
              </div>
            ) : showPractice ? (
              <Card>
                <CardHeader>
                  <CardTitle>Practice Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {lesson.practice_questions.map((q, qIdx) => (
                    <div key={q.id} className="space-y-3">
                      <p className="font-medium">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((option, oIdx) => {
                          const isSelected = practiceAnswers[q.id] === oIdx;
                          const isCorrect = oIdx === q.correct;
                          const showResult = practiceSubmitted;
                          // Use question ID + option text for stable unique key
                          const optionKey = `${q.id}-${option.slice(0, 20)}`;

                          return (
                            <button
                              key={optionKey}
                              onClick={() => {
                                if (!practiceSubmitted) {
                                  setPracticeAnswers({
                                    ...practiceAnswers,
                                    [q.id]: oIdx,
                                  });
                                }
                              }}
                              disabled={practiceSubmitted}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${getOptionButtonClassName(showResult, isCorrect, isSelected)}`}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCodePoint(65 + oIdx)}.
                              </span>
                              {option}
                              {showResult && isCorrect && " ✓"}
                            </button>
                          );
                        })}
                      </div>
                      {practiceSubmitted && (
                        <p className="text-sm text-text-secondary bg-surface p-3 rounded-lg">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Submit / Results */}
                  <div className="pt-4 border-t">
                    {practiceSubmitted ? (
                      <div className="text-center space-y-4">
                        <div className="text-4xl font-bold">
                          {calculateScore()}%
                        </div>
                        <p className="text-text-secondary">
                          {calculateScore() >= MASTERY_THRESHOLDS.PASSING
                            ? "🎉 Great job! You passed!"
                            : "Keep learning and try again!"}
                        </p>
                        <Button
                          onClick={() => handleComplete()}
                          className="bg-success hover:bg-success-dark"
                        >
                          Complete Lesson ✓
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handlePracticeSubmit}
                        disabled={
                          Object.keys(practiceAnswers).length <
                          lesson.practice_questions.length
                        }
                        className="w-full"
                      >
                        Submit Answers
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  {lesson.sections[currentSection] && (
                    <MarkdownRenderer
                      content={lesson.sections[currentSection].content}
                      className="prose prose-sm dark:prose-invert max-w-none"
                    />
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentSection(Math.max(0, currentSection - 1))
                      }
                      disabled={currentSection === 0}
                    >
                      ← Previous
                    </Button>

                    {(() => {
                      const navButton = getNextSectionButton(
                        currentSection,
                        lesson.sections.length,
                        lesson.practice_questions.length > 0,
                        () => setCurrentSection(currentSection + 1),
                        () => setShowPractice(true),
                        handleComplete,
                      );

                      return (
                        <Button
                          onClick={navButton.onClick}
                          className={navButton.className}
                        >
                          {navButton.label}
                        </Button>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* AI Tutor - Desktop Sidebar (lg+) */}
        {showAITutor && (
          <aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-96 bg-background border-l shadow-xl flex-col z-40">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-cyan/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-semibold">AI Tutor</h3>
                    <p className="text-xs text-text-secondary">
                      Ask me anything!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAITutor(false)}
                  className="text-text-secondary hover:text-primary p-2 hover:bg-surface-dark rounded-lg transition-colors"
                  aria-label="Close AI Tutor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Input Mode Selection */}
              <div className="flex gap-2 mt-3">
                <LanguageSelector compact />
                <Button
                  variant={inputMode === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("text")}
                >
                  Text
                </Button>
                <Button
                  variant={inputMode === "voice" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("voice")}
                >
                  Voice
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {chatError && (
              <div className="mx-4 mt-3 p-3 bg-error/10 border border-error rounded-lg">
                <p className="text-xs text-error">
                  ⚠️ {chatError.message || "An error occurred. Please try again."}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length <= 1 ? (
                <div className="text-center py-6">
                  <p className="text-text-secondary text-sm mb-3">
                    {inputMode === "voice"
                      ? "Tap the microphone to start!"
                      : "Ask me anything about this lesson!"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => append({ role: "user", content: q })}
                        className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {hasHiddenMessages && (
                    <div className="text-center mb-2">
                      <button
                        onClick={() => setShowAllMessages(true)}
                        className="px-3 py-1 text-xs bg-surface text-text-secondary rounded-full hover:bg-surface-dark/80 transition-colors"
                      >
                        ↑ Show {hiddenMessageCount} earlier messages
                      </button>
                    </div>
                  )}
                  {visibleMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface p-3 rounded-lg">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              {inputMode === "text" ? (
                <form
                  id="chat-form"
                  onSubmit={handleSubmit}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder={getInputPlaceholder()}
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                  />
                  <Button type="submit" disabled={!input.trim() || isLoading}>
                    Send
                  </Button>
                </form>
              ) : (
                <div className="space-y-2">
                  <ConversationalVoiceChat
                    language={language as Language}
                    onTranscript={handleVoiceTranscript}
                    disabled={isLoading}
                    speakText={pendingAIResponse}
                    onSpokenComplete={() => setPendingAIResponse(null)}
                    autoDetectLanguage
                    onLanguageDetected={(detectedLang) => {
                      clientLogger.debug("[LessonPage] Language detected from voice", { detectedLang });
                    }}
                  />
                </div>
              )}
            </div>
          </aside>
        )}

        {/* AI Tutor - Mobile/Tablet Sheet (<lg) */}
        <Sheet open={showAITutor} onOpenChange={setShowAITutor}>
          <SheetContent side="right" className="w-full sm:w-96 lg:hidden p-0 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-cyan/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <SheetTitle className="text-base font-semibold">AI Tutor</SheetTitle>
                  <p className="text-xs text-text-secondary">
                    Ask me anything!
                  </p>
                </div>
              </div>

              {/* Input Mode Selection */}
              <div className="flex gap-2">
                <LanguageSelector compact />
                <Button
                  variant={inputMode === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("text")}
                >
                  Text
                </Button>
                <Button
                  variant={inputMode === "voice" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInputMode("voice")}
                >
                  Voice
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {chatError && (
              <div className="mx-4 mt-3 p-3 bg-error/10 border border-error rounded-lg">
                <p className="text-xs text-error">
                  ⚠️ {chatError.message || "An error occurred. Please try again."}
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length <= 1 ? (
                <div className="text-center py-6">
                  <p className="text-text-secondary text-sm mb-3">
                    {inputMode === "voice"
                      ? "Tap the microphone to start!"
                      : "Ask me anything about this lesson!"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => append({ role: "user", content: q })}
                        className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {hasHiddenMessages && (
                    <div className="text-center mb-2">
                      <button
                        onClick={() => setShowAllMessages(true)}
                        className="px-3 py-1 text-xs bg-surface text-text-secondary rounded-full hover:bg-surface-dark/80 transition-colors"
                      >
                        ↑ Show {hiddenMessageCount} earlier messages
                      </button>
                    </div>
                  )}
                  {visibleMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] sm:max-w-[80%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface p-3 rounded-lg">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t safe-bottom">
              {inputMode === "text" ? (
                <form
                  id="chat-form"
                  onSubmit={handleSubmit}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder={getInputPlaceholder()}
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                  />
                  <Button type="submit" disabled={!input.trim() || isLoading}>
                    Send
                  </Button>
                </form>
              ) : (
                <div className="space-y-2">
                  <ConversationalVoiceChat
                    language={language as Language}
                    onTranscript={handleVoiceTranscript}
                    disabled={isLoading}
                    speakText={pendingAIResponse}
                    onSpokenComplete={() => setPendingAIResponse(null)}
                    autoDetectLanguage
                    onLanguageDetected={(detectedLang) => {
                      clientLogger.debug("[LessonPage] Language detected from voice", { detectedLang });
                    }}
                  />
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Personalized completion modal */}
      {completionData && (
        <LessonCompletionModal
          data={completionData}
          topicName={activeDynamicLesson?.title || lesson.title_en}
          language={language}
          onContinue={() => router.push(`/app/learn/${moduleId}`)}
          onReviewAgain={() => {
            setCompletionData(null);
            // Reset LessonPlayer state by incrementing languageKey (forces refetch + remount)
            setLanguageKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
