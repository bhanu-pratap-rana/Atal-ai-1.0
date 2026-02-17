/**
 * Lesson Download API
 *
 * Generates and packages a lesson for offline use.
 * Returns the lesson content, practice questions, and optionally TTS audio.
 *
 * POST /api/lesson/download
 * Body: { moduleId, topicId, language, includeTTS }
 * Returns: DownloadResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";

// ERR-2: Set max duration for AI generation (prevents Vercel timeout)
export const maxDuration = 60;
import { getAIModel } from "@/lib/ai/providers/gemini";
import { createClient } from "@/lib/supabase-server";
import { retrieveTopicContent, getTopicTitle, getTopicDescriptionSync } from "@/lib/rag/content-retrieval";
import { authLogger } from "@/lib/auth-logger";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { authenticateAndRateLimit, validateRequestBody } from "@/lib/api-utils";
import { parseAIResponseJSON } from "@/lib/ai/lesson-parser";
import type { SupportedLanguage } from "@/types/common";
import type { GeneratedLesson } from "../generate/route";

// ============================================================================
// TYPES
// ============================================================================

interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface DownloadResponse {
  lesson: GeneratedLesson;
  practiceQuestions: PracticeQuestion[];
  images: Array<{ description: string; base64: string }>;
  ttsAudio?: string; // base64 encoded audio
  estimatedSize: number; // bytes
}

// ============================================================================
// VALIDATION
// ============================================================================

// SEC-11 FIX: Use format regex instead of loose min/max to prevent injection
const DownloadRequestSchema = z.object({
  moduleId: z.string().regex(/^[A-Z][A-Za-z0-9]{0,9}$/, "Invalid module ID format"),
  topicId: z.string().regex(/^[A-Z][A-Za-z0-9.]{0,19}$/, "Invalid topic ID format"),
  language: z.enum(["en", "hi", "as"]),
  includeTTS: z.boolean().default(false),
});

// DUP-1 FIX: Zod schemas moved to @/lib/ai/lesson-schemas

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get system prompt for lesson generation
 */
function getSystemPrompt(language: SupportedLanguage): string {
  const languageInstructions: Record<SupportedLanguage, string> = {
    en: "Generate all content in clear, simple English suitable for first-time computer learners.",
    hi: `सभी सामग्री केवल देवनागरी लिपि में लिखें।
CRITICAL: You MUST use Devanagari script (हिंदी) for ALL text content.
NEVER use Roman/Latin characters for Hindi words.
Write technical terms in Devanagari: "कंप्यूटर" not "Computer".`,
    as: `সকলো বিষয়বস্তু কেৱল অসমীয়া লিপিত লিখক।
CRITICAL: You MUST use Assamese script (অসমীয়া) for ALL text content.
NEVER use English or Roman/Latin characters.
Technical terms MUST be in Assamese: "কম্পিউটাৰ" not "Computer".`,
  };

  return `You are an expert educational content designer creating microlearning lessons for rural Indian students learning digital literacy.

TARGET AUDIENCE:
- First-time computer users in rural India
- Age range: 15-45 years
- Learning in their local language

LANGUAGE: ${languageInstructions[language]}

OUTPUT FORMAT (JSON):
{
  "chunks": [
    {
      "type": "concept|example|practice|checkpoint",
      "duration": "2 min",
      "heading": "Section title",
      "content": "Main explanation",
      "visualDescription": "Description of diagram/image",
      "checkpointQuestion": {
        "question": "Quiz question",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "explanation": "Why this is correct"
      }
    }
  ]
}

RULES:
1. Each chunk should be 2-5 minutes of content
2. Total lesson: 5-7 chunks (15-25 minutes)
3. Start with concept, then example, then practice
4. Use LOCAL examples: rice fields, village shops, Bihu festival
5. Include at least 2 checkpoint questions per lesson

IMPORTANT: Return ONLY valid JSON.`;
}

/**
 * Parse AI response into structured lesson.
 * DUP-2 FIX: Uses shared parseAIResponseJSON for JSON cleaning + Zod validation.
 */
