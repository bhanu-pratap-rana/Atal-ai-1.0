/**
 * Lesson Cache - Pre-caching service for offline lesson access
 *
 * Provides utilities for:
 * - Pre-caching lesson content when viewing a module
 * - Checking if lessons are cached
 * - Retrieving cached lessons
 * - Managing cache storage
 *
 * Data is fetched from the database when online, with fallback for offline.
 *
 * Best practices from:
 * - https://developer.mozilla.org/en-US/docs/Web/API/Cache
 * - https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/
 */

import { offlineDB, type CachedLesson } from "./database";
import { clientLogger } from "@/lib/client-logger";
import { createClient as createBrowserClient } from "@/lib/supabase-browser";

/**
 * Cache name for lessons (versioned for updates)
 */
const LESSON_CACHE = "atal-lessons-v1";

/**
 * Cache expiry time (7 days in milliseconds)
 */
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

/**
 * Supported languages
 */
export type Language = "en" | "hi" | "as";

/**
 * Topic info for pre-caching
 */
interface TopicInfo {
  id: string;
  title: string;
}

/**
 * In-memory cache for topics to avoid repeated DB calls
 */
const topicsCache: Map<string, { topics: TopicInfo[]; fetchedAt: number }> = new Map();
const TOPICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_TOPICS_CACHE_SIZE = 50; // Prevent unbounded growth

/**
 * PERF-003 FIX: In-flight request deduplication
 * Prevents multiple identical requests when called concurrently
 */
const inFlightTopicRequests: Map<string, Promise<TopicInfo[]>> = new Map();

/**
 * Fetch topics from database for a module
 */
async function fetchTopicsFromDB(moduleId: string): Promise<TopicInfo[]> {
  try {
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("topics")
      .select("id, name_en")
      .eq("module_id", moduleId)
      .eq("is_active", true)
      .order("display_order");

    if (error || !data) {
      clientLogger.warn("[LessonCache] Failed to fetch topics from DB", { error, moduleId });
      return [];
    }

    return data.map((t) => ({ id: t.id, title: t.name_en }));
  } catch (error) {
    clientLogger.warn("[LessonCache] Error fetching topics from DB", {
      error: error instanceof Error ? error.message : String(error),
      moduleId,
    });
    return [];
  }
}

/**
 * Get topics for a module (fetches from DB with in-memory caching)
 * PERF-003 FIX: Includes request deduplication to prevent duplicate DB calls
 */
export async function getTopicsForModule(moduleId: string): Promise<TopicInfo[]> {
  // Check in-memory cache first
  const cached = topicsCache.get(moduleId);
  if (cached && Date.now() - cached.fetchedAt < TOPICS_CACHE_TTL) {
    return cached.topics;
  }

  // PERF-003 FIX: Check if there's already an in-flight request for this module
  const inFlight = inFlightTopicRequests.get(moduleId);
  if (inFlight) {
    return inFlight;
  }

  // Create new request promise and track it
  const requestPromise = (async () => {
    try {
      const topics = await fetchTopicsFromDB(moduleId);

      if (topics.length > 0) {
        // Cache the result
        // Evict oldest entry if at capacity to prevent unbounded memory growth
        if (topicsCache.size >= MAX_TOPICS_CACHE_SIZE) {
          const oldestKey = topicsCache.keys().next().value;
          if (oldestKey) topicsCache.delete(oldestKey);
        }
        topicsCache.set(moduleId, { topics, fetchedAt: Date.now() });
        return topics;
      }

      // Return empty array if no topics found (database might not be seeded yet)
      clientLogger.warn("[LessonCache] No topics found for module", { moduleId });
      return [];
    } finally {
      // Always clean up the in-flight tracker
      inFlightTopicRequests.delete(moduleId);
    }
  })();

  // Track the in-flight request
  inFlightTopicRequests.set(moduleId, requestPromise);

  return requestPromise;
}

/**
 * Sync version for immediate use (uses cached data if available)
 * Falls back to empty array if no cache exists
 */
export function getTopicsForModuleSync(moduleId: string): TopicInfo[] {
  const cached = topicsCache.get(moduleId);
  return cached?.topics || [];
}

