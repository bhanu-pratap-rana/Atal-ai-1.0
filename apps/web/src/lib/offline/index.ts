/**
 * Offline Module Index
 *
 * Exports all offline-first utilities for ATAL AI.
 */

// Database
export {
  offlineDB,
  isOfflineStorageAvailable,
  getStorageUsage,
  clearExpiredCache,
  clearAllOfflineData,
  type QueuedMutation,
  type CachedLesson,
  type CachedProgress,
  type CachedConversation,
} from "./database";

// Sync Queue
export {
  syncQueue,
  SyncQueue,
  type SyncStatus,
  type SyncResult,
} from "./sync-queue";

// Lesson Cache
export {
  preCacheLessons,
  preCacheLesson,
  isLessonCached,
  getCachedLesson,
  getCachedLessonsForModule,
  getCacheStats,
  clearModuleCache,
  clearAllLessonCache,
  clearExpiredLessons,
  getTopicsForModule,
  isCacheApiAvailable,
  type Language,
} from "./lesson-cache";

// Background Sync
export {
  SYNC_TAGS,
  PERIODIC_SYNC_TAGS,
  isBackgroundSyncSupported,
  isPeriodicSyncSupported,
  registerSync,
  registerPeriodicSync,
  unregisterPeriodicSync,
  getPeriodicSyncTags,
  sendMessageToSW,
  requestImmediateSync,
  getSyncStatus,
  initializeBackgroundSync,
  type SyncTag,
  type PeriodicSyncTag,
} from "./background-sync";

// Mutation Queue Helpers
export {
  enqueueAssessmentResponse,
  enqueueChatMessage,
  enqueuePointsAward,
  enqueueProgressUpdate,
  getMutationQueueStatus,
  triggerMutationSync,
  subscribeMutationQueue,
  type AssessmentResponsePayload,
  type ChatMessagePayload,
  type PointsAwardPayload,
  type ProgressUpdatePayload,
} from "./mutation-queue";
