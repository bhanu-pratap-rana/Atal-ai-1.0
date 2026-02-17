/**
 * AI Service Configuration Constants
 *
 * Centralized configuration for AI features.
 * Prevents magic numbers scattered across the codebase.
 *
 * Rule.md Compliance:
 * - Single source of truth for AI configuration
 * - Easy to modify and test
 * - Type-safe
 */

/**
 * Default AI parameters
 */
export const AI_DEFAULTS = {
  /** Default temperature for balanced creativity */
  temperature: 0.7,
  /** Default max tokens for general responses */
  maxTokens: 2048,
} as const;

/**
 * Feature-specific AI configurations
 */
export const AI_FEATURES = {
  /** AI Tutor - conversational, moderate creativity */
  tutor: {
    temperature: 0.7,
    maxTokens: 1024,
  },
  /** Essay Feedback - analytical, low creativity for consistency */
  essayFeedback: {
    temperature: 0.3,
    maxTokens: 1024,
  },
  /** Practice Questions - balanced creativity for variety */
  practiceQuestions: {
    temperature: 0.5,
    maxTokens: 2048,
  },
  /** Content Summarization - analytical, low creativity */
  summarization: {
    temperature: 0.3,
    maxTokens: 1024,
  },
} as const;

/**
 * Provider configurations
 *
 * NOTE: Project uses only Google products (Gemini, Vertex AI).
 * Groq and Ollama are kept as development/testing fallbacks.
 * OpenAI was removed per project requirements.
 */
export const AI_PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    defaultModel: "gemini-2.5-flash-preview-05-20",
    baseUrl: "https://generativelanguage.googleapis.com/v1",
    embeddingModel: "text-embedding-004",
    embeddingDimensions: 768,
  },
  groq: {
    name: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
  },
  ollama: {
    name: "Ollama",
    defaultModel: "cogito:14b",
    baseUrl: "http://localhost:11434",
  },
  // NOTE: OpenAI removed - project uses only Google products
} as const;

/**
 * TTS (Text-to-Speech) configurations
 */
export const TTS_CONFIG = {
  ai4bharat: {
    name: "AI4Bharat Indic-Parler-TTS",
    huggingFaceUrl:
      "https://api-inference.huggingface.co/models/ai4bharat/indic-parler-tts",
    supportedLanguages: ["en", "hi", "as"] as const,
    defaultVoice: "female",
    defaultEmotion: "friendly",
  },
} as const;

/**
 * Voice recognition (STT) configurations
 */
export const STT_CONFIG = {
  webSpeechApi: {
    name: "Web Speech API",
    languageCodes: {
      en: "en-IN",
      hi: "hi-IN",
      as: "as-IN", // Assamese supported!
    } as const,
  },
} as const;

/**
 * Supported languages for AI responses
 */
export const AI_LANGUAGES = {
  en: "English",
  hi: "Hindi",
  as: "Assamese",
} as const;

/**
 * Type definitions
 */
export type AIProviderKey = keyof typeof AI_PROVIDERS;
export type AILanguageKey = keyof typeof AI_LANGUAGES;
export type AIFeatureKey = keyof typeof AI_FEATURES;
