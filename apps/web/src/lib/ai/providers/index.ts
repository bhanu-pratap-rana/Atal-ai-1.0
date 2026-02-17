/**
 * AI Providers Index
 *
 * Exports all AI provider configurations for the ATAL AI platform.
 * Primary: Google Gemini 2.5 Flash
 * Fallback: Groq Llama 3.3
 */

export {
  geminiProvider,
  geminiModels,
  groqProvider,
  groqModels,
  getAIModel,
  getModelWithFallback,
  MODEL_CONFIGS,
  type AIProviderType,
  type ModelConfigKey,
} from "./gemini";
