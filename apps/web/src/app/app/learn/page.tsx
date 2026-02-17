/**
 * Learning Path Page
 *
 * Shows all modules with progress tracking and unlock logic.
 * Students must complete modules in order (prerequisites).
 *
 * Module and topic data is fetched from the database (modules/topics tables)
 * to enable dynamic curriculum updates without code changes.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getCurrentUser, createClient, createAdminClient } from "@/lib/supabase-server";
import { AdaptiveRecommendations } from "@/components/learn/AdaptiveRecommendations";
import { ModuleCard, type ModuleProgress } from "@/components/learn/ModuleCard";
import { LearnHeader } from "@/components/learn/LearnHeader";
import { LearnProgressStats } from "@/components/learn/LearnProgressStats";
import { AiTutorCTA } from "@/components/learn/AiTutorCTA";
import { EmptyModulesMessage } from "@/components/learn/EmptyModulesMessage";
import { authLogger } from "@/lib/auth-logger";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";

// Module type from database
interface ModuleData {
  id: string;
  name_en: string;
  name_hi: string;
  name_as: string;
  description_en: string | null;
  description_hi: string | null;
  description_as: string | null;
  icon: string;
  color_gradient: string;
  cultural_note_en: string | null;
  cultural_note_hi: string | null;
  cultural_note_as: string | null;
  display_order: number;
  topic_count: number;
}

// Transform database module to component format
function transformModule(m: ModuleData) {
  return {
    id: m.id,
    name_en: m.name_en,
    name_hi: m.name_hi,
    name_as: m.name_as,
    description: m.description_en || "",
    icon: m.icon,
    topics: Number(m.topic_count) || 10,
    color: m.color_gradient,
    culturalNote: m.cultural_note_en || undefined,
  };
}

/**
 * Fetch modules from database (internal implementation)
 * Uses admin client because this is wrapped in unstable_cache which cannot use cookies().
 * Modules are public curriculum data - same for all users, no RLS needed.
 */
async function fetchModulesFromDB(): Promise<ModuleData[]> {
  const supabase = await createAdminClient();

  // Try RPC function first (includes topic counts)
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_modules_with_counts");

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData as ModuleData[];
  }

  // Fallback to direct query
  const { data, error } = await supabase
    .from("modules")
    .select("id, name_en, name_hi, name_as, description_en, description_hi, description_as, icon, color_gradient, cultural_note_en, cultural_note_hi, cultural_note_as, display_order")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    authLogger.error("[getModulesFromDB] Error:", error);
    return [];
  }

  // PERF-006 FIX: Get topic counts with batch query instead of N+1 queries
  // Previously: N queries (1 per module) even with Promise.all
  // Now: Single query to get all topics, then count in memory
  const moduleIds = (data || []).map((m) => m.id);

  const { data: topicsData } = await supabase
    .from("topics")
    .select("module_id")
    .in("module_id", moduleIds)
    .eq("is_active", true);

  // Build topic count map from single query result
  const topicCountMap = new Map<string, number>();
  for (const topic of topicsData || []) {
    topicCountMap.set(
      topic.module_id,
      (topicCountMap.get(topic.module_id) || 0) + 1
    );
  }

  // Add counts to modules
  const modulesWithCounts = (data || []).map((m) => ({
    ...m,
    topic_count: topicCountMap.get(m.id) || 0,
  }));

  return modulesWithCounts as ModuleData[];
}

/**
 * DB-002 FIX: Cached version of module fetch with ISR-style revalidation
 * - Caches module data for 1 hour (curriculum doesn't change often)
 * - Reduces database load on every page view
 * - Modules are the same for all users (static curriculum data)
 */
const getModulesFromDB = unstable_cache(
  fetchModulesFromDB,
  ["modules-list"],
  {
    revalidate: 3600, // 1 hour cache
    tags: ["modules"],
  }
);

async function getModuleProgress(
  userId: string,
  modules: ModuleData[],
): Promise<Map<string, ModuleProgress>> {
  const supabase = await createClient();

  // Get all module IDs from database
  const moduleIds = modules.map((m) => m.id);

  // Only fetch CURRICULUM module records (not assessment records)
  const { data, error } = await supabase
    .from("student_knowledge_state")
    .select("module_id, topic_id, mastery_score, status")
    .eq("student_id", userId)
    .in("module_id", moduleIds);

  if (error) {
    authLogger.error("[getModuleProgress] Error fetching knowledge state:", { error: error.message });
  }

  const progressMap = new Map<string, ModuleProgress>();

  // Initialize all modules with their actual topic counts
  for (const moduleItem of modules) {
    progressMap.set(moduleItem.id, {
      module_id: moduleItem.id,
      topics_completed: 0,
      average_mastery: 0,
      is_complete: false,
    });
  }

  if (!data) return progressMap;

  // PERFORMANCE FIX: Build lookup map for O(1) module lookups instead of O(n) find() in loop
  // Previously: O(n*m) where n=knowledge states, m=modules
  // Now: O(n+m) - build map once, then O(1) lookups
  const moduleTopicCountMap = new Map(
    modules.map((m) => [m.id, m.topic_count || 10]),
  );

  // PERF-013 FIX: Single-pass aggregation with sum/count instead of array
  // Previously: Built array of mastery scores, then reduced to calculate average
  // Now: Track running sum and count, avoiding array allocation and extra iteration
  const moduleData = new Map<
    string,
    { masterySum: number; masteryCount: number; completed: number }
  >();

  for (const state of data) {
    if (!moduleData.has(state.module_id)) {
      moduleData.set(state.module_id, { masterySum: 0, masteryCount: 0, completed: 0 });
    }
    const mod = moduleData.get(state.module_id);
    if (mod) {
      // Single-pass: accumulate sum and count instead of building array
      mod.masterySum += state.mastery_score || 0;
      mod.masteryCount++;
      if (state.status === "mastered" || (state.mastery_score || 0) >= MASTERY_THRESHOLDS.PASSING) {
        mod.completed++;
      }
    }
  }

  // Calculate progress using actual topic counts from database
  for (const [moduleId, stats] of moduleData) {
    const topicCount = moduleTopicCountMap.get(moduleId) || 10;
    // Calculate average directly from sum/count (no array reduce needed)
    const avgMastery = stats.masteryCount > 0
      ? stats.masterySum / stats.masteryCount
      : 0;

    progressMap.set(moduleId, {
      module_id: moduleId,
      topics_completed: stats.completed,
      average_mastery: Math.round(avgMastery),
      is_complete: stats.completed >= topicCount,
    });
  }

  return progressMap;
}

