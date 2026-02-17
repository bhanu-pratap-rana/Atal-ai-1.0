/**
 * AI Tutor Service
 *
 * Implements Socratic tutoring with:
 * - RAG context retrieval (direct pgvector)
 * - Adaptive learning personalization
 * - Streaming responses via Vercel AI SDK
 * - Trilingual support (EN/HI/AS)
 *
 * NO LangChain - uses direct API calls for better performance.
 *
 * OFFLINE SYNC INTEGRATION:
 *
 * Chat messages are logged via logInteraction() and synced offline using
 * the 'chat_message' mutation type. Client integration pattern:
 *
 * ```tsx
 * // In VoiceChat.tsx or calling component:
 * import { useOfflineSync } from '@/hooks';
 *
 * const { logChatMessageWithSync } = useOfflineSync();
 *
 * const handleMessage = async (message: string) => {
 *   if (!navigator.onLine) {
 *     // Queue message for later sync
 *     await logChatMessageWithSync({
 *       student_id: studentId,
 *       session_id: sessionId,
 *       topic_id: topicId,
 *       message_content: message,
 *       message_role: 'user',
 *       input_mode: 'text',
 *       language: language as TutorLanguage,
 *     });
 *     return;
 *   }
 *
 *   // Online - use TutorService.streamChat() normally
 *   const result = await tutorService.streamChat({...params});
 * };
 * ```
 *
 * See: /src/lib/offline/mutation-queue.ts for sync implementation.
 */

import { streamText, generateText, CoreMessage } from "ai";
import { getAIModel, MODEL_CONFIGS } from "../providers";
import { CurriculumRAGService, ragService } from "./rag-service";
import { AdaptiveLearningService, adaptiveService } from "./adaptive-service";
import {
  buildSystemPrompt,
  getFeedbackPrompt,
} from "../prompts/socratic-tutor";
import { createClient } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { aiProviderBreakers } from "@/lib/circuit-breaker";
import { getLanguageLabelForAI } from "@/lib/form-utils";

// BP-15 FIX: Extract hardcoded timeout to named constant
const AI_REQUEST_TIMEOUT_MS = 60000;

/**
 * Supported languages
 */
export type TutorLanguage = "en" | "hi" | "as";

/**
 * Message role in a chat conversation
 */
export type TutorMessageRole = "user" | "assistant" | "system";

/**
 * Input mode for chat messages
 */
export type TutorInputMode = "text" | "voice";

/**
 * Chat message structure
 */
export interface TutorMessage {
  role: TutorMessageRole;
  content: string;
}

/**
 * Chat request parameters
 */
export interface TutorChatRequest {
  message: string;
  sessionId: string;
  studentId: string;
  topicId?: string;
  moduleId?: string;
  language: TutorLanguage;
  conversationHistory?: TutorMessage[];
  inputMode?: TutorInputMode;
}

/**
 * Chat response with metadata
 */
export interface TutorChatResponse {
  content: string;
  tokensUsed?: number;
  responseTimeMs: number;
  provider: string;
  context?: string;
}

/**
 * Get hint level based on attempt count
 */
function getHintLevelByAttempts(previousAttempts: number): string {
  if (previousAttempts <= 1) {
    return "gentle nudge";
  }
  if (previousAttempts <= 2) {
    return "more specific hint";
  }
  return "clear guidance toward the answer";
}

/**
 * AI Tutor Service
 */
export class TutorService {
  private readonly ragService: CurriculumRAGService;
  private readonly adaptiveService: AdaptiveLearningService;

  constructor() {
    this.ragService = ragService;
    this.adaptiveService = adaptiveService;
  }

