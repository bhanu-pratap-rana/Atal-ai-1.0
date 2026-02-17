"use client";

/**
 * Hook for managing offline lesson downloads and sync
 *
 * Provides functionality for:
 * - Downloading lessons for offline use
 * - Checking download status
 * - Loading offline lessons
 * - Syncing progress when back online
 *
 * Part of Learn Page Redesign - Phase 3
 */

import { useState, useCallback, useEffect } from "react";
import { clientLogger } from "@/lib/client-logger";
import type { SupportedLanguage } from "@/types/common";
import {
  offlineDB,
  isOfflineStorageAvailable,
  getDownloadedLessonKey,
  getDownloadedLesson,
  saveDownloadedLesson,
  deleteDownloadedLesson,
  getOfflineStats,
  type DownloadedLesson,
  type GeneratedLessonData,
  type PracticeQuestionData,
} from "@/lib/offline/database";

// ============================================================================
// TYPES
// ============================================================================

interface DownloadOptions {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  includeTTS: boolean;
}

interface DownloadResult {
  success: boolean;
  error?: string;
}

interface UseOfflineLessonReturn {
  // Download functions
  downloadLesson: (options: DownloadOptions) => Promise<DownloadResult>;
  downloadProgress: number;
  isDownloading: boolean;

  // Check availability
  isAvailableOffline: (moduleId: string, topicId: string, language: SupportedLanguage) => Promise<boolean>;
  getDownloadedLanguages: (moduleId: string, topicId: string) => Promise<SupportedLanguage[]>;

  // Load offline content
  loadOfflineLesson: (
    moduleId: string,
    topicId: string,
    language: SupportedLanguage,
  ) => Promise<{
    lesson: GeneratedLessonData;
    practiceQuestions: PracticeQuestionData[];
  } | null>;

  // Sync
  pendingSyncCount: number;
  syncProgress: () => Promise<{ synced: number; failed: number }>;
  isSyncing: boolean;

  // Delete
  deleteOfflineLesson: (moduleId: string, topicId: string, language: SupportedLanguage) => Promise<void>;
  clearAllOffline: () => Promise<void>;

  // Stats
  getStorageUsed: () => Promise<number>;
  offlineStats: {
    downloadedLessonsCount: number;
    pendingSyncCount: number;
    storageUsed: number;
  } | null;

  // Status
  isOfflineStorageSupported: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

// BUG-004 FIX: Track in-progress downloads to prevent concurrent downloads of same lesson
// Using module-level Set so it persists across re-renders and is shared across hook instances
const inProgressDownloads = new Set<string>();

// PERF-017 FIX: Track if sync is in progress to prevent concurrent sync operations
let syncInProgress = false;

export function useOfflineLesson(): UseOfflineLessonReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [offlineStats, setOfflineStats] = useState<UseOfflineLessonReturn["offlineStats"]>(null);

  // Check if offline storage is supported
  const isOfflineStorageSupported = isOfflineStorageAvailable();

  // Load initial stats
  useEffect(() => {
    if (!isOfflineStorageSupported) return;

    const loadStats = async () => {
      try {
        const stats = await getOfflineStats();
        setOfflineStats({
          downloadedLessonsCount: stats.downloadedLessonsCount,
          pendingSyncCount: stats.pendingSyncCount,
          storageUsed: stats.storageUsed,
        });
        setPendingSyncCount(stats.pendingSyncCount);
      } catch (error) {
        clientLogger.error("Failed to load offline stats", { error });
      }
    };

    loadStats();
  }, [isOfflineStorageSupported]);