async function getTotalPoints(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_student_total_points", {
    p_student_id: userId,
  });

  if (error) {
    authLogger.error("[getTotalPoints] RPC error:", { error: error.message });
    return 0;
  }

  return typeof data === "number" ? data : 0;
}

async function getCurrentStreak(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get last 30 days of activity from MULTIPLE sources
  // FIXED: Now includes AI tutor interactions and assessments, not just lessons
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch from all activity sources in parallel
  const [knowledgeResult, interactionsResult, sessionsResult] = await Promise.all([
    // Lesson progress
    supabase
      .from("student_knowledge_state")
      .select("last_attempt_at")
      .eq("student_id", userId)
      .gte("last_attempt_at", thirtyDaysAgo.toISOString()),
    // AI Tutor interactions
    supabase
      .from("ai_tutor_interactions")
      .select("created_at")
      .eq("student_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    // Assessment sessions
    supabase
      .from("assessment_sessions")
      .select("started_at")
      .eq("user_id", userId)
      .gte("started_at", thirtyDaysAgo.toISOString()),
  ]);

  // Combine all activity dates
  const activityDays = new Set<number>();

  // Helper: Add date to set (normalized to local midnight)
  const addActivityDate = (dateString: string | null) => {
    if (!dateString) return;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    activityDays.add(date.getTime());
  };

  // Add lesson dates
  knowledgeResult.data?.forEach((d) => addActivityDate(d.last_attempt_at));

  // Add AI tutor dates
  interactionsResult.data?.forEach((d) => addActivityDate(d.created_at));

  // Add assessment dates
  sessionsResult.data?.forEach((d) => addActivityDate(d.started_at));

  if (activityDays.size === 0) return 0;

  // Calculate streak from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const checkDate = new Date(today);

  // Check consecutive days starting from today
  while (activityDays.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // If no activity today, check if yesterday had activity (allow grace period)
  if (streak === 0) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (activityDays.has(yesterday.getTime())) {
      // Start counting from yesterday
      checkDate.setTime(yesterday.getTime());
      while (activityDays.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }
  }

  return streak;
}

export default async function LearnPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/student/start");
  }

  // Fetch modules from database
  const modulesFromDB = await getModulesFromDB();
  const MODULES = modulesFromDB.map(transformModule);

  const [progressMap, totalPoints, currentStreak] = await Promise.all([
    getModuleProgress(user.id, modulesFromDB),
    getTotalPoints(user.id),
    getCurrentStreak(user.id),
  ]);

  // Calculate overall stats using actual topic counts
  const totalTopics = modulesFromDB.reduce((sum, m) => sum + (Number(m.topic_count) || 10), 0);
  const completedTopics = Array.from(progressMap.values()).reduce(
    (sum, p) => sum + p.topics_completed,
    0,
  );
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-surface/30 p-4 md:p-6">
      <div className="container-responsive max-w-4xl space-y-6">
        {/* Header with Language Selector and Back to Dashboard */}
        <LearnHeader
          title="learn.yourPath"
          description="learn.masterDigitalLiteracy"
          useTranslationKeys={true}
        />

        {/* Progress Overview */}
        <LearnProgressStats
          overallProgress={overallProgress}
          totalPoints={totalPoints}
          currentStreak={currentStreak}
          completedTopics={completedTopics}
          totalTopics={totalTopics}
        />

        {/* Adaptive Recommendations */}
        <Suspense fallback={null}>
          <AdaptiveRecommendations userId={user.id} limit={3} />
        </Suspense>

        {/* Module Cards */}
        <div className="space-y-4">
          {MODULES.length === 0 ? (
            <EmptyModulesMessage />
          ) : (
            MODULES.map((module, index) => {
              const progress = progressMap.get(module.id);
              if (!progress) return null;
              const previousModule =
                index > 0 ? progressMap.get(MODULES[index - 1].id) : null;
              const isUnlocked =
                index === 0 || (previousModule?.is_complete ?? false);
              const progressPercent = module.topics > 0
                ? Math.round((progress.topics_completed / module.topics) * 100)
                : 0;

              return (
                <ModuleCard
                  key={module.id}
                  module={module}
                  progress={progress}
                  progressPercent={progressPercent}
                  isUnlocked={isUnlocked}
                  index={index}
                />
              );
            })
          )}
        </div>

        {/* AI Tutor CTA */}
        <AiTutorCTA />
      </div>
    </div>
  );
}

