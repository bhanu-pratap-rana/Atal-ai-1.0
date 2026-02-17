/**
 * Module Units API
 *
 * Returns all units and topics for a given module, with progress data.
 *
 * GET /api/modules/[moduleId]/units
 * Query: { language: 'en' | 'hi' | 'as' }
 * Returns: ModuleWithUnitsResponse
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { authLogger } from "@/lib/auth-logger";
import { checkRateLimit } from "@/lib/rate-limiter-distributed";
import { RATE_LIMITS } from "@/lib/constants/rate-limits";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";
import { getLocalizedField } from "@/lib/i18n";


// Types
interface TopicProgress {
  status: "not_started" | "in_progress" | "mastered";
  masteryScore: number;
}

interface TopicWithProgress {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  displayOrder: number;
  progress: TopicProgress;
  isDownloaded: boolean;
}

interface UnitWithTopics {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  topics: TopicWithProgress[];
}

interface ModuleData {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorGradient: string;
  culturalNote: string | null;
}

interface ModuleWithUnitsResponse {
  module: ModuleData;
  units: UnitWithTopics[];
  totalTopics: number;
  completedTopics: number;
  averageMastery: number;
}

// Validation schemas
const QuerySchema = z.object({
  language: z.enum(["en", "hi", "as"]).default("en"),
});

// Module IDs are TEXT (e.g., "M1", "M2"), not UUIDs
// Validate: alphanumeric, 1-10 chars to prevent injection
const ModuleIdSchema = z.string().regex(/^[A-Z][A-Za-z0-9]{0,9}$/, "Invalid module ID format");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  try {
    // Authentication check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SEC-014 FIX: Rate limit to prevent abuse
    const isAllowed = await checkRateLimit(`units:${user.id}`, RATE_LIMITS.moduleUnits);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before making another request." },
        { status: 429 }
      );
    }

    const { moduleId } = await params;

    // Validate moduleId format (e.g., "M1", "M2" - alphanumeric TEXT, not UUID)
    const moduleIdValidation = ModuleIdSchema.safeParse(moduleId);
    if (!moduleIdValidation.success) {
      return NextResponse.json(
        { error: "Invalid module ID format" },
        { status: 400 },
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const validation = QuerySchema.safeParse({
      language: searchParams.get("language") || "en",
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Invalid query" },
        { status: 400 },
      );
    }

    const { language } = validation.data;

    // SEC-5 FIX: Use validated moduleId copy (not raw param) for all queries
    const validModuleId = moduleIdValidation.data;

    const supabase = await createClient();

    // PERFORMANCE: Execute all queries in parallel using Promise.allSettled
    // ERR-005 FIX: Use allSettled to prevent one failure from crashing entire request
    const results = await Promise.allSettled([
      // Fetch module data (select only needed columns)
      // Use .maybeSingle() instead of .single() to return null gracefully if module not found
      supabase
        .from("modules")
        .select("id, name_en, name_hi, name_as, description_en, description_hi, description_as, icon, color_gradient, cultural_note_en, cultural_note_hi, cultural_note_as")
        .eq("id", validModuleId)
        .eq("is_active", true)
        .maybeSingle(),

      // Fetch units with topics using the helper function
      supabase.rpc("get_module_units_with_topics", { p_module_id: validModuleId }),

      // Fetch user's progress for all topics in this module
      supabase
        .from("student_knowledge_state")
        .select("topic_id, mastery_score, status")
        .eq("student_id", user.id)
        .eq("module_id", validModuleId),

      // Check downloaded lessons (from generated_lessons cache)
      supabase
        .from("generated_lessons")
        .select("topic_id")
        .eq("module_id", validModuleId)
        .eq("language", language)
        .gt("expires_at", new Date().toISOString()),
    ]);

    // Extract results with proper error handling
    const moduleResult = results[0].status === "fulfilled" ? results[0].value : { data: null, error: { message: "Module query failed" } };
    const unitsResult = results[1].status === "fulfilled" ? results[1].value : { data: null, error: { message: "Units query failed" } };
    const progressResult = results[2].status === "fulfilled" ? results[2].value : { data: null, error: null };
    const downloadedResult = results[3].status === "fulfilled" ? results[3].value : { data: null, error: null };

    const { data: moduleData, error: moduleError } = moduleResult;
    const { data: unitsWithTopics, error: unitsError } = unitsResult;
    const { data: progressData } = progressResult;
    const { data: downloadedLessons } = downloadedResult;

    if (moduleError || !moduleData) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    if (unitsError) {
      authLogger.error("[/api/modules/units] Error fetching units", unitsError);
      return NextResponse.json(
        { error: "Failed to fetch units" },
        { status: 500 },
      );
    }

    // Create progress lookup map
    const progressMap = new Map<string, TopicProgress>();
    if (progressData) {
      for (const p of progressData) {
        progressMap.set(p.topic_id, {
          status: p.status as TopicProgress["status"],
          masteryScore: p.mastery_score || 0,
        });
      }
    }

    const downloadedSet = new Set(
      downloadedLessons?.map((l) => l.topic_id) || [],
    );

    // Group topics by unit
    const unitsMap = new Map<string, UnitWithTopics>();

    for (const row of unitsWithTopics || []) {
      const unitId = row.unit_id as string;

      if (!unitsMap.has(unitId)) {
        unitsMap.set(unitId, {
          id: unitId,
          name: getLocalizedField(row, "unit_name", language),
          description: getLocalizedField(row, "unit_description", language),
          displayOrder: row.unit_display_order as number,
          topics: [],
        });
      }

      const unit = unitsMap.get(unitId)!;

      if (row.topic_id) {
        const topicId = row.topic_id as string;
        const progress = progressMap.get(topicId) || {
          status: "not_started" as const,
          masteryScore: 0,
        };

        unit.topics.push({
          id: topicId,
          name: getLocalizedField(row, "topic_name", language),
          description: getLocalizedField(row, "topic_description", language),
          durationMinutes: row.topic_duration_minutes as number,
          displayOrder: row.topic_display_order as number,
          progress,
          isDownloaded: downloadedSet.has(topicId),
        });
      }
    }

    // Sort topics within each unit
    const units = Array.from(unitsMap.values())
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((unit) => ({
        ...unit,
        topics: unit.topics.sort((a, b) => a.displayOrder - b.displayOrder),
      }));

    // Calculate overall progress
    let totalTopics = 0;
    let completedTopics = 0;
    let totalMastery = 0;

    for (const unit of units) {
      for (const topic of unit.topics) {
        totalTopics++;
        totalMastery += topic.progress.masteryScore;
        // Topic is complete if status is "mastered" OR mastery score >= PASSING threshold
        // Note: Migration 151 converted all "completed" records to "mastered"
        if (topic.progress.status === "mastered" || topic.progress.masteryScore >= MASTERY_THRESHOLDS.PASSING) {
          completedTopics++;
        }
      }
    }

    const averageMastery = totalTopics > 0 ? totalMastery / totalTopics : 0;

    const response: ModuleWithUnitsResponse = {
      module: {
        id: moduleData.id,
        name: getLocalizedField(moduleData, "name", language),
        description: getLocalizedField(moduleData, "description", language),
        icon: moduleData.icon,
        colorGradient: moduleData.color_gradient,
        culturalNote: getLocalizedField(moduleData, "cultural_note", language) || null,
      },
      units,
      totalTopics,
      completedTopics,
      averageMastery: Math.round(averageMastery),
    };

    // Add cache headers for better performance (5 min cache, user-specific)
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    authLogger.error("[/api/modules/units] Error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
