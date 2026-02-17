"use client";

/**
 * Microlearning Lesson Player
 *
 * Displays AI-generated lessons in bite-sized chunks with:
 * - Progress indicator
 * - Concept/Example/Practice sections
 * - Checkpoint quizzes
 * - Voice narration support
 * - Navigation controls
 * - AI-generated images via Vertex AI Imagen
 * - Lottie animations for loading states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTTS } from "@/components/voice/VoiceChat";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { LoadingAnimation, SuccessAnimation } from "@/components/animations";
import type { SupportedLanguage } from "@/types/common";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  CheckCircle,
  BookOpen,
  Lightbulb,
  PenTool,
  HelpCircle,
  Loader2,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";

export interface LessonChunk {
  type: "concept" | "example" | "practice" | "checkpoint";
  duration: string;
  heading: string;
  content: string;
  visualDescription?: string;
  imageUrl?: string; // Pre-generated image URL
  imageType?: "diagram" | "concept" | "example" | "cultural" | "icon";
  checkpointQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

/**
 * Image state for async loading
 */
interface ChunkImageState {
  url: string | null;
  loading: boolean;
  error: boolean;
}

export interface GeneratedLesson {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  title: string;
  description: string;
  totalDuration: string;
  chunks: LessonChunk[];
  generatedAt: string;
}

interface LessonPlayerProps {
  readonly lesson: GeneratedLesson;
  /** Called when lesson is completed. Receives chunk counts for score calculation. */
  readonly onComplete?: (completedChunks: number, totalChunks: number) => void;
  readonly voiceEnabled?: boolean;
  readonly language: SupportedLanguage;
}

/**
 * Get icon for chunk type
 */
function getChunkIcon(type: LessonChunk["type"]) {
  const iconProps = { className: "h-5 w-5" };
  switch (type) {
    case "concept":
      return <BookOpen {...iconProps} />;
    case "example":
      return <Lightbulb {...iconProps} />;
    case "practice":
      return <PenTool {...iconProps} />;
    case "checkpoint":
      return <HelpCircle {...iconProps} />;
  }
}

/**
 * Chunk Image Component
 *
 * Displays images for lesson chunks with loading states and fallbacks.
 * Uses Lottie animations for better UX during image load.
 */
function ChunkImage({
  imageUrl,
  visualDescription,
  topicId,
  imageType = "concept",
  language,
}: {
  readonly imageUrl?: string;
  readonly visualDescription?: string;
  readonly topicId: string;
  readonly imageType?: LessonChunk["imageType"];
  readonly language: SupportedLanguage;
}) {
  const [imageState, setImageState] = useState<ChunkImageState>({
    url: imageUrl || null,
    loading: !imageUrl && !!visualDescription,
    error: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  // BUG-011 FIX: Track success animation timer for cleanup
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // BUG-011 FIX: Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Fetch image if not provided and visual description exists
  const fetchImage = useCallback(async () => {
    if (imageUrl || !visualDescription) return;

    setImageState({ url: null, loading: true, error: false });

    try {
      // Call imagen API to get or generate image
      const response = await fetch("/api/imagen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: visualDescription,
          language,
          imageType: imageType || "concept",
          topicId,
        }),
      });

      if (!response.ok) {
        throw new Error("Image generation failed");
      }

      const data = await response.json();
      if (data.url) {
        setShowSuccess(true);
        // BUG-011 FIX: Store timer ref for cleanup on unmount
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => {
          setImageState({ url: data.url, loading: false, error: false });
          setShowSuccess(false);
        }, 800);
      } else {
        setImageState({ url: null, loading: false, error: true });
      }
    } catch {
      setImageState({ url: null, loading: false, error: true });
    }
  }, [imageUrl, visualDescription, topicId, imageType, language]);

  useEffect(() => {
    if (!imageUrl && visualDescription) {
      fetchImage();
    }
  }, [fetchImage, imageUrl, visualDescription]);

  // Loading state with Lottie animation
  if (imageState.loading || showSuccess) {
    return (
      <div className="bg-surface/30 rounded-lg p-6 border border-dashed flex flex-col items-center justify-center min-h-[200px]">
        {showSuccess ? (
          <SuccessAnimation size={60} />
        ) : (
          <LoadingAnimation size={60} />
        )}
        <p className="text-sm text-text-secondary mt-3">
          {language === "en" ? "Loading visual..." : language === "hi" ? "चित्र लोड हो रहा है..." : "ছবি লোড হৈ আছে..."}
        </p>
      </div>
    );
  }

  // Error state with fallback to description
  if (imageState.error || !imageState.url) {
    return (
      <div className="bg-surface/50 rounded-lg p-4 border border-dashed">
        <div className="flex items-center gap-2 text-text-secondary mb-2">
          <ImageIcon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {language === "en" ? "Visual Aid" : language === "hi" ? "दृश्य सहायता" : "দৃশ্য সহায়তা"}
          </span>
        </div>
        <p className="text-sm text-text-secondary italic">
          📊 {visualDescription}
        </p>
      </div>
    );
  }

  // Image loaded successfully
  return (
    <div className="rounded-lg overflow-hidden border">
      <div className="relative w-full h-[250px] bg-white">
        <Image
          src={imageState.url}
          alt={visualDescription || "Lesson visual"}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={imageState.url.startsWith("data:")} // Skip optimization for base64
        />
      </div>
      {visualDescription && (
        <p className="text-xs text-text-secondary p-2 bg-surface/50 text-center">
          {visualDescription}
        </p>
      )}
    </div>
  );
}

