"use client";

/**
 * Adaptive Recommendations Component
 *
 * Provides personalized next-step recommendations based on:
 * - Student knowledge state (mastery scores)
 * - Learning style preferences
 * - Recent activity patterns
 * - Knowledge gaps
 *
 * Module and topic data is fetched from the database (not hardcoded).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientLogger } from "@/lib/client-logger";
import {
  getModules,
  getModuleTopics,
  type Module,
  type Topic,
} from "@/lib/services/curriculum-service";
import { useLanguage, getModuleName, getTopicName } from "@/lib/i18n";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";

interface Recommendation {
  readonly moduleId: string;
  readonly moduleName: string;
  readonly topicId: string;
  readonly topicName: string;
  readonly reasonKey: string;
  readonly priority: "high" | "medium" | "low";
  readonly icon: string;
  readonly color: string;
}

interface AdaptiveRecommendationsProps {
  readonly userId: string;
  readonly currentModuleId?: string;
  readonly limit?: number;
}

export function AdaptiveRecommendations({
  userId,
  currentModuleId,
  limit = 3,
}: AdaptiveRecommendationsProps) {
  const { language, t } = useLanguage();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [_modules, setModules] = useState<Module[]>([]);
  const [_topicsByModule, setTopicsByModule] = useState<Map<string, Topic[]>>(new Map());

  // Fetch modules and topics from database
  const fetchCurriculumData = useCallback(async () => {
    try {
      // Fetch all modules from database
      const modulesData = await getModules();
      setModules(modulesData);

      // PERFORMANCE: Fetch topics for all modules in parallel instead of sequential
      // This reduces latency from O(n * requestTime) to O(requestTime)
      const topicsResults = await Promise.all(
        modulesData.map((mod) => getModuleTopics(mod.id))
      );

      // Build map from parallel results
      const topicsMap = new Map<string, Topic[]>();
      modulesData.forEach((mod, index) => {
        topicsMap.set(mod.id, topicsResults[index]);
      });
      setTopicsByModule(topicsMap);

      return { modulesData, topicsMap };
    } catch (error) {
      clientLogger.error(
        "[AdaptiveRecommendations] Error fetching curriculum:",
        error instanceof Error ? error : undefined,
      );
      return { modulesData: [], topicsMap: new Map() };
    }
  }, []);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        // First, fetch curriculum data from database
        const { modulesData, topicsMap } = await fetchCurriculumData();

        if (modulesData.length === 0) {
          setLoading(false);
          return;
        }

        const supabase = createClient();

        // Get module IDs from database (not hardcoded)
        const moduleIds = modulesData.map((m) => m.id);

        // Get student knowledge state for CURRICULUM modules only
        // CRITICAL: Filter out assessment records (module_id = "adaptive_assessment")
        const { data: knowledgeState } = await supabase
          .from("student_knowledge_state")
          .select(
            "module_id, topic_id, mastery_score, status, attempts, last_attempt_at",
          )
          .eq("student_id", userId)
          .in("module_id", moduleIds)
          .order("last_attempt_at", { ascending: false });

        if (!knowledgeState) {
          setLoading(false);
          return;
        }

        // Helper to get module name from fetched data
        const getModuleNameLocal = (moduleId: string): string => {
          const mod = modulesData.find((m) => m.id === moduleId);
          return mod ? getModuleName(mod, language) : moduleId;
        };

        // LOOP-1 FIX: Build flat Map for O(1) topic lookup (was O(n×m) nested loop)
        const topicIdMap = new Map<string, Topic>();
        for (const [, topics] of topicsMap) {
          for (const topic of topics) {
            topicIdMap.set(topic.id, topic);
          }
        }

        const getTopicNameLocal = (topicId: string): string => {
          const topic = topicIdMap.get(topicId);
          return topic ? getTopicName(topic, language) : `Topic ${topicId}`;
        };

        // Helper to get all topics for a module from fetched data
        const getAllTopicsForModuleLocal = (moduleId: string): string[] => {
          const topics = topicsMap.get(moduleId);
          return topics ? topics.map((t: Topic) => t.id) : [];
        };

        // Generate recommendations based on knowledge state
        const recs: Recommendation[] = [];

        // 1. HIGH PRIORITY: Topics with low mastery but multiple attempts (struggling)
        const strugglingTopics = knowledgeState.filter(
          (k) => k.mastery_score < 50 && k.attempts >= 2,
        );

        for (const topic of strugglingTopics.slice(0, 2)) {
          recs.push({
            moduleId: topic.module_id,
            moduleName: getModuleNameLocal(topic.module_id),
            topicId: topic.topic_id,
            topicName: getTopicNameLocal(topic.topic_id),
            reasonKey: "learn.youveBeenWorking",
            priority: "high",
            icon: "🎯",
            color: "from-error to-error-dark",
          });
        }

        // 2. MEDIUM PRIORITY: Topics with medium mastery (almost there!)
        const almostMasteredTopics = knowledgeState.filter(
          (k) => k.mastery_score >= MASTERY_THRESHOLDS.STRUGGLING && k.mastery_score < MASTERY_THRESHOLDS.PASSING,
        );

        for (const topic of almostMasteredTopics.slice(0, 2)) {
          recs.push({
            moduleId: topic.module_id,
            moduleName: getModuleNameLocal(topic.module_id),
            topicId: topic.topic_id,
            topicName: getTopicNameLocal(topic.topic_id),
            reasonKey: "learn.almostMastery",
            priority: "medium",
            icon: "⭐",
            color: "from-warning to-warning-dark",
          });
        }

        // 3. LOW PRIORITY: Next sequential topic (if current module provided)
        if (currentModuleId) {
          const currentModuleTopics = knowledgeState.filter(
            (k) => k.module_id === currentModuleId,
          );

          const completedTopicIds = new Set(
            currentModuleTopics
              .filter((k) => k.mastery_score >= MASTERY_THRESHOLDS.PASSING)
              .map((k) => k.topic_id),
          );

          // Find next topic in sequence from database
          const allTopicsInModule = getAllTopicsForModuleLocal(currentModuleId);
          const nextTopic = allTopicsInModule.find(
            (topicId) => !completedTopicIds.has(topicId),
          );

          if (nextTopic) {
            recs.push({
              moduleId: currentModuleId,
              moduleName: getModuleNameLocal(currentModuleId),
              topicId: nextTopic,
              topicName: getTopicNameLocal(nextTopic),
              reasonKey: "learn.continueJourney",
              priority: "low",
              icon: "➡️",
              color: "from-primary to-primary-dark",
            });
          }
        }

        // 4. If no recommendations yet, suggest starting a new module
        if (recs.length === 0) {
          const modulesWithProgress = new Set(
            knowledgeState.map((k) => k.module_id),
          );
          const nextModule = modulesData.find(
            (m) => !modulesWithProgress.has(m.id),
          );

          if (nextModule) {
            const firstTopic = getAllTopicsForModuleLocal(nextModule.id)[0];
            if (firstTopic) {
              recs.push({
                moduleId: nextModule.id,
                moduleName: getModuleNameLocal(nextModule.id),
                topicId: firstTopic,
                topicName: getTopicNameLocal(firstTopic),
                reasonKey: "learn.startNewModule",
                priority: "low",
                icon: "🆕",
                color: "from-success to-success-dark",
              });
            }
          }
        }

        // Sort by priority and limit
        const sortedRecs = recs
          .toSorted((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          })
          .slice(0, limit);

        setRecommendations(sortedRecs);
        setLoading(false);
      } catch (error) {
        clientLogger.error(
          "[AdaptiveRecommendations] Error:",
          error instanceof Error ? error : undefined,
        );
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [userId, currentModuleId, limit, fetchCurriculumData, language]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-surface rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-surface rounded w-full" />
            <div className="h-4 bg-surface rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-cyan/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🤖</span>
          <span>{t("learn.aiRecommendations")}</span>
        </CardTitle>
        <p className="text-sm text-text-secondary">
          {t("learn.basedOnProgress")}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => (
          <Link
            key={`${rec.moduleId}-${rec.topicId}-${index}`}
            href={`/app/learn/${rec.moduleId}/${rec.topicId}`}
          >
            <Card
              className={`transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer bg-gradient-to-r ${rec.color} text-white`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{rec.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{rec.topicName}</div>
                    <div className="text-xs opacity-80">{rec.moduleName}</div>
                    <div className="text-sm mt-1 opacity-90">{t(rec.reasonKey)}</div>
                  </div>
                  <div className="text-white/70">→</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
