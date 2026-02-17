/**
 * AI Service - Multi-Provider Support
 *
 * Primary: Google Gemini (via Vercel AI SDK)
 * Fallback: Groq (llama-3.3-70b-versatile) or Ollama (cogito:14b)
 *
 * NOTE: Project uses only Google products per requirements.
 * OpenAI was removed.
 *
 * Features:
 * - AI Tutor for personalized learning assistance
 * - Essay feedback and writing analysis
 * - Practice problem generation
 * - Study material summarization
 */

import { authLogger } from "./auth-logger";
import { AI_DEFAULTS, AI_FEATURES, AI_PROVIDERS } from "./constants/ai-config";
import type { AIProviderKey } from "./constants/ai-config";
import { getLanguageLabelForAI } from "./form-utils";
import type { SupportedLanguage } from "@/types/common";

/**
 * Safe JSON extraction from AI response content
 * Avoids regex DoS by using indexOf/lastIndexOf instead of unbounded wildcards
 * @param content - Raw AI response content
 * @param type - Expected JSON type: "object" for {}, "array" for []
 * @returns Extracted JSON string or null if not found
 */
function extractJsonFromContent(
  content: string,
  type: "object" | "array",
): string | null {
  // First try to extract from markdown code blocks (safe approach)
  const codeBlockStart = content.indexOf("```json");
  if (codeBlockStart !== -1) {
    const jsonStart = content.indexOf("\n", codeBlockStart);
    const codeBlockEnd = content.indexOf("```", jsonStart);
    if (jsonStart !== -1 && codeBlockEnd !== -1) {
      return content.slice(jsonStart + 1, codeBlockEnd).trim();
    }
  }

  // Fallback: find the outermost JSON brackets
  const openBracket = type === "object" ? "{" : "[";
  const closeBracket = type === "object" ? "}" : "]";

  const firstOpen = content.indexOf(openBracket);
  const lastClose = content.lastIndexOf(closeBracket);

  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    return content.slice(firstOpen, lastClose + 1);
  }

  return null;
}

type AIProvider = AIProviderKey;

/** Chat message role - who sent the message */
type ChatRole = "system" | "user" | "assistant";

/** Student proficiency level for adaptive content */
type StudentLevel = "beginner" | "intermediate" | "advanced";

interface AIConfig {
  readonly provider: AIProvider;
  readonly apiKey?: string;
  readonly baseUrl?: string;
  readonly model: string;
}

interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string;
}

interface AIResponse {
  readonly success: boolean;
  readonly content?: string;
  readonly error?: string;
  readonly provider: AIProvider;
  readonly model: string;
  readonly tokensUsed?: number;
}

interface TutorContext {
  readonly subject?: string;
  readonly topic?: string;
  readonly studentLevel?: StudentLevel;
  readonly language?: SupportedLanguage;
  readonly previousMessages?: ChatMessage[];
}

interface EssayFeedback {
  readonly overallScore: number;
  readonly grammar: { readonly score: number; readonly issues: readonly string[] };
  readonly clarity: { readonly score: number; readonly suggestions: readonly string[] };
  readonly structure: { readonly score: number; readonly feedback: string };
  readonly content: { readonly score: number; readonly feedback: string };
  readonly improvements: readonly string[];
}

interface PracticeQuestion {
  readonly id: string;
  readonly question: string;
  readonly options?: readonly string[];
  readonly correctAnswer?: string;
  readonly explanation?: string;
  readonly difficulty: "easy" | "medium" | "hard";
}

/**
 * Get AI configuration from environment
 * Uses centralized provider configurations from constants/ai-config.ts
 */
