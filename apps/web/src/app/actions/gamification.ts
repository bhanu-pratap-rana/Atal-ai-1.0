"use server";

/**
 * Gamification Server Actions
 *
 * Server-side actions for awarding points and checking badges.
 * These wrap the GamificationService for use from client components.
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase-server";
import { gamificationService } from "@/lib/services/gamification-service";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";

/**
 * Award points for completing a lesson
 * Called from client components after lesson completion
 */
export async function awardLessonCompletionPoints(
  moduleId: string,
  topicId: string,
  score: number,
): Promise<{
  success: boolean;
  pointsAwarded?: number;
  newBadges?: Array<{ id: string; name_en: string }>;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const isAllowed = await checkRateLimit(`gamification:${user.id}`, RATE_LIMITS.gamification);
    if (!isAllowed) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    authLogger.debug("[awardLessonCompletionPoints] Awarding points", {
      userId: user.id,
      moduleId,
      topicId,
      score,
    });

    // Use triggerActivityCheck which awards points and checks badges
    const newBadges = await gamificationService.triggerActivityCheck(
      user.id,
      "lesson",
    );

    // Bonus points for high scores
    let bonusPoints = 0;
    if (score >= 90) {
      bonusPoints = 5;
      await gamificationService.awardPoints(
        user.id,
        bonusPoints,
        "high_score_bonus",
        `Scored ${score}% on ${topicId}`,
      );
    }

    authLogger.success("[awardLessonCompletionPoints] Points awarded", {
      userId: user.id,
      basePoints: 10,
      bonusPoints,
      newBadgesCount: newBadges.length,
    });

    // Revalidate dashboard to show updated points
    revalidatePath("/app/dashboard");

    return {
      success: true,
      pointsAwarded: 10 + bonusPoints,
      newBadges: newBadges.map((b) => ({ id: b.id, name_en: b.name_en })),
    };
  } catch (error) {
    authLogger.error(
      "[awardLessonCompletionPoints] Error",
      error instanceof Error ? error : { error: String(error) },
    );
    return {
      success: false,
      error: "Failed to award points",
    };
  }
}

/**
 * Award points for asking a question to AI Tutor
 */
export async function awardQuestionPoints(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const isAllowed = await checkRateLimit(`gamification:${user.id}`, RATE_LIMITS.gamification);
    if (!isAllowed) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    await gamificationService.triggerActivityCheck(user.id, "question");

    return { success: true };
  } catch (error) {
    authLogger.error(
      "[awardQuestionPoints] Error",
      error instanceof Error ? error : { error: String(error) },
    );
    return { success: false, error: "Failed to award points" };
  }
}

/**
 * Award points for voice interaction
 */
export async function awardVoiceInteractionPoints(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const isAllowed = await checkRateLimit(`gamification:${user.id}`, RATE_LIMITS.gamification);
    if (!isAllowed) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    await gamificationService.triggerActivityCheck(user.id, "voice");

    return { success: true };
  } catch (error) {
    authLogger.error(
      "[awardVoiceInteractionPoints] Error",
      error instanceof Error ? error : { error: String(error) },
    );
    return { success: false, error: "Failed to award points" };
  }
}
