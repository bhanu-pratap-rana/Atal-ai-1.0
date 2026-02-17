/**
 * RAG Content Retrieval Service
 *
 * Retrieves curriculum content using vector similarity search
 * and prepares it for AI-powered lesson generation.
 *
 * Topic metadata is fetched from the database with in-memory caching.
 */

import { createClient } from "@/lib/supabase-browser";
import { clientLogger } from "@/lib/client-logger";
import type { SupportedLanguage } from "@/types/common";

// ============================================================================
// TOPIC METADATA CACHE
// ============================================================================

interface TopicMetadata {
  title: Record<SupportedLanguage, string>;
  description: string;
}

/**
 * In-memory cache for topic metadata.
 * Bounded by active topics count (~50 entries). Loaded once, never grows beyond data size.
 */
const topicMetadataCache: Map<string, TopicMetadata> = new Map();
let metadataCacheInitialized = false;

/**
 * Fetch all topic metadata from database and populate cache
 */
async function initializeMetadataCache(): Promise<void> {
  if (metadataCacheInitialized) return;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("topics")
      .select("id, name_en, name_hi, name_as, description_en")
      .eq("is_active", true);

    if (error || !data) {
      clientLogger.warn("[content-retrieval] Failed to fetch topic metadata:", {
        error: error?.message,
      });
      return;
    }

    for (const topic of data) {
      topicMetadataCache.set(topic.id, {
        title: {
          en: topic.name_en,
          hi: topic.name_hi || topic.name_en,
          as: topic.name_as || topic.name_en,
        },
        description: topic.description_en || "",
      });
    }

    metadataCacheInitialized = true;
  } catch (error) {
    clientLogger.warn("[content-retrieval] Error initializing metadata cache:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get topic metadata from cache, fetching if needed
 */
async function getTopicMetadata(topicId: string): Promise<TopicMetadata | null> {
  // Initialize cache if not done
  if (!metadataCacheInitialized) {
    await initializeMetadataCache();
  }

  // Return from cache
  const cached = topicMetadataCache.get(topicId);
  if (cached) return cached;

  // Fetch single topic if not in cache
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("topics")
      .select("id, name_en, name_hi, name_as, description_en")
      .eq("id", topicId)
      .maybeSingle();

    if (error || !data) return null;

    const metadata: TopicMetadata = {
      title: {
        en: data.name_en,
        hi: data.name_hi || data.name_en,
        as: data.name_as || data.name_en,
      },
      description: data.description_en || "",
    };

    topicMetadataCache.set(topicId, metadata);
    return metadata;
  } catch {
    return null;
  }
}

export interface RAGContent {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  title: string;
  rawContent: string[];
  culturalContext: string[];
  examples: string[];
  exercises: string[];
  definitions: string[];
}

export interface RetrievalOptions {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  includeRelated?: boolean;
}

/**
 * Get topic title in specified language (async, fetches from DB)
 */
export async function getTopicTitle(topicId: string, language: SupportedLanguage): Promise<string> {
  const meta = await getTopicMetadata(topicId);
  if (meta) {
    return meta.title[language] || meta.title.en;
  }
  return `Topic ${topicId}`;
}

/**
 * Get topic title synchronously from cache (use after cache is initialized)
 */
export function getTopicTitleSync(topicId: string, language: SupportedLanguage): string {
  const meta = topicMetadataCache.get(topicId);
  if (meta) {
    return meta.title[language] || meta.title.en;
  }
  return `Topic ${topicId}`;
}

/**
 * Get topic description (async, fetches from DB)
 */
export async function getTopicDescription(topicId: string): Promise<string> {
  const meta = await getTopicMetadata(topicId);
  return meta?.description || "";
}

/**
 * Get topic description synchronously from cache
 */
export function getTopicDescriptionSync(topicId: string): string {
  const meta = topicMetadataCache.get(topicId);
  return meta?.description || "";
}

/**
 * Retrieve curriculum content for a topic using direct query
 * Falls back to English if no content in requested language
 */
export async function retrieveTopicContent(options: RetrievalOptions): Promise<RAGContent> {
  const supabase = createClient();
  const { moduleId, topicId, language } = options;

  // Try requested language first
  const { data: langData, error: langError } = await supabase
    .from("curriculum_content")
    .select("content_type, content, title")
    .eq("module_id", moduleId)
    .eq("topic_id", topicId)
    .eq("language", language);

  if (langError) {
    clientLogger.warn("[retrieveTopicContent] Error fetching content:", { error: langError.message });
  }

  let contentData = langData;

  // Fallback to English if no content
  if (!contentData || contentData.length === 0) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("curriculum_content")
      .select("content_type, content, title")
      .eq("module_id", moduleId)
      .eq("topic_id", topicId)
      .eq("language", "en");

    if (fallbackError) {
      clientLogger.warn("[retrieveTopicContent] Error fetching fallback content:", { error: fallbackError.message });
    }

    contentData = fallbackData;
  }

  // Group by content type
  const rawContent: string[] = [];
  const culturalContext: string[] = [];
  const examples: string[] = [];
  const exercises: string[] = [];
  const definitions: string[] = [];

  for (const item of contentData || []) {
    const content = item.content;
    switch (item.content_type) {
      case "curriculum":
        rawContent.push(content);
        break;
      case "cultural_context":
        culturalContext.push(content);
        break;
      case "example":
        examples.push(content);
        break;
      case "exercise":
        exercises.push(content);
        break;
      case "definition":
        definitions.push(content);
        break;
      default:
        rawContent.push(content);
    }
  }

  // Get topic title from database
  const title = await getTopicTitle(topicId, language);

  return {
    moduleId,
    topicId,
    language,
    title,
    rawContent,
    culturalContext,
    examples,
    exercises,
    definitions,
  };
}

/**
 * Retrieve content using vector similarity search (for AI enhancement)
 */
export async function retrieveRelatedContent(
  query: string,
  language: SupportedLanguage,
  limit: number = 5,
): Promise<string[]> {
  const supabase = createClient();

  // Prefer RPC when available (migration 152). Fallback to keyword search if RPC errors.
  try {
    const { data, error } = await supabase.rpc("match_curriculum_content_simple", {
      query_text: query,
      match_count: limit,
      filter_language: language,
    });

    if (error) {
      clientLogger.warn("[retrieveRelatedContent] RPC error:", { error: error.message });
    }

    if (data && data.length > 0) {
      return data.map((item: { content: string }) => item.content);
    }
  } catch {
    // RPC not in DB, fall back to keyword search
  }

  // Fallback: simple text search
  const { data, error } = await supabase
    .from("curriculum_content")
    .select("content")
    .eq("language", language)
    .textSearch("content", query.split(" ").slice(0, 3).join(" & "))
    .limit(limit);

  if (error) {
    clientLogger.warn("[retrieveRelatedContent] Text search error:", { error: error.message });
  }

  return (data || []).map((item) => item.content);
}