function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || "groq") as AIProvider;

  switch (provider) {
    case "groq":
      return {
        provider: "groq",
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: AI_PROVIDERS.groq.baseUrl,
        model: process.env.GROQ_MODEL || AI_PROVIDERS.groq.defaultModel,
      };
    case "ollama":
      return {
        provider: "ollama",
        baseUrl: process.env.OLLAMA_BASE_URL || AI_PROVIDERS.ollama.baseUrl,
        model: process.env.OLLAMA_MODEL || AI_PROVIDERS.ollama.defaultModel,
      };
    // NOTE: OpenAI case removed - project uses only Google products
    default:
      throw new Error(`Unknown AI provider: ${provider}. Valid options: gemini, groq, ollama`);
  }
}

/**
 * Make API call to AI provider
 */
async function callAI(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<AIResponse> {
  const config = getAIConfig();
  const {
    temperature = AI_DEFAULTS.temperature,
    maxTokens = AI_DEFAULTS.maxTokens,
  } = options || {};

  try {
    if (config.provider === "ollama") {
      // Ollama uses different API format
      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: false,
          options: { temperature, num_predict: maxTokens },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        content: data.message?.content || "",
        provider: config.provider,
        model: config.model,
      };
    }

    // Groq uses OpenAI-compatible API format
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices?.[0]?.message?.content || "",
      provider: config.provider,
      model: config.model,
      tokensUsed: data.usage?.total_tokens,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    authLogger.error(
      `[AIService] Error with provider ${config.provider}`,
      error,
      { provider: config.provider },
    );
    return {
      success: false,
      error: errorMessage,
      provider: config.provider,
      model: config.model,
    };
  }
}

/**
 * AI Tutor - Get help with learning topics
 */
export async function askTutor(
  question: string,
  context?: TutorContext,
): Promise<AIResponse> {
  const languageInstructions = {
    en: "Respond in English.",
    hi: "Respond in Hindi (हिंदी में जवाब दें).",
    as: "Respond in Assamese (অসমীয়াত উত্তৰ দিয়ক).",
  };

  const levelInstructions = {
    beginner: "Use simple language and basic explanations. Avoid jargon.",
    intermediate: "Use moderate complexity. Explain technical terms when used.",
    advanced: "Use technical language and provide in-depth explanations.",
  };

  const systemPrompt = `You are ATAL AI Tutor, a helpful and patient educational assistant for students in rural Northeast India.

Your role:
- Help students understand digital literacy concepts
- Provide clear, step-by-step explanations
- Use real-world examples relevant to rural India
- Be encouraging and supportive
- Adapt to the student's level

${context?.subject ? `Subject focus: ${context.subject}` : ""}
${context?.topic ? `Current topic: ${context.topic}` : ""}
${levelInstructions[context?.studentLevel || "beginner"]}
${languageInstructions[context?.language || "en"]}

Keep responses concise but helpful. Use bullet points for lists. Include practical examples when possible.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...(context?.previousMessages || []),
    { role: "user", content: question },
  ];

  return callAI(messages, AI_FEATURES.tutor);
}

/**
 * Essay Feedback - Analyze and provide feedback on student writing
 */
export async function getEssayFeedback(
  essay: string,
  topic?: string,
  language: SupportedLanguage = "en",
): Promise<AIResponse & { feedback?: EssayFeedback }> {
  const systemPrompt = `You are an essay reviewer for students learning digital literacy.

Analyze the essay and provide feedback in JSON format:
{
  "overallScore": <1-10>,
  "grammar": { "score": <1-10>, "issues": ["issue1", "issue2"] },
  "clarity": { "score": <1-10>, "suggestions": ["suggestion1"] },
  "structure": { "score": <1-10>, "feedback": "feedback text" },
  "content": { "score": <1-10>, "feedback": "feedback text" },
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Be constructive and encouraging. Focus on how to improve, not just what's wrong.
${topic ? `Essay topic: ${topic}` : ""}
Essay language: ${getLanguageLabelForAI(language)}`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Please review this essay:\n\n${essay}` },
  ];

  const response = await callAI(messages, AI_FEATURES.essayFeedback);

  if (response?.success && response?.content) {
    try {
      // Extract JSON from response using safe extraction (avoids regex DoS)
      const jsonStr =
        extractJsonFromContent(response.content, "object") || response.content;
      const feedback = JSON.parse(jsonStr) as EssayFeedback;
      return { ...response, feedback };
    } catch (error) {
      // Return response without parsed feedback if JSON parsing fails
      authLogger.warn(
        "[AI] Essay feedback JSON parsing failed",
        error instanceof Error ? error : { error: String(error) },
      );
      return response;
    }
  }

  return response;
}

