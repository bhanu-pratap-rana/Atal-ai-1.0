"use server";

/**
 * AI Server Actions
 *
 * Server-side actions for AI-powered features.
 * Uses Groq as fallback, with Gemini as primary provider.
 */

import { getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import {
  askTutor,
  getEssayFeedback,
  generatePracticeQuestions,
  summarizeContent,
  checkAIService,
  type TutorContext,
  type AIResponse,
  type EssayFeedback,
  type PracticeQuestion,
} from "@/lib/ai-service";
import { AI_CONTENT_LIMITS } from "@/lib/constants/validation-limits";
import { RATE_LIMIT_ERRORS } from "@/lib/constants/error-messages";
import type { SupportedLanguage } from "@/types/common";

// Rate limit configuration for AI endpoints (per user)
const AI_RATE_LIMITS = {
  tutor: { maxTokens: 20, refillRate: 20 / 3600, refillInterval: 1000 }, // 20 requests/hour
  essay: { maxTokens: 10, refillRate: 10 / 3600, refillInterval: 1000 }, // 10 requests/hour
  practice: { maxTokens: 15, refillRate: 15 / 3600, refillInterval: 1000 }, // 15 requests/hour
  summarize: { maxTokens: 15, refillRate: 15 / 3600, refillInterval: 1000 }, // 15 requests/hour
} as const;

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Verify user is authenticated before AI operations
 * Uses getCurrentUser() for consistent auth pattern across all server actions
 */
async function requireAuth(): Promise<{ userId: string } | { error: string }> {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Authentication required" };
  }

  return { userId: user.id };
}

/**
 * AI Tutor - Ask a question and get personalized help
 */
