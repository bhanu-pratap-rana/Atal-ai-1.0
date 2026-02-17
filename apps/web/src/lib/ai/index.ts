/**
 * ATAL AI - AI Service Layer
 *
 * Complete AI infrastructure for the ATAL AI educational platform.
 *
 * Features:
 * - Socratic AI Tutoring (Gemini 2.5 Flash + Groq fallback)
 * - RAG with direct pgvector (NO LangChain - 40% faster)
 * - Adaptive Learning (knowledge tracking + learning styles)
 * - Voice AI (Web Speech API + AI4Bharat TTS)
 *
 * Usage:
 * ```typescript
 * import { tutorService, ragService, adaptiveService, ttsService } from '@/lib/ai';
 *
 * // Stream a tutoring response
 * const stream = await tutorService.streamChat({
 *   message: 'What is the internet?',
 *   studentId: 'uuid',
 *   sessionId: 'uuid',
 *   language: 'as', // Assamese
 * });
 *
 * // Get RAG context
 * const context = await ragService.getRelevantContext('internet safety');
 *
 * // Track learning behavior
 * await adaptiveService.trackBehavior(studentId, { type: 'voice_replay' });
 *
 * // Synthesize speech
 * const audio = await ttsService.synthesize('নমস্কাৰ', 'as');
 * ```
 */

// Providers
export * from "./providers";

// Services
export * from "./services";

// Prompts
export * from "./prompts";

// AI Configuration (from existing constants)
export {
  AI_DEFAULTS,
  AI_FEATURES,
  AI_PROVIDERS,
  AI_LANGUAGES,
  type AIProviderKey,
  type AILanguageKey,
  type AIFeatureKey,
} from "../constants/ai-config";