/**
 * Get background color for chunk type
 */
function getChunkColor(type: LessonChunk["type"]): string {
  switch (type) {
    case "concept":
      return "bg-primary/10 border-primary/30";
    case "example":
      return "bg-warning/10 border-warning/30";
    case "practice":
      return "bg-success/10 border-success/30";
    case "checkpoint":
      return "bg-secondary/10 border-secondary/30";
  }
}

/**
 * Get type label in language
 */
function getTypeLabel(type: LessonChunk["type"], language: SupportedLanguage): string {
  const labels: Record<LessonChunk["type"], Record<SupportedLanguage, string>> = {
    concept: { en: "Concept", hi: "अवधारणा", as: "ধাৰণা" },
    example: { en: "Example", hi: "उदाहरण", as: "উদাহৰণ" },
    practice: { en: "Practice", hi: "अभ्यास", as: "অভ্যাস" },
    checkpoint: { en: "Quiz", hi: "प्रश्नोत्तरी", as: "কুইজ" },
  };
  return labels[type][language];
}

/**
 * Checkpoint Quiz Component
 */
function CheckpointQuiz({
  question,
  language,
  onAnswer,
}: {
  readonly question: NonNullable<LessonChunk["checkpointQuestion"]>;
  readonly language: SupportedLanguage;
  readonly onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onAnswer(selected === question.correctIndex);
  };

  const labels = {
    submit: { en: "Check Answer", hi: "उत्तर जाँचें", as: "উত্তৰ পৰীক্ষা কৰক" },
    correct: { en: "Correct!", hi: "सही!", as: "শুদ্ধ!" },
    incorrect: { en: "Not quite", hi: "बिल्कुल नहीं", as: "ঠিক নহয়" },
  };

  return (
    <div className="space-y-4">
      <p className="font-medium text-lg">{question.question}</p>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = index === question.correctIndex;
          const showResult = submitted;

          let buttonClass = "w-full text-left px-4 py-3 sm:px-5 sm:py-4 min-h-[56px] rounded-xl border-2 transition-all ";
          if (showResult) {
            if (isCorrect) {
              buttonClass += "bg-success/20 border-success text-success-dark";
            } else if (isSelected && !isCorrect) {
              buttonClass += "bg-error/20 border-error text-error-dark";
            } else {
              buttonClass += "bg-surface border-muted-foreground/20";
            }
          } else {
            buttonClass += isSelected
              ? "bg-primary/20 border-primary"
              : "bg-background border-muted-foreground/30 hover:border-primary/50";
          }

          return (
            <button
              key={index}
              onClick={() => !submitted && setSelected(index)}
              disabled={submitted}
              className={buttonClass}
            >
              <span className="font-medium mr-2 text-sm sm:text-base">{String.fromCharCode(65 + index)}.</span>
              <span className="text-sm sm:text-base">{option}</span>
              {showResult && isCorrect && <CheckCircle className="inline ml-2 h-4 w-4" />}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} disabled={selected === null} className="w-full">
          {labels.submit[language]}
        </Button>
      )}

      {submitted && (
        <div
          className={`p-4 rounded-lg ${selected === question.correctIndex ? "bg-success/20" : "bg-warning/20"}`}
        >
          <p className="font-bold mb-1">
            {selected === question.correctIndex ? labels.correct[language] : labels.incorrect[language]}
          </p>
          <p className="text-sm">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Main Lesson Player Component
 */
export function LessonPlayer({
  lesson,
  onComplete,
  voiceEnabled = false,
  language,
}: LessonPlayerProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [completedChunks, setCompletedChunks] = useState<Set<number>>(new Set());
  const [autoVoice, setAutoVoice] = useState(voiceEnabled);

  const { speak, stop, isSpeaking } = useTTS(language);

  // Reset state when lesson changes (e.g., language switch, different topic)
  const lessonRef = useRef(lesson);
  useEffect(() => {
    if (lessonRef.current !== lesson) {
      lessonRef.current = lesson;
      queueMicrotask(() => {
        setCurrentChunk(0);
        setCompletedChunks(new Set());
      });
    }
  }, [lesson]);

  const totalChunks = lesson.chunks.length;
  // Bounds check: prevent out-of-range access after lesson change
  const safeChunk = Math.min(currentChunk, Math.max(0, totalChunks - 1));
  const progress = totalChunks > 0 ? (completedChunks.size / totalChunks) * 100 : 0;
  const currentChunkData = lesson.chunks[safeChunk];

  // Auto-speak when chunk changes
  useEffect(() => {
    if (autoVoice && currentChunkData) {
      speak(`${currentChunkData.heading}. ${currentChunkData.content}`);
    }
    return () => stop();
  }, [safeChunk, autoVoice, currentChunkData, speak, stop]);

  const handleNext = () => {
    // Include current chunk in completed count
    const newCompletedChunks = new Set([...completedChunks, safeChunk]);
    setCompletedChunks(newCompletedChunks);

    if (safeChunk < totalChunks - 1) {
      setCurrentChunk(safeChunk + 1);
    } else {
      // All chunks completed - pass completion data for score calculation
      onComplete?.(newCompletedChunks.size, totalChunks);
    }
  };

  const handlePrevious = () => {
    if (safeChunk > 0) {
      setCurrentChunk(safeChunk - 1);
    }
  };

  const handleCheckpointAnswer = useCallback((correct: boolean) => {
    // Mark as completed regardless of answer
    // Use functional update and capture safeChunk at call time
    setCompletedChunks((prev) => {
      const newSet = new Set([...prev, safeChunk]);
      return newSet;
    });
    // Could track score here if needed
    if (correct) {
      // Positive feedback handled in quiz component
    }
  }, [safeChunk]);

  const labels = {
    previous: { en: "Previous", hi: "पिछला", as: "পূৰ্বৱৰ্তী" },
    next: { en: "Next", hi: "अगला", as: "পৰৱৰ্তী" },
    complete: { en: "Complete Lesson", hi: "पाठ पूरा करें", as: "পাঠ সম্পূৰ্ণ কৰক" },
    duration: { en: "Duration", hi: "अवधि", as: "সময়কাল" },
    progress: { en: "Progress", hi: "प्रगति", as: "অগ্ৰগতি" },
  };

  // Guard: if lesson has no chunks, show skeleton
  if (!currentChunkData) {
    return <LessonPlayerSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{lesson.title}</CardTitle>
              <p className="text-sm text-text-secondary">
                {labels.duration[language]}: {lesson.totalDuration}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isSpeaking) {
                  stop();
                }
                setAutoVoice(!autoVoice);
              }}
              title={autoVoice ? "Disable voice" : "Enable voice"}
            >
              {autoVoice ? (
                <Volume2 className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-text-secondary" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{labels.progress[language]}</span>
              <span>
                {safeChunk + 1} / {totalChunks}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Chunk indicators */}
          <div className="flex gap-1 mt-3">
            {lesson.chunks.map((chunk, index) => (
              <button
                key={index}
                onClick={() => setCurrentChunk(index)}
                className={`flex-1 h-2 rounded-full transition-all ${
                  index === safeChunk
                    ? "bg-primary"
                    : completedChunks.has(index)
                      ? "bg-success"
                      : "bg-surface"
                }`}
                title={chunk.heading}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current chunk content */}
      <Card className={`border-2 ${getChunkColor(currentChunkData.type)}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            {getChunkIcon(currentChunkData.type)}
            <span className="text-sm font-medium uppercase tracking-wide">
              {getTypeLabel(currentChunkData.type, language)}
            </span>
            <span className="text-sm text-text-secondary ml-auto">
              ~{currentChunkData.duration}
            </span>
          </div>
          <CardTitle className="text-2xl">{currentChunkData.heading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-primary animate-pulse">
              <Volume2 className="h-4 w-4" />
              <span className="text-sm">
                {language === "en" ? "Speaking..." : language === "hi" ? "बोल रहा है..." : "কৈ আছে..."}
              </span>
            </div>
          )}

          {/* Main content */}
          {currentChunkData.type === "checkpoint" && currentChunkData.checkpointQuestion ? (
            <CheckpointQuiz
              question={currentChunkData.checkpointQuestion}
              language={language}
              onAnswer={handleCheckpointAnswer}
            />
          ) : (
            <div className="prose prose-lg max-w-none">
              <MarkdownRenderer content={currentChunkData.content} />
            </div>
          )}

          {/* Visual content (image or description) */}
          {(currentChunkData.visualDescription || currentChunkData.imageUrl) && (
            <ChunkImage
              imageUrl={currentChunkData.imageUrl}
              visualDescription={currentChunkData.visualDescription}
              topicId={lesson.topicId}
              imageType={currentChunkData.imageType}
              language={language}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={safeChunk === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {labels.previous[language]}
        </Button>

        <Button
          onClick={handleNext}
          className="flex-1"
          disabled={
            currentChunkData.type === "checkpoint" &&
            currentChunkData.checkpointQuestion &&
            !completedChunks.has(safeChunk)
          }
        >
          {safeChunk === totalChunks - 1 ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              {labels.complete[language]}
            </>
          ) : (
            <>
              {labels.next[language]}
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for lesson player
 */
export function LessonPlayerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Card>
        <CardHeader className="pb-2">
          <div className="h-6 bg-surface rounded w-1/2" />
          <div className="h-4 bg-surface rounded w-1/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-2 bg-surface rounded w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="h-4 bg-surface rounded w-20" />
          <div className="h-8 bg-surface rounded w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-surface rounded w-full" />
            <div className="h-4 bg-surface rounded w-5/6" />
            <div className="h-4 bg-surface rounded w-4/6" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