function parseAIResponse(
  response: string,
  moduleId: string,
  topicId: string,
  language: SupportedLanguage,
  title: string,
): GeneratedLesson {
  const parsed = parseAIResponseJSON(response);

  const totalMinutes = parsed.chunks.reduce((sum: number, chunk) => {
    const minutes = parseInt(chunk.duration) || 2;
    return sum + minutes;
  }, 0);

  return {
    moduleId,
    topicId,
    language,
    title,
    description: getTopicDescriptionSync(topicId),
    totalDuration: `${totalMinutes} min`,
    chunks: parsed.chunks,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Extract practice questions from lesson chunks
 */
function extractPracticeQuestions(lesson: GeneratedLesson): PracticeQuestion[] {
  const questions: PracticeQuestion[] = [];

  for (let i = 0; i < lesson.chunks.length; i++) {
    const chunk = lesson.chunks[i];
    if (chunk.checkpointQuestion) {
      questions.push({
        id: `${lesson.topicId}-q${i + 1}`,
        question: chunk.checkpointQuestion.question,
        options: chunk.checkpointQuestion.options,
        correctIndex: chunk.checkpointQuestion.correctIndex,
        explanation: chunk.checkpointQuestion.explanation,
      });
    }
  }

  return questions;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // DUP-1: Shared auth + rate limit check
    const authResult = await authenticateAndRateLimit(
      (userId) => `lesson:download:${userId}`,
      RATE_LIMITS.lessonGeneration,
    );
    if (authResult instanceof NextResponse) return authResult;
    const { user: _user } = authResult;

    // DUP-2: Shared request body validation
    const body = await request.json();
    const bodyResult = validateRequestBody(body, DownloadRequestSchema);
    if (bodyResult instanceof NextResponse) return bodyResult;

    const { moduleId, topicId, language, includeTTS } = bodyResult.data;

    const supabase = await createClient();

    // Check for cached lesson first
    const { data: cached } = await supabase
      .from("generated_lessons")
      .select("lesson_json")
      .eq("module_id", moduleId)
      .eq("topic_id", topicId)
      .eq("language", language)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    let lesson: GeneratedLesson;

    if (cached?.lesson_json) {
      lesson = cached.lesson_json as GeneratedLesson;
      authLogger.debug("[/api/lesson/download] Using cached lesson", {
        moduleId,
        topicId,
        language,
        chunksCount: lesson.chunks?.length || 0,
      });
    } else {
      // Generate new lesson
      const ragContent = await retrieveTopicContent({
        moduleId,
        topicId,
        language,
      });

      const title = await getTopicTitle(topicId, language);
      const systemPrompt = getSystemPrompt(language);

      const userPrompt = ragContent.rawContent.length > 0
        ? `Transform this curriculum content into a structured microlearning lesson:

TOPIC: ${ragContent.title}
DESCRIPTION: ${getTopicDescriptionSync(topicId)}

RAW CONTENT:
${ragContent.rawContent.join("\n\n")}

${ragContent.examples.length > 0 ? `EXAMPLES:\n${ragContent.examples.join("\n\n")}` : ""}

Transform this into 5-6 microlearning chunks with checkpoints.`
        : `Create a microlearning lesson about: "${title}"

Topic Description: ${getTopicDescriptionSync(topicId)}

Generate 5-6 chunks covering:
1. Main concept explanation with relatable examples
2. Step-by-step how-to guide
3. Common mistakes to avoid
4. Real-world application example
5. Checkpoint quiz question
6. Summary and next steps`;

      const { text } = await generateText({
        model: getAIModel(),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: 4000,
        temperature: 0.7,
      });

      lesson = parseAIResponse(text, moduleId, topicId, language, title);

      authLogger.debug("[/api/lesson/download] Generated new lesson", {
        moduleId,
        topicId,
        language,
        chunksCount: lesson.chunks?.length || 0,
        totalDuration: lesson.totalDuration,
      });

      // Validate minimum chunks - ensure we have at least 3 chunks for a proper lesson
      if (!lesson.chunks || lesson.chunks.length < 3) {
        authLogger.warn("[/api/lesson/download] Lesson has insufficient chunks", {
          moduleId,
          topicId,
          language,
          chunksCount: lesson.chunks?.length || 0,
        });
      }

      // Cache the generated lesson
      // BUG-015 FIX: Use RPC to support partial unique index (WHERE student_id IS NULL)
      try {
        await supabase.rpc("upsert_generated_lesson", {
          p_module_id: moduleId,
          p_topic_id: topicId,
          p_language: language,
          p_lesson_json: lesson,
          p_cache_version: "1.0",
          p_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch {
        // Cache failed - continue without caching
      }
    }

    // Extract practice questions
    const practiceQuestions = extractPracticeQuestions(lesson);

    // Fetch additional practice questions from database
    const { data: dbQuestions } = await supabase
      .from("practice_questions")
      .select("id, question, options, correct_index, explanation")
      .eq("topic_id", topicId)
      .eq("language", language)
      .order("order_index")
      .limit(20);

    if (dbQuestions) {
      for (const q of dbQuestions) {
        practiceQuestions.push({
          id: q.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correct_index,
          explanation: q.explanation,
        });
      }
    }

    // TTS audio generation - not implemented yet, skip silently
    // Downloads should work without TTS - the client can use browser TTS when offline
    let ttsAudio: string | undefined;
    if (includeTTS) {
      // Future: could generate TTS audio here using Google Cloud TTS
      // For now, client uses browser Speech Synthesis when offline
      authLogger.debug("[/api/lesson/download] TTS requested but using browser TTS instead");
    }

    // Estimate response size without extra serialization pass
    // Average lesson JSON ~15KB, each practice question ~500 bytes
    const estimatedLessonSize = 15_000;
    const estimatedQuestionsSize = practiceQuestions.length * 500;
    const ttsSize = ttsAudio ? ttsAudio.length * 0.75 : 0;
    const estimatedSize = estimatedLessonSize + estimatedQuestionsSize + ttsSize;

    const response: DownloadResponse = {
      lesson,
      practiceQuestions,
      images: [], // Would need image generation service
      ttsAudio,
      estimatedSize,
    };

    // Log the final response for debugging download issues
    authLogger.debug("[/api/lesson/download] Sending response", {
      moduleId,
      topicId,
      language,
      chunksCount: lesson.chunks?.length || 0,
      practiceQuestionsCount: practiceQuestions.length,
      estimatedSize,
    });

    return NextResponse.json(response, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  } catch (error) {
    authLogger.error("[/api/lesson/download] Error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to prepare lesson for download" },
      { status: 500 },
    );
  }
}