  /**
   * Stream a chat response (for real-time UI updates)
   * Returns a StreamableValue compatible with Vercel AI SDK's useChat
   */
  async streamChat(params: TutorChatRequest) {
    const startTime = Date.now();

    // Get curriculum context via RAG
    const context = params.topicId
      ? await this.ragService.getRelevantContext(params.message, {
          filterLanguage: params.language,
          filterTopic: params.topicId,
          matchCount: 3,
        })
      : await this.ragService.getRelevantContext(params.message, {
          filterLanguage: params.language,
          matchCount: 5,
        });

    // Get student's learning style for personalization
    const learningProfile = await this.adaptiveService.getAdaptedContent(
      params.studentId,
      params.topicId || "general",
    );

    // Build personalized system prompt
    const systemPrompt = buildSystemPrompt({
      language: params.language,
      context,
      learningStyle: learningProfile.preferredStyle,
      showImages: learningProfile.showImages,
      topic: params.topicId,
      module: params.moduleId,
    });

    // Get AI model
    const model = getAIModel("gemini");

    // Convert conversation history to CoreMessage format
    const messages: CoreMessage[] = [
      ...(params.conversationHistory || []).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: params.message },
    ];

    // Stream response using Vercel AI SDK with circuit breaker protection
    // This prevents cascading failures if the AI provider is down
    const breaker = aiProviderBreakers.getBreaker("tutor-chat", {
      failureThreshold: 5,
      timeout: AI_REQUEST_TIMEOUT_MS,
      onStateChange: (state) => {
        if (state === "OPEN") {
          authLogger.error(
            "[TutorService] AI provider circuit breaker OPEN - service degraded",
          );
        } else if (state === "CLOSED") {
          authLogger.info(
            "[TutorService] AI provider circuit breaker CLOSED - service recovered",
          );
        }
      },
    });

    const result = await breaker.execute(async () =>
      streamText({
        model,
        system: systemPrompt,
        messages,
        ...MODEL_CONFIGS.tutor,
        onFinish: async ({ text, usage }) => {
          // Log interaction for teacher visibility
          await this.logInteraction({
            studentId: params.studentId,
            sessionId: params.sessionId,
            topicId: params.topicId,
            messageRole: "assistant",
            messageContent: text,
            inputMode: params.inputMode || "text",
            language: params.language,
            tokensUsed: usage?.totalTokens || 0,
            responseTimeMs: Date.now() - startTime,
          });
        },
      }),
    );

