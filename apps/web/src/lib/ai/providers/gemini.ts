/**
 * Tiered AI Provider System
 *
 * Priority Order:
 * 1. PRIMARY: Google Gemini 2.0 Flash (paid credits - best quality)
 * 2. SECONDARY: HuggingFace PRO (Mistral/Llama - $9/month)
 * 3. TERTIARY: Groq (FREE tier - rate limited)
 *
 * Uses Vercel AI SDK for streaming and React integration.
 * Automatic fallback on provider errors.
 */

import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

// ===== PRIMARY: Google Gemini =====
// Using Gemini 2.5 Flash (stable) - best balance of speed, quality, and cost
export const geminiProvider = google("gemini-2.5-flash");

export const geminiModels = {
  // Recommended for AI Tutor (1M context, thinking mode)
  flash25: google("gemini-2.5-flash"),
  // High quality for complex tasks
  pro25: google("gemini-2.5-pro"),
  // Faster, cheaper alternative
  flash20: google("gemini-2.0-flash"),
  // Legacy stable
  flash15: google("gemini-1.5-flash"),
  pro15: google("gemini-1.5-pro"),
} as const;

// ===== SECONDARY: HuggingFace PRO =====
// Using OpenAI-compatible endpoint for HuggingFace Inference API
const huggingface = createOpenAICompatible({
  name: "huggingface",
  baseURL: "https://api-inference.huggingface.co/models",
  apiKey: process.env.HUGGINGFACE_API_KEY || "",
});

// HuggingFace models via Inference API
export const huggingfaceModels = {
  mistral7b: huggingface("mistralai/Mistral-7B-Instruct-v0.3"),
  llama8b: huggingface("meta-llama/Meta-Llama-3.1-8B-Instruct"),
  llama70b: huggingface("meta-llama/Meta-Llama-3.1-70B-Instruct"),
} as const;

export const huggingfaceProvider = huggingfaceModels.mistral7b;

// ===== TERTIARY: Groq (FREE) =====
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export const groqProvider = groq("llama-3.3-70b-versatile");

export const groqModels = {
  llama33: groq("llama-3.3-70b-versatile"),
  llama32: groq("llama-3.2-90b-vision-preview"),
  mixtral: groq("mixtral-8x7b-32768"),
} as const;

/**
 * Provider type for configuration
 */
export type AIProviderType = "gemini" | "huggingface" | "groq";

/**
 * TYPE SAFETY: Helper to cast provider to LanguageModelV1 with validation
 * The AI SDK providers implement LanguageModelV1 but have varying type definitions.
 * This helper provides a single point for the cast with runtime validation.
 *
 * @param provider - Any AI provider that implements LanguageModelV1 interface
 * @returns Properly typed LanguageModelV1
 */
function asLanguageModel(provider: {
  doGenerate?: unknown;
  doStream?: unknown;
  specificationVersion?: unknown;
}): LanguageModelV1 {
  // Runtime check: LanguageModelV1 must have these methods
  if (
    typeof provider !== "object" ||
    provider === null ||
    !("specificationVersion" in provider)
  ) {
    throw new Error("Invalid AI provider: does not implement LanguageModelV1");
  }
  // The provider implements the interface - safe to cast
  return provider as LanguageModelV1;
}

/**
 * Check which API keys are configured
 */
function getAvailableProviders() {
  return {
    gemini:
      Boolean(process.env.GEMINI_API_KEY) ||
      Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    huggingface: Boolean(process.env.HUGGINGFACE_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
  };
}

/**
 * Get the appropriate AI model based on preference and availability
 *
 * Priority: Gemini (paid) → HuggingFace (PRO) → Groq (free)
 *
 * @param preferredProvider - Override the default priority
 * @returns The AI model to use (typed as LanguageModelV1 for AI SDK compatibility)
 */
export function getAIModel(preferredProvider?: AIProviderType): LanguageModelV1 {
  const available = getAvailableProviders();

  // If specific provider requested and available, use it
  if (preferredProvider) {
    if (preferredProvider === "gemini" && available.gemini) {
      return asLanguageModel(geminiProvider);
    }
    if (preferredProvider === "huggingface" && available.huggingface) {
      return asLanguageModel(huggingfaceProvider);
    }
    if (preferredProvider === "groq" && available.groq) {
      return asLanguageModel(groqProvider);
    }
  }

  // Default priority: Gemini → HuggingFace → Groq
  if (available.gemini) {
    return asLanguageModel(geminiProvider);
  }
  if (available.huggingface) {
    return asLanguageModel(huggingfaceProvider);
  }
  if (available.groq) {
    return asLanguageModel(groqProvider);
  }

  // No provider available - return Gemini (will error with helpful message)
  return asLanguageModel(geminiProvider);
}

/**
 * Get model with automatic fallback chain
 * Priority: Gemini → HuggingFace → Groq
 *
 * @returns Model and provider info
 */
export async function getModelWithFallback(): Promise<{
  model: LanguageModelV1;
  provider: AIProviderType;
}> {
  const available = getAvailableProviders();

  // Priority 1: Gemini (best quality, paid)
  if (available.gemini) {
    return { model: asLanguageModel(geminiProvider), provider: "gemini" };
  }

  // Priority 2: HuggingFace PRO (good quality, $9/month)
  if (available.huggingface) {
    return { model: asLanguageModel(huggingfaceProvider), provider: "huggingface" };
  }

  // Priority 3: Groq (free tier)
  if (available.groq) {
    return { model: asLanguageModel(groqProvider), provider: "groq" };
  }

  throw new Error(
    "No AI provider configured. Set one of: GEMINI_API_KEY, HUGGINGFACE_API_KEY, or GROQ_API_KEY",
  );
}

/**
 * Get all available providers for display/debugging
 */
export function getProviderStatus(): Record<AIProviderType, boolean> {
  return getAvailableProviders();
}

/**
 * Model configuration for different use cases
 */
export const MODEL_CONFIGS = {
  // Socratic tutoring - needs good reasoning (uses thinking mode)
  tutor: {
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.95,
  },
  // Study/Learning with RAG - faster, cheaper (context already retrieved)
  study: {
    temperature: 0.5,
    maxTokens: 768,
    topP: 0.9,
  },
  // RAG retrieval - more deterministic
  retrieval: {
    temperature: 0.3,
    maxTokens: 512,
    topP: 0.9,
  },
  // Assessment feedback - balanced
  assessment: {
    temperature: 0.5,
    maxTokens: 1024,
    topP: 0.9,
  },
  // Creative content (examples, stories)
  creative: {
    temperature: 0.9,
    maxTokens: 2048,
    topP: 0.95,
  },
} as const;

export type ModelConfigKey = keyof typeof MODEL_CONFIGS;
