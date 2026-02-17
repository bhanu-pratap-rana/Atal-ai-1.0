/**
 * AI Services Index
 *
 * Exports all AI services for the ATAL AI platform.
 */

// RAG Service - Curriculum Context Retrieval
export {
  CurriculumRAGService,
  ragService,
  type CurriculumMatch,
  type RAGSearchOptions,
} from "./rag-service";

// TTS Service - AI4Bharat Text-to-Speech
export {
  TTSService,
  ttsService,
  type TTSLanguage,
  type TTSOptions,
  type VoiceConfig,
} from "./tts-service";

// Adaptive Learning Service
export {
  AdaptiveLearningService,
  adaptiveService,
  type LearningStyle,
  type ConfidenceLevel,
  type TopicPerformance,
  type KnowledgeState,
  type LearningStyleProfile,
  type ContentAdaptation,
  type BehaviorSignal,
} from "./adaptive-service";

// Tutor Service - Socratic AI Tutoring
export {
  TutorService,
  tutorService,
  type TutorLanguage,
  type TutorMessage,
  type TutorChatRequest,
  type TutorChatResponse,
} from "./tutor-service";