/**
 * Practice Generator - Generate practice questions on a topic
 */
export async function generatePracticeQuestions(
  topic: string,
  count: number = 5,
  difficulty: "easy" | "medium" | "hard" = "medium",
  language: SupportedLanguage = "en",
): Promise<AIResponse & { questions?: PracticeQuestion[] }> {
  const languageNames = { en: "English", hi: "Hindi", as: "Assamese" };

  const systemPrompt = `You are a quiz generator for digital literacy education in rural India.

Generate ${count} multiple-choice questions about "${topic}" at ${difficulty} difficulty level.

Output ONLY valid JSON array:
[
  {
    "id": "q1",
    "question": "Question text in ${languageNames[language]}",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "A",
    "explanation": "Brief explanation why this is correct",
    "difficulty": "${difficulty}"
  }
]

Requirements:
- Questions should be practical and relevant to rural Indian context
- Include real-world examples (farming apps, government services, local business)
- Make options plausible but distinguishable
- Explanations should be educational`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Generate ${count} ${difficulty} questions about: ${topic}`,
    },
  ];

  const response = await callAI(messages, AI_FEATURES.practiceQuestions);

  if (response?.success && response?.content) {
    try {
      // Extract JSON array from response using safe extraction (avoids regex DoS)
      const jsonStr =
        extractJsonFromContent(response.content, "array") || response.content;
      const questions = JSON.parse(jsonStr) as PracticeQuestion[];
      return { ...response, questions };
    } catch (error) {
      authLogger.warn(
        "[AI] Practice questions JSON parsing failed",
        error instanceof Error ? error : { error: String(error) },
      );
      return response;
    }
  }

  return response;
}

/**
 * Study Summarizer - Create study notes from content
 */
export async function summarizeContent(
  content: string,
  format: "notes" | "flashcards" | "outline" = "notes",
  language: SupportedLanguage = "en",
): Promise<AIResponse> {
  const formatInstructions = {
    notes:
      "Create concise study notes with key points and important definitions.",
    flashcards:
      'Create flashcard pairs in format: "Q: question | A: answer" (one per line)',
    outline: "Create a hierarchical outline with main topics and subtopics.",
  };

  const languageNames = { en: "English", hi: "Hindi", as: "Assamese" };

  const systemPrompt = `You are a study assistant helping students in rural India.

${formatInstructions[format]}

Respond in ${languageNames[language]}.
Keep it simple and easy to understand.
Focus on practical applications relevant to rural contexts.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Summarize this content:\n\n${content}` },
  ];

  return callAI(messages, AI_FEATURES.summarization);
}

/**
 * Check AI service availability
 */
export async function checkAIService(): Promise<{
  available: boolean;
  provider: AIProvider;
  model: string;
  error?: string;
}> {
  const config = getAIConfig();

  try {
    const response = await callAI(
      [{ role: "user", content: 'Hello, respond with just "OK"' }],
      { maxTokens: 10 },
    );

    return {
      available: response.success,
      provider: config.provider,
      model: config.model,
      error: response.error,
    };
  } catch (error) {
    return {
      available: false,
      provider: config.provider,
      model: config.model,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export type {
  AIProvider,
  AIConfig,
  ChatMessage,
  AIResponse,
  TutorContext,
  EssayFeedback,
  PracticeQuestion,
};
