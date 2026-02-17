/**
 * Lesson Generator API
 *
 * Transforms RAG-retrieved curriculum content into structured
 * microlearning lessons using AI.
 *
 * Uses Google Gemini for lesson generation (already configured).
 *
 * POST /api/lesson/generate
 * Body: { moduleId, topicId, language, learningStyle? }
 * Returns: GeneratedLesson
 */

// BP-3 FIX: Set max duration for AI generation (prevents Vercel timeout)
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { getAIModel } from "@/lib/ai/providers/gemini";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { retrieveTopicContent, getTopicTitle, getTopicDescriptionSync } from "@/lib/rag/content-retrieval";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { parseAIResponseJSON } from "@/lib/ai/lesson-parser";
import type { SupportedLanguage } from "@/types/common";

// API-001 FIX: Cache version for lesson generation
// Increment this when the AI model, prompts, or generation logic changes
// to ensure stale cached content is refreshed
// Bump when AI model, prompts, parser, or token budget changes
const LESSON_CACHE_VERSION = "1.2";

export interface LessonChunk {
  type: "concept" | "example" | "practice" | "checkpoint";
  duration: string;
  heading: string;
  content: string;
  visualDescription?: string;
  checkpointQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
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


/**
 * Non-Latin scripts (Assamese, Hindi) use ~2-3x more tokens per character.
 * Increase maxTokens for these languages to prevent truncated JSON responses.
 */
function getMaxTokens(language: SupportedLanguage): number {
  return language === "en" ? 4000 : 6000;
}

/**
 * Request validation schema
 * Validates input lengths and enum values
 */
const LessonRequestSchema = z.object({
  // VAL-1/2 FIX: Use strict regex to match lesson/download and modules/units routes
  moduleId: z.string().regex(/^[A-Z][A-Za-z0-9]{0,9}$/, "Invalid module ID format"),
  topicId: z.string().regex(/^[A-Z][A-Za-z0-9.]{0,19}$/, "Invalid topic ID format"),
  language: z.enum(["en", "hi", "as"]),
  learningStyle: z.enum(["visual", "text", "auditory"]).default("text"),
  masteryLevel: z.number().min(0).max(100).default(50),
});

// DUP-1 FIX: Zod schemas moved to @/lib/ai/lesson-schemas

/**
 * Get system prompt for lesson generation
 */
function getSystemPrompt(language: SupportedLanguage, learningStyle: string, masteryLevel: number): string {
  const languageInstructions: Record<SupportedLanguage, string> = {
    en: `CRITICAL: Generate ALL content in pure, simple English only.
NEVER use Hindi, Hinglish, or any Indian language words written in Roman script.
DO NOT write things like "Namaste", "Kaam", "Jankari Dena", "Sochna", "Seekhenge" etc.
DO NOT mix Hindi words into English sentences. Use ONLY English vocabulary.
Good example: "Hello! Today we will learn about the four main jobs of a computer."
Bad example: "Namaste! Aaj hum computer ke chaar kaam seekhenge." (THIS IS WRONG - this is Hinglish, not English)
Use everyday English examples that rural Indian students can relate to (like making tea, farming, cooking).
Keep sentences short and simple for first-time computer learners.`,
    hi: `सभी सामग्री केवल देवनागरी लिपि में लिखें।
CRITICAL: You MUST use Devanagari script (हिंदी) for ALL text content.
NEVER use Roman/Latin characters for Hindi words (no "computer", no "Kaam", no "Input").
Write technical terms in Devanagari: "कंप्यूटर" not "Computer", "इनपुट" not "Input", "आउटपुट" not "Output".
If you write ANY Roman Hindi like "Kaam" instead of "काम", the response is INVALID.
EXCEPTION: The "visualDescription" field MUST be in English (it is used for AI image generation, not shown to students).
Keep language simple for first-time computer learners in rural India.`,
    as: `সকলো বিষয়বস্তু কেৱল অসমীয়া লিপিত লিখক।
CRITICAL: You MUST use Assamese script (অসমীয়া) for ALL text content.
NEVER use English or Roman/Latin characters for Assamese words.
Write ALL headings, content, explanations in Assamese script.
Technical terms MUST be in Assamese: "কম্পিউটাৰ" not "Computer", "ইনপুট" not "Input", "আউটপুট" not "Output", "প্ৰচেছিং" not "Processing".
Example good: "কম্পিউটাৰৰ চাৰিটা মূল কাম"
Example bad: "Computer-ৰ চাৰিটা মূল কাম" (DO NOT mix English)
If you write ANY English words in the Assamese content, the response is INVALID.
EXCEPTION: The "visualDescription" field MUST be in English (it is used for AI image generation, not shown to students).
Keep language simple for rural Assamese learners. Use examples from Assamese culture: চাহ বাগিচা (tea gardens), বিহু উৎসৱ (Bihu festival), মুগা ৰেচম (Muga silk).`,
  };

  const styleInstructions: Record<string, string> = {
    visual: "Emphasize visual descriptions and diagrams. Include detailed image descriptions for each concept.",
    text: "Focus on clear written explanations with step-by-step instructions.",
    auditory: "Use conversational tone as if speaking to the student. Include pronunciation guides for technical terms.",
  };

  return `You are an expert educational content designer creating microlearning lessons for rural Indian students learning digital literacy.

TARGET AUDIENCE:
- First-time computer users in rural India
- Age range: 15-45 years
- May have limited formal education
- Learning in their local language

LANGUAGE: ${languageInstructions[language]}

LEARNING STYLE: ${styleInstructions[learningStyle]}

MASTERY LEVEL: Student is at ${masteryLevel}% mastery. ${
    masteryLevel < 30
      ? "Use very basic explanations, many examples."
      : masteryLevel < 70
        ? "Balance explanation with practice."
        : "Focus on advanced tips and edge cases."
  }

OUTPUT FORMAT (JSON):
{
  "chunks": [
    {
      "type": "concept|example|practice|checkpoint",
      "duration": "2 min",
      "heading": "Section title",
      "content": "Main explanation (2-3 paragraphs max)",
      "visualDescription": "MUST be in English — detailed description of diagram/image for AI image generation (e.g. 'Labeled diagram of desktop computer parts: monitor, keyboard, mouse, CPU tower')",
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
3. Start with concept, then example, then practice, with checkpoints every 2-3 chunks
4. Use LOCAL examples: rice fields, village shops, Bihu festival, mangoes, tea gardens
5. Avoid jargon - explain technical terms simply
6. Include at least 2 checkpoint questions per lesson
7. CRITICAL: "visualDescription" MUST ALWAYS be written in English regardless of the lesson language, because it is used as a prompt for AI image generation which only understands English. Example: "Simple diagram showing four main computer parts: monitor, keyboard, mouse, and CPU tower with labels and arrows"
8. Visual descriptions should be detailed enough for AI image generation

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or extra text.`;
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
 * Generate fallback lesson when AI fails
 */
function generateFallbackLesson(
  moduleId: string,
  topicId: string,
  language: SupportedLanguage,
  ragContent: { title: string; rawContent: string[]; examples: string[] },
): GeneratedLesson {
  const chunks: LessonChunk[] = [];

  // Concept chunk from raw content
  if (ragContent.rawContent.length > 0) {
    chunks.push({
      type: "concept",
      duration: "3 min",
      heading: ragContent.title,
      content: ragContent.rawContent.slice(0, 2).join("\n\n"),
    });
  }

  // Example chunk
  if (ragContent.examples.length > 0) {
    chunks.push({
      type: "example",
      duration: "2 min",
      heading: language === "en" ? "Real-World Example" : language === "hi" ? "वास्तविक उदाहरण" : "বাস্তৱ উদাহৰণ",
      content: ragContent.examples[0],
    });
  }

  // Default checkpoint
  chunks.push({
    type: "checkpoint",
    duration: "2 min",
    heading: language === "en" ? "Quick Check" : language === "hi" ? "त्वरित जांच" : "দ্ৰুত পৰীক্ষা",
    content: language === "en"
      ? "Let's see what you learned!"
      : language === "hi"
        ? "आइए देखें आपने क्या सीखा!"
        : "আহক চাওঁ আপুনি কি শিকিলে!",
    checkpointQuestion: {
      question: language === "en"
        ? `What is the main topic of this lesson?`
        : language === "hi"
          ? `इस पाठ का मुख्य विषय क्या है?`
          : `এই পাঠৰ মূল বিষয় কি?`,
      options: [
        ragContent.title,
        language === "en" ? "Something else" : language === "hi" ? "कुछ और" : "আন কিবা",
        language === "en" ? "Not sure" : language === "hi" ? "पता नहीं" : "নিশ্চিত নহয়",
        language === "en" ? "All of the above" : language === "hi" ? "उपरोक्त सभी" : "ওপৰৰ সকলো",
      ],
      correctIndex: 0,
      explanation: language === "en"
        ? `Correct! This lesson is about ${ragContent.title}.`
        : language === "hi"
          ? `सही! यह पाठ ${ragContent.title} के बारे में है।`
          : `শুদ্ধ! এই পাঠটো ${ragContent.title} বিষয়ে।`,
    },
  });

  return {
    moduleId,
    topicId,
    language,
    title: ragContent.title,
    description: getTopicDescriptionSync(topicId),
    totalDuration: `${chunks.length * 2} min`,
    chunks,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Authentication check - CRITICAL
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // SECURITY: Rate limit to prevent Gemini API cost exploitation
    // Lesson generation is expensive, so we limit to 20 requests per 10 minutes
    const isAllowed = await checkRateLimit(
      `lesson:generate:${user.id}`,
      RATE_LIMITS.lessonGeneration,
    );
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating another lesson." },
        { status: 429 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = LessonRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const { moduleId, topicId, language, learningStyle, masteryLevel } = validation.data;

    // Check for cached lesson first
    // API-001 FIX: Also check cache_version to ensure stale content is refreshed when logic changes
    const supabase = await createClient();
    const { data: cached } = await supabase
      .from("generated_lessons")
      .select("lesson_json, cache_version")
      .eq("module_id", moduleId)
      .eq("topic_id", topicId)
      .eq("language", language)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    // Only use cache if version matches current version
    if (cached?.lesson_json && cached?.cache_version === LESSON_CACHE_VERSION) {
      // API-003 FIX: Add cache headers for lesson content
      // Cache for 1 hour on client only - private since content requires authentication
      // SEC-006: Changed from public to private to prevent CDN/proxy caching of auth content
      return NextResponse.json(cached.lesson_json, {
        headers: {
          "Cache-Control": "private, max-age=3600, stale-while-revalidate=43200",
        },
      });
    }

    // Retrieve content from RAG
    const ragContent = await retrieveTopicContent({
      moduleId,
      topicId,
      language,
    });

    // Check if we have actual content to work with
    const hasContent = ragContent.rawContent.length > 0 ||
      ragContent.examples.length > 0 ||
      ragContent.definitions.length > 0;

    let lesson: GeneratedLesson;

    if (!hasContent) {
      // No content in database - generate from topic metadata only
      const title = await getTopicTitle(topicId, language);
      const description = getTopicDescriptionSync(topicId);

      const systemPrompt = getSystemPrompt(language, learningStyle, masteryLevel);
      const userPrompt = `Create a microlearning lesson about: "${title}"

Topic Description: ${description}

This is for Module ${moduleId}, covering digital literacy basics for rural Indian students.

Generate 5-6 chunks covering:
1. Main concept explanation with relatable examples
2. Step-by-step how-to guide
3. Common mistakes to avoid
4. Real-world application example
5. Checkpoint quiz question
6. Summary and next steps

Use culturally relevant examples (village life, agriculture, local festivals, tea gardens).`;

      try {
        const { text } = await generateText({
          model: getAIModel(),
          system: systemPrompt,
          prompt: userPrompt,
          maxTokens: getMaxTokens(language),
          temperature: 0.7,
        });

        lesson = parseAIResponse(text, moduleId, topicId, language, title);
      } catch (aiError) {
        // AI failed - generate minimal fallback lesson from topic metadata
        authLogger.warn("[/api/lesson/generate] AI generation failed, using metadata fallback:", {
          moduleId,
          topicId,
          error: aiError instanceof Error ? aiError.message : String(aiError),
        });
        lesson = generateFallbackLesson(moduleId, topicId, language, {
          title,
          rawContent: [description],
          examples: [],
        });
      }
    } else {
      // Have content - enhance with AI
      const systemPrompt = getSystemPrompt(language, learningStyle, masteryLevel);
      // SEC-4 FIX: Wrap RAG content in XML delimiters to reduce prompt injection surface
      const userPrompt = `Transform this curriculum content into a structured microlearning lesson:

TOPIC: ${ragContent.title}
DESCRIPTION: ${getTopicDescriptionSync(topicId)}

<curriculum_content>
${ragContent.rawContent.join("\n\n")}

${ragContent.examples.length > 0 ? `EXAMPLES:\n${ragContent.examples.join("\n\n")}` : ""}

${ragContent.culturalContext.length > 0 ? `CULTURAL CONTEXT:\n${ragContent.culturalContext.join("\n\n")}` : ""}

${ragContent.definitions.length > 0 ? `KEY DEFINITIONS:\n${ragContent.definitions.join("\n\n")}` : ""}
</curriculum_content>

Transform this into 5-6 microlearning chunks with checkpoints. Make it engaging for rural Indian students.`;

      try {
        const { text } = await generateText({
          model: getAIModel(),
          system: systemPrompt,
          prompt: userPrompt,
          maxTokens: getMaxTokens(language),
          temperature: 0.7,
        });

        lesson = parseAIResponse(text, moduleId, topicId, language, ragContent.title);
      } catch {
        // AI failed - use fallback
        lesson = generateFallbackLesson(moduleId, topicId, language, ragContent);
      }
    }

    // Cache the generated lesson (expires in 7 days)
    // API-001 FIX: Include cache version for invalidation when generation logic changes
    // BUG-015 FIX: Use RPC to support partial unique index (WHERE student_id IS NULL)
    // The partial index doesn't work with Supabase JS .upsert() onConflict option,
    // so we use a SECURITY DEFINER RPC that uses native PostgreSQL ON CONFLICT ... WHERE
    try {
      const { error: cacheError } = await supabase.rpc("upsert_generated_lesson", {
        p_module_id: moduleId,
        p_topic_id: topicId,
        p_language: language,
        p_lesson_json: lesson,
        p_cache_version: LESSON_CACHE_VERSION,
        p_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      // ERR-002 FIX: Log cache write failures for debugging
      if (cacheError) {
        authLogger.warn("[/api/lesson/generate] Cache write failed:", {
          moduleId,
          topicId,
          error: cacheError.message,
        });
      }
    } catch (cacheErr) {
      // ERR-002 FIX: Log cache exceptions for debugging
      authLogger.warn("[/api/lesson/generate] Cache exception:", {
        moduleId,
        topicId,
        error: cacheErr instanceof Error ? cacheErr.message : String(cacheErr),
      });
    }

    // API-003 FIX: Add cache headers for freshly generated lesson content
    // SEC-013 FIX: Use private cache for authenticated content
    return NextResponse.json(lesson, {
      headers: {
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    // Log detailed error server-side only
    authLogger.error("[/api/lesson/generate] Error:", {
      error: error instanceof Error ? error.message : String(error),
      // Only include stack in development
      stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to generate lesson" },
      { status: 500 },
    );
  }
}
