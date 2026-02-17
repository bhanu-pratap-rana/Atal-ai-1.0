/**
 * AI Tutor Chat API Route
 *
 * Streaming chat endpoint using Vercel AI SDK.
 * Supports the useChat hook from @ai-sdk/react.
 *
 * Features:
 * - Real-time streaming responses
 * - RAG context retrieval (direct pgvector)
 * - Socratic tutoring method
 * - Trilingual support (EN/HI/AS)
 * - Learning style adaptation
 */

export const maxDuration = 60;

import { streamText } from "ai";
import { z } from "zod";
import { getCurrentUser, createClient } from "@/lib/supabase-server";
import { getAIModel, MODEL_CONFIGS } from "@/lib/ai/providers";
import { ragService } from "@/lib/ai/services/rag-service";
import { adaptiveService } from "@/lib/ai/services/adaptive-service";
import { buildSystemPrompt } from "@/lib/ai/prompts/socratic-tutor";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { authLogger } from "@/lib/auth-logger";
import { gamificationService } from "@/lib/services/gamification-service";
import type {
  TutorLanguage,
  TutorMessageRole,
  TutorInputMode,
} from "@/lib/ai/services/tutor-service";

/**
 * Request body schema for tutor chat API
 * SECURITY: Includes bounds validation to prevent DoS attacks via large payloads
 */
const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z
          .string()
          .min(1, "Message content cannot be empty")
          .max(5000, "Message content must be less than 5000 characters"),
      }),
    )
    .min(1, "At least one message is required")
    .max(100, "Conversation history must not exceed 100 messages"),
  language: z.enum(["en", "hi", "as"]).default("en"),
  topicId: z.string().optional(),
  moduleId: z.string().optional(),
  sessionId: z.string().optional(),
  inputMode: z.enum(["text", "voice"]).default("text"),
});

export async function POST(request: Request): Promise<Response> {
  let user: Awaited<ReturnType<typeof getCurrentUser>> | null = null;

  try {
    // Authenticate user
    user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // At this point, user is guaranteed to be non-null due to the guard above
    const authenticatedUser = user;

    // Rate limit check
    const isAllowed = await checkRateLimit(
      `ai:chat:${authenticatedUser.id}`,
      RATE_LIMITS.aiTutorChat,
    );
    if (!isAllowed) {
      return Response.json(
        { error: "Rate limit exceeded. Please wait before sending another message." },
        { status: 429 },
      );
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData: z.infer<typeof ChatRequestSchema>;
    try {
      validatedData = ChatRequestSchema.parse(body);
    } catch (validationError) {
      // SEC-007 FIX: Log detailed errors server-side, return generic message to client
      const detailedError =
        validationError instanceof z.ZodError
          ? validationError.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join("; ")
          : "Invalid request body";

      authLogger.error("[TutorChat] Request validation failed", {
        error: detailedError,
        userId: authenticatedUser.id,
      });

      // SEC-007 FIX: Return generic error to client to prevent information disclosure
      return Response.json(
        { error: "Invalid request format. Please try again." },
        { status: 400 },
      );
    }

    const { messages, language, topicId, moduleId, sessionId, inputMode } =
      validatedData;

    // Get the latest user message for RAG
    const latestMessage = messages.at(-1);
    // SEC-2 FIX: Truncate user query to limit prompt injection surface
    const userQuery = (latestMessage?.content ?? "").slice(0, 4000);

    // Get curriculum context via RAG (direct pgvector - NO LangChain)
    // Uses multilingual context to prioritize same-language content
    const context = await ragService.getMultilingualContext(
      userQuery,
      language,
      {
        filterTopic: topicId || null,
        matchCount: topicId ? 3 : 5,
      },
    );

    // Get student's learning style for personalization
    const learningProfile = await adaptiveService.getAdaptedContent(
      authenticatedUser.id,
      topicId || "general",
    );

    // Build personalized Socratic system prompt
    const systemPrompt = buildSystemPrompt({
      language,
      context,
      learningStyle: learningProfile.preferredStyle,
      showImages: learningProfile.showImages,
      topic: topicId,
      module: moduleId,
    });

    // Get AI model (Groq primary - FREE tier, Gemini fallback)
    const model = getAIModel();

    // Track start time for logging
    const startTime = Date.now();

    // Log user message
    // SEC-10 FIX: Truncate user content in logs to limit PII exposure
    await logInteraction({
      studentId: authenticatedUser.id,
      sessionId: sessionId || crypto.randomUUID(),
      topicId,
      messageRole: "user",
      messageContent: userQuery.slice(0, 500),
      inputMode,
      language,
      tokensUsed: 0,
      responseTimeMs: 0,
    });

    // Stream response using Vercel AI SDK
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      ...MODEL_CONFIGS.tutor,
      onFinish: async ({ text, usage }) => {
        // Log assistant response - with proper error handling for async operation
        // SECURITY: Errors in logging should not break the response
        try {
          await logInteraction({
            studentId: authenticatedUser.id,
            sessionId: sessionId || crypto.randomUUID(),
            topicId,
            messageRole: "assistant",
            messageContent: text,
            inputMode,
            language,
            tokensUsed: usage?.totalTokens || 0,
            responseTimeMs: Date.now() - startTime,
          });

          // Award points and check badges after successful interaction
          // Uses "voice" for voice input, "question" for text input
          const activityType = inputMode === "voice" ? "voice" : "question";
          await gamificationService.triggerActivityCheck(
            authenticatedUser.id,
            activityType,
          );
        } catch (loggingError) {
          // Log the error but don't throw - user's response is already sent
          authLogger.error(
            "[TutorChat] Failed to log interaction or award points in onFinish callback",
            {
              error:
                loggingError instanceof Error
                  ? loggingError.message
                  : String(loggingError),
              userId: authenticatedUser.id,
              sessionId,
            },
          );
          // Note: Response already streamed, so we can't return error to client
          // This ensures failed logging doesn't break the user's chat experience
        }
      },
    });

    // Return streaming response compatible with useChat
    return result.toDataStreamResponse();
  } catch (error) {
    // Log detailed error for debugging (server-side only)
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Only include stack trace in development to prevent info disclosure
    const isDev = process.env.NODE_ENV === "development";

    authLogger.error("[Tutor API] Unexpected error in chat handler", {
      error: errorMessage,
      stack: isDev && error instanceof Error ? error.stack : undefined,
      userId: user?.id || "unknown",
    });

    // Log additional details for debugging - only in development
    if (isDev) {
      authLogger.debug("[Tutor API] Error details:", {
        message: errorMessage,
        name: error instanceof Error ? error.name : "Unknown",
        cause: error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined,
      });
    }

    // Never expose internal error details to clients - only generic message
    // Detailed errors are logged server-side above for debugging
    return Response.json(
      { error: "An error occurred while processing your message. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Log AI tutor interaction for teacher visibility
 */
async function logInteraction(params: {
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

    await supabase.from("ai_tutor_interactions").insert({
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
  } catch (error) {
    authLogger.error("[Tutor API] Error logging interaction:", error);
  }
}
