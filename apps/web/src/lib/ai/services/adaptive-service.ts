/**
 * Adaptive Learning Service
 *
 * Implements personalized learning through:
 * 1. Knowledge State Tracking - per-topic mastery scores
 * 2. Learning Style Detection - visual/text/auditory preferences
 * 3. Spaced Repetition - optimal review scheduling
 * 4. Content Personalization - adapt based on student profile
 *
 * Research basis:
 * - Bayesian Knowledge Tracing (BKT)
 * - VARK Learning Styles Model
 * - Ebbinghaus Forgetting Curve
 *
 * OFFLINE SYNC INTEGRATION:
 *
 * Knowledge state updates are synced offline using the 'progress_update'
 * mutation type. Client integration pattern:
 *
 * ```tsx
 * // In components tracking learning progress:
 * import { useOfflineSync } from '@/hooks';
 *
 * const { updateProgressWithSync } = useOfflineSync();
 *
 * const handleProgressUpdate = async (studentId, topicId, moduleId, state) => {
 *   if (!navigator.onLine) {
 *     // Queue state update for later sync
 *     await updateProgressWithSync({
 *       student_id: studentId,
 *       topic_id: topicId,
 *       module_id: moduleId,
 *       mastery_score: state.masteryScore,
 *       confidence_level: state.confidenceLevel,
 *       attempts: state.attempts,
 *       time_spent_seconds: state.timeSpent,
 *       status: state.status,
 *     });
 *     return;
 *   }
 *
 *   // Online - call AdaptiveService.updateKnowledgeState() normally
 *   await adaptiveService.updateKnowledgeState(studentId, topicId, state);
 * };
 * ```
 *
 * See: /src/lib/offline/mutation-queue.ts for sync implementation.
 */

import { createClient } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { validateUpdateKnowledgeStateResponse } from "@/lib/rpc-validators";

/**
 * Learning style types (VARK model)
 */
export type LearningStyle = "visual" | "text" | "auditory";

/**
 * Confidence levels for knowledge state
 */
export type ConfidenceLevel = "low" | "medium" | "high";

/**
 * Topic performance from assessment
 */
export interface TopicPerformance {
  isCorrect: boolean;
  responseTimeMs: number;
  aiHintRequested: boolean;
  attemptNumber: number;
}

/**
 * Knowledge state for a topic
 */
export interface KnowledgeState {
  topic_id: string;
  module_id: string;
  mastery_score: number;
  confidence_level: ConfidenceLevel;
  attempts: number;
  time_spent_seconds: number;
  last_attempt_at: string | null;
  status: "not_started" | "in_progress" | "mastered";
}

/**
 * Learning style profile
 */
export interface LearningStyleProfile {
  visual_score: number;
  text_score: number;
  auditory_score: number;
  preferred_style: LearningStyle;
  images_viewed: number;
  voice_replays: number;
  text_read_time_seconds: number;
}

/**
 * Content adaptation settings
 */
export interface ContentAdaptation {
  showImages: boolean;
  enableVoice: boolean;
  textComplexity: "simple" | "detailed";
  preferredStyle: LearningStyle;
  suggestedPace: "slow" | "normal" | "fast";
}

/**
 * Behavior signal for learning style detection
 */
export interface BehaviorSignal {
  type:
    | "image_viewed"
    | "voice_replay"
    | "text_read"
    | "hint_requested"
    | "answer_submitted";
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Adaptive Learning Service
 */
export class AdaptiveLearningService {
  /**
   * Track behavior signals for learning style detection
   */
  async trackBehavior(
    studentId: string,
    signal: BehaviorSignal,
  ): Promise<void> {
    try {
      const supabase = await createClient();

      switch (signal.type) {
        case "image_viewed": {
          const { error } = await supabase.rpc("increment_visual_score", {
            p_student_id: studentId,
            p_time_seconds: signal.duration || 5,
          });
          if (error) {
            authLogger.warn("[trackBehavior] Failed to update visual score", {
              error: error.message,
              studentId,
            });
          }
          break;
        }

        case "voice_replay": {
          const { error } = await supabase.rpc("increment_auditory_score", {
            p_student_id: studentId,
          });
          if (error) {
            authLogger.warn("[trackBehavior] Failed to update auditory score", {
              error: error.message,
              studentId,
            });
          }
          break;
        }

        case "text_read": {
          const { error } = await supabase.rpc("increment_text_score", {
            p_student_id: studentId,
            p_time_seconds: signal.duration || 30,
          });
          if (error) {
            authLogger.warn("[trackBehavior] Failed to update text score", {
              error: error.message,
              studentId,
            });
          }
          break;
        }
      }
    } catch (error) {
      authLogger.error("[Adaptive] Error tracking behavior:", error);
    }
  }

