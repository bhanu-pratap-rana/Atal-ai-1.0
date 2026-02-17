"use server";

import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";

/**
 * Assessment status for pre/post assessment prompts on dashboard
 */
export interface AssessmentStatus {
  hasPreAssessment: boolean;
  hasPostAssessment: boolean;
  curriculumCompleted: boolean;
  masteredCategories: number;
  totalCategories: number;
}

/**
 * Check the student's pre/post assessment and curriculum status
 * Used by the dashboard to decide which prompt to show
 */
export async function getAssessmentStatus(): Promise<{
  success: boolean;
  data?: AssessmentStatus;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = await createClient();

    // Parallel: check pre-assessment, post-assessment, and curriculum completion
    const [preResult, postResult, completionResult] = await Promise.all([
      supabase.rpc("has_assessment_type", { p_user_id: user.id, p_type: "pre" }),
      supabase.rpc("has_assessment_type", { p_user_id: user.id, p_type: "post" }),
      supabase.rpc("check_curriculum_completion", { p_student_id: user.id }),
    ]);

    const hasPreAssessment = preResult.data === true;
    const hasPostAssessment = postResult.data === true;

    const completion = completionResult.data as {
      completed: boolean;
      mastered_categories: number;
      total_categories: number;
    } | null;

    return {
      success: true,
      data: {
        hasPreAssessment,
        hasPostAssessment,
        curriculumCompleted: completion?.completed ?? false,
        masteredCategories: completion?.mastered_categories ?? 0,
        totalCategories: completion?.total_categories ?? 5,
      },
    };
  } catch (error) {
    authLogger.error(
      "[getAssessmentStatus] Error",
      error instanceof Error ? error : undefined,
    );
    return { success: false, error: "Failed to check assessment status" };
  }
}