  /**
   * Download a lesson for offline use
   * BUG-004 FIX: Added download lock to prevent concurrent downloads of the same lesson
   */
  const downloadLesson = useCallback(
    async (options: DownloadOptions): Promise<DownloadResult> => {
      if (!isOfflineStorageSupported) {
        return { success: false, error: "Offline storage not supported" };
      }

      // BUG-004 FIX: Create unique key for this download and check if already in progress
      const downloadKey = `${options.moduleId}:${options.topicId}:${options.language}`;
      if (inProgressDownloads.has(downloadKey)) {
        clientLogger.debug("[useOfflineLesson] Download already in progress, skipping", { downloadKey });
        return { success: false, error: "Download already in progress for this lesson" };
      }

      // Mark download as in progress
      inProgressDownloads.add(downloadKey);

      setIsDownloading(true);
      setDownloadProgress(0);

      try {
        // Step 1: Fetch lesson from API (30%)
        setDownloadProgress(10);

        const response = await fetch("/api/lesson/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
        });

        setDownloadProgress(30);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to download lesson");
        }

        const data = await response.json();
        setDownloadProgress(60);

        // Step 2: Save to IndexedDB (90%)
        // Log the lesson data being saved for debugging
        clientLogger.debug("[useOfflineLesson] Saving downloaded lesson", {
          moduleId: options.moduleId,
          topicId: options.topicId,
          language: options.language,
          chunksCount: data.lesson?.chunks?.length || 0,
          practiceQuestionsCount: data.practiceQuestions?.length || 0,
        });

        const downloadedLesson: DownloadedLesson = {
          id: getDownloadedLessonKey(options.moduleId, options.topicId, options.language),
          moduleId: options.moduleId,
          topicId: options.topicId,
          language: options.language,
          lesson: data.lesson,
          practiceQuestions: data.practiceQuestions,
          images: data.images,
          ttsAudio: data.ttsAudio,
          downloadedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          version: "1.0",
          estimatedSize: data.estimatedSize || 0,
        };

        await saveDownloadedLesson(downloadedLesson);

        // Verify the save was successful
        clientLogger.debug("[useOfflineLesson] Lesson saved successfully", {
          lessonId: downloadedLesson.id,
          chunksStored: downloadedLesson.lesson?.chunks?.length || 0,
        });
        setDownloadProgress(100);

        // Refresh stats
        const stats = await getOfflineStats();
        setOfflineStats({
          downloadedLessonsCount: stats.downloadedLessonsCount,
          pendingSyncCount: stats.pendingSyncCount,
          storageUsed: stats.storageUsed,
        });

        return { success: true };
      } catch (error) {
        // Detect specific error types for better user feedback
        let errorMessage = "Download failed";

        if (error instanceof Error) {
          // Check for storage quota exceeded
          if (error.name === "QuotaExceededError" ||
              error.message.includes("quota") ||
              error.message.includes("storage")) {
            errorMessage = "Storage full. Delete old lessons to make space.";
          } else if (error.name === "NotFoundError") {
            errorMessage = "Lesson not found. Please try again later.";
          } else {
            errorMessage = error.message;
          }
        }

        clientLogger.error("Download failed", {
          error,
          errorType: error instanceof Error ? error.name : "unknown"
        });

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        // BUG-004 FIX: Always remove from in-progress set when done (success or failure)
        inProgressDownloads.delete(downloadKey);
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    },
    [isOfflineStorageSupported],
  );

  /**
   * Check if a lesson is available offline
   */
  const isAvailableOffline = useCallback(
    async (
      moduleId: string,
      topicId: string,
      language: SupportedLanguage,
    ): Promise<boolean> => {
      if (!isOfflineStorageSupported) return false;

      const lesson = await getDownloadedLesson(moduleId, topicId, language);
      return !!lesson;
    },
    [isOfflineStorageSupported],
  );

  /**
   * Get all downloaded languages for a topic
   * PERF-014 FIX: Use Promise.all for parallel language checks
   */
  const getDownloadedLanguages = useCallback(
    async (moduleId: string, topicId: string): Promise<SupportedLanguage[]> => {
      if (!isOfflineStorageSupported) return [];

      const allLanguages: SupportedLanguage[] = ["en", "hi", "as"];

      // PERF-014 FIX: Check all languages in parallel instead of sequentially
      const results = await Promise.all(
        allLanguages.map(async (lang) => {
          const lesson = await getDownloadedLesson(moduleId, topicId, lang);
          return lesson ? lang : null;
        }),
      );

      // Filter out nulls and return found languages
      return results.filter((lang): lang is SupportedLanguage => lang !== null);
    },
    [isOfflineStorageSupported],
  );

  /**
   * Load an offline lesson
   */
  const loadOfflineLesson = useCallback(
    async (
      moduleId: string,
      topicId: string,
      language: SupportedLanguage,
    ): Promise<{
      lesson: GeneratedLessonData;
      practiceQuestions: PracticeQuestionData[];
    } | null> => {
      if (!isOfflineStorageSupported) return null;

      const downloaded = await getDownloadedLesson(moduleId, topicId, language);
      if (!downloaded) {
        clientLogger.debug("[useOfflineLesson] No offline lesson found", {
          moduleId,
          topicId,
          language,
        });
        return null;
      }

      // Log what we're loading for debugging
      clientLogger.debug("[useOfflineLesson] Loading offline lesson", {
        moduleId,
        topicId,
        language,
        chunksCount: downloaded.lesson?.chunks?.length || 0,
        practiceQuestionsCount: downloaded.practiceQuestions?.length || 0,
        downloadedAt: new Date(downloaded.downloadedAt).toISOString(),
      });

      return {
        lesson: downloaded.lesson,
        practiceQuestions: downloaded.practiceQuestions,
      };
    },
    [isOfflineStorageSupported],
  );

  /**
   * Sync offline progress to server
   * PERF-017 FIX: Added module-level lock to prevent concurrent sync operations
   */
  const syncProgress = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!isOfflineStorageSupported) {
      return { synced: 0, failed: 0 };
    }

    // PERF-017 FIX: Check if sync is already in progress
    if (syncInProgress) {
      clientLogger.debug("[useOfflineLesson] Sync already in progress, skipping");
      return { synced: 0, failed: 0 };
    }

    // Mark sync as in progress
    syncInProgress = true;
    setIsSyncing(true);

    try {
      // Get all pending items from sync queue
      const pendingItems = await offlineDB.syncQueue.toArray();

      if (pendingItems.length === 0) {
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      // Process each item
      for (const item of pendingItems) {
        try {
          const response = await fetch("/api/progress/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: [
                {
                  type: item.type,
                  data: item.payload,
                  timestamp: new Date(item.timestamp).toISOString(),
                  idempotencyKey: item.idempotencyKey,
                },
              ],
            }),
          });

          if (response.ok) {
            // Remove from queue
            if (item.id) {
              await offlineDB.syncQueue.delete(item.id);
            }
            synced++;
          } else {
            // Update retry count
            if (item.id) {
              await offlineDB.syncQueue.update(item.id, {
                retries: item.retries + 1,
                lastError: `HTTP ${response.status}`,
              });
            }
            failed++;
          }
        } catch (error) {
          // Update retry count
          if (item.id) {
            await offlineDB.syncQueue.update(item.id, {
              retries: item.retries + 1,
              lastError: error instanceof Error ? error.message : "Unknown error",
            });
          }
          failed++;
        }
      }

      // Update sync count
      const newCount = await offlineDB.syncQueue.count();
      setPendingSyncCount(newCount);

      return { synced, failed };
    } finally {
      // PERF-017 FIX: Always release the lock
      syncInProgress = false;
      setIsSyncing(false);
    }
  }, [isOfflineStorageSupported]);

  /**
   * Delete a downloaded lesson
   */
  const deleteOfflineLessonFn = useCallback(
    async (
      moduleId: string,
      topicId: string,
      language: SupportedLanguage,
    ): Promise<void> => {
      if (!isOfflineStorageSupported) return;

      await deleteDownloadedLesson(moduleId, topicId, language);

      // Refresh stats
      const stats = await getOfflineStats();
      setOfflineStats({
        downloadedLessonsCount: stats.downloadedLessonsCount,
        pendingSyncCount: stats.pendingSyncCount,
        storageUsed: stats.storageUsed,
      });
    },
    [isOfflineStorageSupported],
  );

  /**
   * Clear all offline data
   */
  const clearAllOffline = useCallback(async (): Promise<void> => {
    if (!isOfflineStorageSupported) return;

    await offlineDB.downloadedLessons.clear();
    await offlineDB.offlineProgress.clear();
    // BUG-017 FIX: Also clear sync queue to prevent orphaned sync entries
    await offlineDB.syncQueue.clear();

    // Refresh stats
    const stats = await getOfflineStats();
    setOfflineStats({
      downloadedLessonsCount: stats.downloadedLessonsCount,
      pendingSyncCount: stats.pendingSyncCount,
      storageUsed: stats.storageUsed,
    });
  }, [isOfflineStorageSupported]);

  /**
   * Get storage used
   */
  const getStorageUsed = useCallback(async (): Promise<number> => {
    if (!isOfflineStorageSupported) return 0;

    const stats = await getOfflineStats();
    return stats.storageUsed;
  }, [isOfflineStorageSupported]);

  return {
    // Download
    downloadLesson,
    downloadProgress,
    isDownloading,

    // Check availability
    isAvailableOffline,
    getDownloadedLanguages,

    // Load
    loadOfflineLesson,

    // Sync
    pendingSyncCount,
    syncProgress,
    isSyncing,

    // Delete
    deleteOfflineLesson: deleteOfflineLessonFn,
    clearAllOffline,

    // Stats
    getStorageUsed,
    offlineStats,

    // Status
    isOfflineStorageSupported,
  };
}

// NOTE: useNetworkStatus is now provided by @/hooks/useNetworkStatus
// which includes connection quality detection and debounced reconnection.