    return result;
  }

  /**
   * Generate a non-streaming response (for API routes)
   */
  async generateResponse(params: TutorChatRequest): Promise<TutorChatResponse> {
    const startTime = Date.now();

    // Get curriculum context via RAG
    const context = await this.ragService.getRelevantContext(params.message, {
      filterLanguage: params.language,
      filterTopic: params.topicId,
      matchCount: 5,
    });

    // Get student's learning style
    const learningProfile = await this.adaptiveService.getAdaptedContent(
      params.studentId,
      params.topicId || "general",
    );

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      language: params.language,
      context,
      learningStyle: learningProfile.preferredStyle,
      showImages: learningProfile.showImages,
      topic: params.topicId,
      module: params.moduleId,
    });

    // Get AI model
    const model = getAIModel("gemini");

    // Convert conversation history
    const messages: CoreMessage[] = [
      ...(params.conversationHistory || []).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: params.message },
    ];

    // Generate response with circuit breaker protection
    const breaker = aiProviderBreakers.getBreaker("tutor-generate", {
      failureThreshold: 5,
      timeout: AI_REQUEST_TIMEOUT_MS,
    });

    const result = await breaker.execute(() =>
      generateText({
        model,
        system: systemPrompt,
        messages,
        ...MODEL_CONFIGS.tutor,
      }),
    );

    const responseTimeMs = Date.now() - startTime;

    // Log interaction
    await this.logInteraction({
      studentId: params.studentId,
      sessionId: params.sessionId,
      topicId: params.topicId,
      messageRole: "assistant",
      messageContent: result.text,
      inputMode: params.inputMode || "text",
      language: params.language,
      tokensUsed: result.usage?.totalTokens || 0,
      responseTimeMs,
    });

    return {
      content: result.text,
      tokensUsed: result.usage?.totalTokens,
      responseTimeMs,
      provider: "gemini",
      context,
    };
  }

  /**
   * Generate feedback for assessment response
   */
  async generateFeedback(params: {
    studentId: string;
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    language: TutorLanguage;
  }): Promise<string> {
    const model = getAIModel("gemini");
    const feedbackPrompt = getFeedbackPrompt(params.language);

    const breaker = aiProviderBreakers.getBreaker("tutor-feedback", {
      failureThreshold: 5,
      timeout: AI_REQUEST_TIMEOUT_MS,
    });

    const result = await breaker.execute(() =>
      generateText({
        model,
        system: feedbackPrompt,
        messages: [
          {
            role: "user",
            content: `<question>${params.question.slice(0, 2000)}</question>
<student_answer>${params.studentAnswer.slice(0, 500)}</student_answer>
Was it correct? ${params.isCorrect ? "Yes" : "No"}
${params.isCorrect ? "" : `Correct answer hint: The answer relates to "${params.correctAnswer.slice(0, 20)}..."`}

Please provide encouraging feedback.`,
          },
        ],
        ...MODEL_CONFIGS.assessment,
      }),
    );

    return result.text;
  }

  /**
   * Generate a hint for a struggling student
   */
  async generateHint(params: {
    studentId: string;
    topicId: string;
    question: string;
    previousAttempts: number;
    language: TutorLanguage;
  }): Promise<string> {
    // Get topic context
    const context = await this.ragService.getTopicContext(
      params.topicId,
      params.language,
      2,
    );

    const hintLevel = getHintLevelByAttempts(params.previousAttempts);

    const model = getAIModel("gemini");

    const breaker = aiProviderBreakers.getBreaker("tutor-hint", {
      failureThreshold: 5,
      timeout: AI_REQUEST_TIMEOUT_MS,
    });

    const result = await breaker.execute(() =>
      generateText({
        model,
        system: `You are providing a ${hintLevel} to help a student answer a question.
Never give away the answer directly. Use the Socratic method.
Language: ${getLanguageLabelForAI(params.language)}`,
        messages: [
          {
            role: "user",
            content: `<question>${params.question.slice(0, 2000)}</question>
Context: ${context}
Previous attempts: ${params.previousAttempts}

Provide a ${hintLevel} to help the student.`,
          },
        ],
        ...MODEL_CONFIGS.retrieval,
      }),
    );

    return result.text;
  }

  /**
   * Log AI tutor interaction for teacher visibility
   */
  private async logInteraction(params: {
    studentId: string;
    sessionId: string;
    topicId?: string;
    messageRole: TutorMessageRole;
    messageContent: string;
    inputMode: TutorInputMode;
    language: TutorLanguage;
    tokensUsed: number;
    responseTimeMs: number;
  }): Promise<void> {
    try {
      const supabase = await createClient();

      const { error: insertError } = await supabase.from("ai_tutor_interactions").insert({
        student_id: params.studentId,
        session_id: params.sessionId,
        topic_id: params.topicId,
        message_role: params.messageRole,
        message_content: params.messageContent,
        input_mode: params.inputMode,
        language: params.language,
        tokens_used: params.tokensUsed,
        response_time_ms: params.responseTimeMs,
      });
      if (insertError) {
        authLogger.error("[Tutor] Error logging interaction:", insertError);
      }
    } catch (error) {
      authLogger.error("[Tutor] Error logging interaction:", error);
    }
  }

  /**
   * Get conversation history for a session
   */
  async getSessionHistory(sessionId: string): Promise<TutorMessage[]> {
    try {
      const supabase = await createClient();

      // PERF-2 FIX: Limit history to prevent unbounded growth
      const { data, error } = await supabase
        .from("ai_tutor_interactions")
        .select("message_role, message_content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw error;

      return (data || []).map((row) => ({
        role: row.message_role as TutorMessageRole,
        content: row.message_content,
      }));
    } catch (error) {
      authLogger.error("[Tutor] Error getting session history:", error);
      return [];
    }
  }
}

// Export singleton instance
export const tutorService = new TutorService();