  /**
   * Get learning style profile for a student
   */
  async getLearningStyleProfile(
    studentId: string,
  ): Promise<LearningStyleProfile | null> {
    try {
      const supabase = await createClient();

      // OPTIMIZATION: Select only needed columns instead of *
      const { data, error } = await supabase
        .from("learning_style_profile")
        .select(
          "id, student_id, visual_score, text_score, auditory_score, preferred_style, images_viewed, voice_replays, text_read_time_seconds, updated_at",
        )
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // No profile exists, create default
        return await this.createDefaultProfile(studentId);
      }

      return data as LearningStyleProfile;
    } catch (error) {
      authLogger.error("[Adaptive] Error getting learning style:", error);
      return null;
    }
  }

  /**
   * Create default learning style profile
   */
  private async createDefaultProfile(
    studentId: string,
  ): Promise<LearningStyleProfile> {
    const supabase = await createClient();

    const defaultProfile = {
      student_id: studentId,
      visual_score: 33.33,
      text_score: 33.33,
      auditory_score: 33.33,
      images_viewed: 0,
      voice_replays: 0,
      text_read_time_seconds: 0,
    };

    const { error: insertError } = await supabase.from("learning_style_profile").insert(defaultProfile);
    if (insertError) {
      authLogger.warn("[AdaptiveService] Failed to insert default profile:", { error: insertError.message, studentId });
    }

    return {
      ...defaultProfile,
      preferred_style: "text",
    } as LearningStyleProfile;
  }

  /**
   * Get personalized content adaptation settings
   */
  async getAdaptedContent(
    studentId: string,
    topicId: string,
  ): Promise<ContentAdaptation> {
    const profile = await this.getLearningStyleProfile(studentId);
    const knowledgeState = await this.getKnowledgeState(studentId, topicId);

    // Default adaptation
    const adaptation: ContentAdaptation = {
      showImages: true,
      enableVoice: true,
      textComplexity: "simple",
      preferredStyle: "text",
      suggestedPace: "normal",
    };

    if (profile) {
      // Adapt based on learning style
      adaptation.showImages = profile.visual_score >= 35;
      adaptation.enableVoice = profile.auditory_score >= 35;
      adaptation.preferredStyle = profile.preferred_style;

      // Determine text complexity based on combined factors
      if (profile.text_score >= 50) {
        adaptation.textComplexity = "detailed";
      }
    }

    if (knowledgeState) {
      // Adjust pace based on mastery and attempts
      if (knowledgeState.mastery_score >= 80) {
        adaptation.suggestedPace = "fast";
      } else if (
        knowledgeState.attempts > 3 &&
        knowledgeState.mastery_score < 50
      ) {
        adaptation.suggestedPace = "slow";
      }
    }

    return adaptation;
  }