export async function askAITutor(
  question: string,
  context?: Partial<TutorContext>,
): Promise<ActionResult<AIResponse>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  // Rate limit check - prevent abuse
  const isAllowed = await checkRateLimit(
    `ai:tutor:${auth.userId}`,
    AI_RATE_LIMITS.tutor,
  );
  if (!isAllowed) {
    authLogger.warn("[askAITutor] Rate limit exceeded", {
      userId: auth.userId,
    });
    return {
      success: false,
      error: RATE_LIMIT_ERRORS.AI_RATE_LIMIT,
    };
  }

  if (
    !question ||
    question.trim().length < AI_CONTENT_LIMITS.questionMinLength
  ) {
    return { success: false, error: "Please provide a valid question" };
  }

  if (question.length > AI_CONTENT_LIMITS.questionMaxLength) {
    return {
      success: false,
      error: `Question is too long (max ${AI_CONTENT_LIMITS.questionMaxLength} characters)`,
    };
  }

  try {
    const response = await askTutor(question.trim(), context as TutorContext);

    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to get response from AI",
      };
    }

    return { success: true, data: response };
  } catch (error) {
    authLogger.error("[askAITutor] Error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Essay Feedback - Get AI feedback on written content
 *
 * @internal Phase 2 Feature - Not yet integrated into UI
 * @see ATAL_AI_IMPLEMENTATION_PLAN.md for integration timeline
 */
export async function getAIEssayFeedback(
  essay: string,
  topic?: string,
  language: SupportedLanguage = "en",
): Promise<ActionResult<AIResponse & { feedback?: EssayFeedback }>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  // Rate limit check - prevent abuse
  const isAllowed = await checkRateLimit(
    `ai:essay:${auth.userId}`,
    AI_RATE_LIMITS.essay,
  );
  if (!isAllowed) {
    authLogger.warn("[getAIEssayFeedback] Rate limit exceeded", {
      userId: auth.userId,
    });
    return {
      success: false,
      error: RATE_LIMIT_ERRORS.ESSAY_RATE_LIMIT,
    };
  }

  if (!essay || essay.trim().length < AI_CONTENT_LIMITS.essayMinLength) {
    return {
      success: false,
      error: `Essay must be at least ${AI_CONTENT_LIMITS.essayMinLength} characters`,
    };
  }

  if (essay.length > AI_CONTENT_LIMITS.essayMaxLength) {
    return {
      success: false,
      error: `Essay is too long (max ${AI_CONTENT_LIMITS.essayMaxLength} characters)`,
    };
  }

  try {
    const response = await getEssayFeedback(essay.trim(), topic, language);

    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to analyze essay",
      };
    }

    return { success: true, data: response };
  } catch (error) {
    authLogger.error("[getAIEssayFeedback] Error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Practice Generator - Generate practice questions
 *
 * @internal Phase 2 Feature - Not yet integrated into UI
 * @see ATAL_AI_IMPLEMENTATION_PLAN.md for integration timeline
 */
export async function generateAIPracticeQuestions(
  topic: string,
  count: number = 5,
  difficulty: "easy" | "medium" | "hard" = "medium",
  language: SupportedLanguage = "en",
): Promise<ActionResult<AIResponse & { questions?: PracticeQuestion[] }>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  // Rate limit check - prevent abuse
  const isAllowed = await checkRateLimit(
    `ai:practice:${auth.userId}`,
    AI_RATE_LIMITS.practice,
  );
  if (!isAllowed) {
    authLogger.warn("[generateAIPracticeQuestions] Rate limit exceeded", {
      userId: auth.userId,
    });
    return {
      success: false,
      error: RATE_LIMIT_ERRORS.QUESTIONS_RATE_LIMIT,
    };
  }

  if (!topic || topic.trim().length < AI_CONTENT_LIMITS.topicMinLength) {
    return { success: false, error: "Please provide a valid topic" };
  }

  if (
    count < AI_CONTENT_LIMITS.practiceQuestionsMin ||
    count > AI_CONTENT_LIMITS.practiceQuestionsMax
  ) {
    return {
      success: false,
      error: `Number of questions must be between ${AI_CONTENT_LIMITS.practiceQuestionsMin} and ${AI_CONTENT_LIMITS.practiceQuestionsMax}`,
    };
  }

  try {
    const response = await generatePracticeQuestions(
      topic.trim(),
      count,
      difficulty,
      language,
    );

    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to generate questions",
      };
    }

    return { success: true, data: response };
  } catch (error) {
    authLogger.error("[generateAIPracticeQuestions] Error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Study Summarizer - Create study materials from content
 *
 * @internal Phase 2 Feature - Not yet integrated into UI
 * @see ATAL_AI_IMPLEMENTATION_PLAN.md for integration timeline
 */
export async function summarizeStudyContent(
  content: string,
  format: "notes" | "flashcards" | "outline" = "notes",
  language: SupportedLanguage = "en",
): Promise<ActionResult<AIResponse>> {
  const auth = await requireAuth();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  // Rate limit check - prevent abuse
  const isAllowed = await checkRateLimit(
    `ai:summarize:${auth.userId}`,
    AI_RATE_LIMITS.summarize,
  );
  if (!isAllowed) {
    authLogger.warn("[summarizeStudyContent] Rate limit exceeded", {
      userId: auth.userId,
    });
    return {
      success: false,
      error: RATE_LIMIT_ERRORS.SUMMARY_RATE_LIMIT,
    };
  }

  if (!content || content.trim().length < AI_CONTENT_LIMITS.contentMinLength) {
    return {
      success: false,
      error: `Content must be at least ${AI_CONTENT_LIMITS.contentMinLength} characters`,
    };
  }

  if (content.length > AI_CONTENT_LIMITS.contentMaxLength) {
    return {
      success: false,
      error: `Content is too long (max ${AI_CONTENT_LIMITS.contentMaxLength} characters)`,
    };
  }

  try {
    const response = await summarizeContent(content.trim(), format, language);

    if (!response.success) {
      return {
        success: false,
        error: response.error || "Failed to summarize content",
      };
    }

    return { success: true, data: response };
  } catch (error) {
    authLogger.error("[summarizeStudyContent] Error", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Check AI Service Status
 *
 * @internal Phase 2 Feature - Health check endpoint for AI service monitoring
 * @see ATAL_AI_IMPLEMENTATION_PLAN.md for integration timeline
 */
export async function checkAIServiceStatus(): Promise<
  ActionResult<{
    available: boolean;
    provider: string;
    model: string;
  }>
> {
  // SECURITY: Require authentication to prevent AI provider/model info exposure
  const auth = await requireAuth();
  if ("error" in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const status = await checkAIService();
    return {
      success: true,
      data: {
        available: status.available,
        provider: status.provider,
        model: status.model,
      },
    };
  } catch (error) {
    authLogger.error("[checkAIServiceStatus] Error", error);
    return { success: false, error: "Failed to check AI service status" };
  }
}