/**
 * Check if Cache API is available
 */
export function isCacheApiAvailable(): boolean {
  return typeof globalThis !== "undefined" && "caches" in globalThis;
}

/**
 * Pre-cache all lessons for a module
 *
 * @example
 * ```tsx
 * // Pre-cache when user opens a module
 * useEffect(() => {
 *   preCacheLessons('M1', 'en');
 * }, [moduleId]);
 * ```
 */
export async function preCacheLessons(
  moduleId: string,
  language: Language,
): Promise<{ cached: number; failed: number }> {
  // Fetch topics from database
  const topics = await getTopicsForModule(moduleId);

  if (topics.length === 0) {
    clientLogger.warn("[LessonCache] No topics to cache for module", { moduleId });
    return { cached: 0, failed: 0 };
  }

  let cached = 0;
  let failed = 0;
  // BUG-008 FIX: Track which topics failed for debugging/retry
  const failedTopics: string[] = [];

  // PERF-014 FIX: Cache all topics in parallel (independent operations)
  const results = await Promise.allSettled(
    topics.map((topic) => preCacheLesson(moduleId, topic.id, language)),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value) {
      cached++;
    } else {
      failed++;
      failedTopics.push(topics[i].id);
      if (result.status === "rejected") {
        // BUG-008 FIX: Handle exceptions in individual topic caching
        clientLogger.warn("[LessonCache] Exception caching topic", {
          topicId: topics[i].id,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
  }

  clientLogger.debug("[LessonCache] Pre-cached lessons", {
    cached,
    failed,
    total: topics.length,
    moduleId,
    failedTopics: failedTopics.length > 0 ? failedTopics : undefined,
  });
  return { cached, failed };
}

/**
 * Pre-cache a single lesson
 */
export async function preCacheLesson(
  moduleId: string,
  topicId: string,
  language: Language,
): Promise<boolean> {
  if (!isCacheApiAvailable()) {
    // Fall back to IndexedDB
    return preCacheLessonToIndexedDB(moduleId, topicId, language);
  }

  try {
    const cache = await caches.open(LESSON_CACHE);
    const url = `/api/lessons/${moduleId}/${topicId}?lang=${language}`;

    // Check if already cached
    const existing = await cache.match(url);
    if (existing) {
      return true;
    }

    // Fetch and cache with expiry metadata
    const response = await fetch(url);
    if (response.ok) {
      // Add x-cached-at header for expiry checking on reads
      const headers = new Headers(response.headers);
      headers.set("x-cached-at", String(Date.now()));
      const cachedResponse = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      await cache.put(url, cachedResponse);
      return true;
    }

    return false;
  } catch (error) {
    clientLogger.warn("[LessonCache] Failed to cache lesson", {
      topicId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Fallback: Pre-cache lesson to IndexedDB
 */
async function preCacheLessonToIndexedDB(
  moduleId: string,
  topicId: string,
  language: Language,
): Promise<boolean> {
  try {
    // Check if already cached
    const existing = await offlineDB.lessons.get(topicId);
    if (existing && existing.expires_at > Date.now()) {
      return true;
    }

    // Fetch lesson content
    const response = await fetch(
      `/api/lessons/${moduleId}/${topicId}?lang=${language}`,
    );
    if (!response.ok) return false;

    const content = await response.json();

    // Store in IndexedDB
    const cachedLesson: CachedLesson = {
      topic_id: topicId,
      module_id: moduleId,
      language,
      content,
      cached_at: Date.now(),
      expires_at: Date.now() + CACHE_EXPIRY,
    };

    await offlineDB.lessons.put(cachedLesson);
    return true;
  } catch (error) {
    clientLogger.warn("[LessonCache] IndexedDB cache failed", {
      topicId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Check if a lesson is cached
 */
export async function isLessonCached(
  moduleId: string,
  topicId: string,
  language?: Language,
): Promise<boolean> {
  // Check Cache API first
  if (isCacheApiAvailable()) {
    const cache = await caches.open(LESSON_CACHE);
    const languages = language ? [language] : ["en", "hi", "as"];

    for (const lang of languages) {
      const url = `/api/lessons/${moduleId}/${topicId}?lang=${lang}`;
      const response = await cache.match(url);
      if (response) return true;
    }
  }

  // Check IndexedDB
  const cached = await offlineDB.lessons.get(topicId);
  if (cached && cached.expires_at > Date.now()) {
    return true;
  }

  return false;
}

/**
 * Get cached lesson content
 */
export async function getCachedLesson(
  moduleId: string,
  topicId: string,
  language: Language,
): Promise<CachedLesson["content"] | null> {
  // Try Cache API first
  if (isCacheApiAvailable()) {
    try {
      const cache = await caches.open(LESSON_CACHE);
      const url = `/api/lessons/${moduleId}/${topicId}?lang=${language}`;
      const response = await cache.match(url);

      if (response) {
        // Check expiry via custom header (set when caching)
        const cachedAt = response.headers.get("x-cached-at");
        const CACHE_API_TTL = 24 * 60 * 60 * 1000; // 24 hours
        if (cachedAt && Date.now() - parseInt(cachedAt, 10) > CACHE_API_TTL) {
          // Expired - remove stale entry
          await cache.delete(url);
          return null;
        }
        return response.json();
      }
    } catch (error) {
      clientLogger.warn("[LessonCache] Cache API read failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Try IndexedDB
  try {
    const cached = await offlineDB.lessons.get(topicId);
    if (
      cached &&
      cached.expires_at > Date.now() &&
      cached.language === language
    ) {
      return cached.content;
    }
  } catch (error) {
    clientLogger.warn("[LessonCache] IndexedDB read failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return null;
}

/**
 * Get all cached lessons for a module
 */
export async function getCachedLessonsForModule(
  moduleId: string,
): Promise<CachedLesson[]> {
  try {
    const lessons = await offlineDB.lessons
      .where("module_id")
      .equals(moduleId)
      .filter((lesson) => lesson.expires_at > Date.now())
      .toArray();

    return lessons;
  } catch (error) {
    clientLogger.warn("[LessonCache] Failed to get cached lessons", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  cachedCount: number;
  totalSize: number;
  byModule: Record<string, number>;
}> {
  const lessons = await offlineDB.lessons.toArray();
  const validLessons = lessons.filter((l) => l.expires_at > Date.now());

  const byModule: Record<string, number> = {};
  for (const lesson of validLessons) {
    byModule[lesson.module_id] = (byModule[lesson.module_id] || 0) + 1;
  }

  // Estimate size (rough calculation)
  const totalSize = validLessons.reduce((acc, lesson) => {
    return acc + JSON.stringify(lesson.content).length;
  }, 0);

  return {
    cachedCount: validLessons.length,
    totalSize,
    byModule,
  };
}

/**
 * Clear lesson cache for a specific module
 */
export async function clearModuleCache(moduleId: string): Promise<number> {
  // Clear from Cache API
  if (isCacheApiAvailable()) {
    try {
      const cache = await caches.open(LESSON_CACHE);
      const requests = await cache.keys();

      // PERF-014 FIX: Delete cache entries in parallel (independent operations)
      await Promise.all(
        requests
          .filter((request) => request.url.includes(`/api/lessons/${moduleId}/`))
          .map((request) => cache.delete(request)),
      );
    } catch (error) {
      clientLogger.warn("[LessonCache] Cache API clear failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Clear from IndexedDB
  return offlineDB.lessons.where("module_id").equals(moduleId).delete();
}

/**
 * Clear all lesson cache
 */
export async function clearAllLessonCache(): Promise<void> {
  // Clear Cache API
  if (isCacheApiAvailable()) {
    await caches.delete(LESSON_CACHE);
  }

  // Clear IndexedDB
  await offlineDB.lessons.clear();

  clientLogger.debug("[LessonCache] All caches cleared");
}

/**
 * Clear expired lessons
 */
export async function clearExpiredLessons(): Promise<number> {
  const now = Date.now();
  return offlineDB.lessons.where("expires_at").below(now).delete();
}