  /**
   * Get knowledge state for a specific topic
   */
  async getKnowledgeState(
    studentId: string,
    topicId: string,
  ): Promise<KnowledgeState | null> {
    try {
      const supabase = await createClient();

      // OPTIMIZATION: Select only needed columns instead of *
      const { data, error } = await supabase
        .from("student_knowledge_state")
        .select(
          "id, student_id, topic_id, module_id, mastery_score, confidence_level, attempts, time_spent_seconds, last_attempt_at, status, created_at, updated_at",
        )
        .eq("student_id", studentId)
        .eq("topic_id", topicId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as KnowledgeState | null;
    } catch (error) {
      authLogger.error("[Adaptive] Error getting knowledge state:", error);
      return null;
    }
  }

  /**
   * Update knowledge state after assessment or practice
   * ATOMIC: Uses RPC for concurrent-safe updates (MEDIUM #1 fix)
   */
  async updateKnowledgeState(
    studentId: string,
    moduleId: string,
    topicId: string,
    performance: TopicPerformance,
  ): Promise<void> {
    try {
      const supabase = await createClient();

      // ATOMIC: Use RPC function for race-condition-free update
      // This performs calculation and update in single transaction with locking
      const { data: rpcResultRaw, error } = await supabase.rpc(
        "update_knowledge_state",
        {
          p_student_id: studentId,
          p_module_id: moduleId,
          p_topic_id: topicId,
          p_is_correct: performance.isCorrect,
          p_response_time_ms: performance.responseTimeMs,
          p_ai_hint_requested: performance.aiHintRequested,
        },
      );

      if (error) {
        authLogger.error(
          "[Adaptive] RPC failed to update knowledge state:",
          error,
        );
        return;
      }

      // SECURITY FIX: Runtime validation of RPC response structure
      // Ensures response matches expected schema before accessing properties
      const validationResult =
        validateUpdateKnowledgeStateResponse(rpcResultRaw);
      if (!validationResult.success) {
        authLogger.error(
          "[Adaptive] RPC response validation failed:",
          validationResult.error,
        );
        return;
      }

      const rpcResult = validationResult.data;
      if (!rpcResult.success) {
        authLogger.error(
          "[Adaptive] Knowledge state update failed:",
          rpcResult.error,
        );
      }
    } catch (error) {
      authLogger.error("[Adaptive] Error updating knowledge state:", error);
    }
  }

  /**
   * NOTE: Mastery calculation, confidence level, and topic status determination
   * have been moved to the PostgreSQL RPC function update_knowledge_state() for
   * atomic concurrent-safe updates. See migration 053.
   */

  /**
   * Get next recommended topic based on knowledge gaps
   */
  async getNextTopic(
    studentId: string,
    moduleId: string,
  ): Promise<string | null> {
    try {
      const supabase = await createClient();

      // Find topics with lowest mastery (knowledge gaps)
      const { data: weakTopics, error } = await supabase
        .from("student_knowledge_state")
        .select("topic_id, mastery_score")
        .eq("student_id", studentId)
        .eq("module_id", moduleId)
        .lt("mastery_score", 70)
        .order("mastery_score", { ascending: true })
        .limit(1);

      if (error) throw error;

      // Return weakest topic if found
      if (weakTopics?.length > 0) {
        return weakTopics[0].topic_id;
      }

      // Otherwise, find next unstarted topic
      return await this.getNextUnstartedTopic(studentId, moduleId);
    } catch (error) {
      authLogger.error("[Adaptive] Error getting next topic:", error);
      return null;
    }
  }

  /**
   * Get next unstarted topic in sequence
   */
  private async getNextUnstartedTopic(
    studentId: string,
    moduleId: string,
  ): Promise<string | null> {
    try {
      const supabase = await createClient();

      // Get all topics for module from curriculum_content
      const { data: allTopics, error: topicsError } = await supabase
        .from("curriculum_content")
        .select("topic_id")
        .eq("module_id", moduleId)
        .order("topic_id");

      if (topicsError) {
        authLogger.error("[Adaptive] Error fetching topics:", { error: topicsError.message });
      }

      if (!allTopics) return null;

      // Get student's started topics
      const { data: startedTopics, error: startedError } = await supabase
        .from("student_knowledge_state")
        .select("topic_id")
        .eq("student_id", studentId)
        .eq("module_id", moduleId);

      if (startedError) {
        authLogger.error("[Adaptive] Error fetching started topics:", { error: startedError.message });
      }

      const startedSet = new Set(startedTopics?.map((t) => t.topic_id) || []);

      // Find first unstarted topic
      for (const topic of allTopics) {
        if (!startedSet.has(topic.topic_id)) {
          return topic.topic_id;
        }
      }

      return null;
    } catch (error) {
      authLogger.error("[Adaptive] Error getting unstarted topic:", error);
      return null;
    }
  }

  /**
   * Get module progress for a student
   */
  async getModuleProgress(
    studentId: string,
    moduleId: string,
  ): Promise<{
    totalTopics: number;
    masteredTopics: number;
    averageMastery: number;
    progressPercent: number;
  }> {
    try {
      const supabase = await createClient();

      const { data: states, error: statesError } = await supabase
        .from("student_knowledge_state")
        .select("mastery_score, status")
        .eq("student_id", studentId)
        .eq("module_id", moduleId);

      if (statesError) {
        authLogger.error("[Adaptive] Error fetching module progress:", { error: statesError.message });
      }

      if (!states || states.length === 0) {
        return {
          totalTopics: 10, // Default per module
          masteredTopics: 0,
          averageMastery: 0,
          progressPercent: 0,
        };
      }

      const masteredTopics = states.filter(
        (s) => s.status === "mastered",
      ).length;
      const totalMastery = states.reduce(
        (sum, s) => sum + (s.mastery_score || 0),
        0,
      );
      const averageMastery = totalMastery / states.length;

      return {
        totalTopics: 10, // Per curriculum spec
        masteredTopics,
        averageMastery: Math.round(averageMastery * 100) / 100,
        progressPercent: Math.round((masteredTopics / 10) * 100),
      };
    } catch (error) {
      authLogger.error("[Adaptive] Error getting module progress:", error);
      return {
        totalTopics: 10,
        masteredTopics: 0,
        averageMastery: 0,
        progressPercent: 0,
      };
    }
  }

  /**
   * Check if student is at-risk (struggling) in a module
   */
  async isAtRisk(studentId: string, moduleId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data: states, error: riskError } = await supabase
        .from("student_knowledge_state")
        .select("mastery_score, attempts")
        .eq("student_id", studentId)
        .eq("module_id", moduleId)
        .gt("attempts", 3);

      if (riskError) {
        authLogger.error("[Adaptive] Error checking at-risk:", { error: riskError.message });
      }

      if (!states || states.length === 0) return false;

      // At-risk if multiple topics with low mastery despite many attempts
      const strugglingTopics = states.filter(
        (s) => s.mastery_score < 40 && s.attempts > 3,
      );

      return strugglingTopics.length >= 2;
    } catch (error) {
      authLogger.error("[Adaptive] Error checking at-risk status:", error);
      return false;
    }
  }
}

// Export singleton instance
export const adaptiveService = new AdaptiveLearningService();
