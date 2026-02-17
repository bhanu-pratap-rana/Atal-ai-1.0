"use client";

/**
 * Hook for fetching AI-generated dynamic lessons
 *
 * Fetches from /api/lesson/generate and caches the result.
 * Falls back gracefully if generation fails.
 */

import { useState, useEffect } from "react";
import type { SupportedLanguage } from "@/types/common";
import type { GeneratedLesson } from "@/components/microlearning";
import { clientLogger } from "@/lib/client-logger";

interface UseDynamicLessonOptions {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  learningStyle?: "visual" | "text" | "auditory";
  enabled?: boolean;
}

interface UseDynamicLessonResult {
  lesson: GeneratedLesson | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch a dynamically generated lesson from the API
 */
export function useDynamicLesson({
  moduleId,
  topicId,
  language,
  learningStyle = "text",
  enabled = true,
}: UseDynamicLessonOptions): UseDynamicLessonResult {
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (!enabled || !moduleId || !topicId) {
      return;
    }

    const controller = new AbortController();

    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      setLesson(null); // Clear stale lesson to prevent showing wrong-language content

      try {
        const response = await fetch("/api/lesson/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moduleId,
            topicId,
            language,
            learningStyle,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to generate lesson: ${response.statusText}`);
        }

        const data = await response.json();
        if (!controller.signal.aborted) {
          setLesson(data);
          clientLogger.debug("[useDynamicLesson] Lesson generated", {
            moduleId,
            topicId,
            chunks: data.chunks?.length,
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        const message = err instanceof Error ? err.message : "Unknown error";
        if (!controller.signal.aborted) {
          setError(message);
        }
        clientLogger.error(
          "[useDynamicLesson] Error",
          err instanceof Error ? err : { error: message },
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchLesson();

    return () => controller.abort();
  }, [moduleId, topicId, language, learningStyle, enabled, fetchKey]);

  const refetch = () => {
    setFetchKey((prev) => prev + 1);
  };

  return { lesson, loading, error, refetch };
}
