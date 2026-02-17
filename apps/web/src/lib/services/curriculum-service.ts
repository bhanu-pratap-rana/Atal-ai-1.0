/**
 * Curriculum Service
 *
 * Fetches module and topic metadata from database instead of hardcoded constants.
 * Provides caching and fallback handling for offline scenarios.
 */

import { createClient as createBrowserClient } from "@/lib/supabase-browser";
import { clientLogger } from "@/lib/client-logger";


// ============================================================================
// TYPES
// ============================================================================

export interface Module {
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
  topic_count?: number;
}

export interface Topic {
  id: string;
  module_id?: string;
  name_en: string;
  name_hi: string;
  name_as: string;
  description_en: string | null;
  description_hi: string | null;
  description_as: string | null;
  duration_minutes: number;
  display_order: number;
}

export interface ModuleWithTopics extends Module {
  topics: Topic[];
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch all modules with topic counts
 */
export async function getModules(): Promise<Module[]> {
  const supabase = createBrowserClient();

  // Try RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_modules_with_counts");

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData as Module[];
  }

  // Fallback to direct query if RPC not available
  const { data, error } = await supabase
    .from("modules")
    .select(`
      *,
      topics:topics(count)
    `)
    .eq("is_active", true)
    .order("display_order");

  if (error || !data) {
    clientLogger.error("[getModules] Error fetching modules:", error);
    return [];
  }

  // Transform to add topic_count
  return data.map((m) => ({
    ...m,
    topic_count: Array.isArray(m.topics) ? m.topics.length : 0,
  }));
}

/**
 * Fetch a single module by ID
 * PERF-009 FIX: Select only needed columns instead of SELECT *
 */
export async function getModule(moduleId: string): Promise<Module | null> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("modules")
    .select("id, name_en, name_hi, name_as, description_en, description_hi, description_as, icon, color_gradient, cultural_note_en, cultural_note_hi, cultural_note_as, display_order")
    .eq("id", moduleId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    clientLogger.error("[getModule] Error fetching module:", { error: error?.message });
    return null;
  }

  return data as Module;
}

/**
 * Fetch topics for a module
 */
export async function getModuleTopics(moduleId: string): Promise<Topic[]> {
  const supabase = createBrowserClient();

  // Try RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_module_topics", {
    p_module_id: moduleId,
  });

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData as Topic[];
  }

  // Fallback to direct query
  // PERF-009 FIX: Select only needed columns instead of SELECT *
  const { data, error } = await supabase
    .from("topics")
    .select("id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, duration_minutes, display_order")
    .eq("module_id", moduleId)
    .eq("is_active", true)
    .order("display_order");

  if (error || !data) {
    clientLogger.error("[getModuleTopics] Error fetching topics:", error);
    return [];
  }

  return data as Topic[];
}

/**
 * Fetch a single topic by ID
 */
export async function getTopic(topicId: string): Promise<Topic | null> {
  const supabase = createBrowserClient();

  // Try RPC function first
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_topic", {
    p_topic_id: topicId,
  });

  if (!rpcError && rpcData && rpcData.length > 0) {
    return rpcData[0] as Topic;
  }

  // Fallback to direct query
  // PERF-009 FIX: Select only needed columns instead of SELECT *
  const { data, error } = await supabase
    .from("topics")
    .select("id, module_id, name_en, name_hi, name_as, description_en, description_hi, description_as, duration_minutes, display_order")
    .eq("id", topicId)
    .maybeSingle();

  if (error || !data) {
    clientLogger.error("[getTopic] Error fetching topic:", { error: error?.message });
    return null;
  }

  return data as Topic;
}

