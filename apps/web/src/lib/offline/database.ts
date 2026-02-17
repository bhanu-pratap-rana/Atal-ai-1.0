/**
 * Offline Database - IndexedDB with Dexie
 *
 * Provides offline storage for:
 * - Downloaded lesson content (AI-generated)
 * - Pending sync queue (progress, quiz submissions)
 * - Student progress cache
 * - Offline quiz progress
 *
 * Part of Learn Page Redesign - Phase 3
 */

import Dexie, { Table } from "dexie";
import type { SupportedLanguage } from "@/types/common";

// ============================================================================
// LESSON TYPES (matching GeneratedLesson from API)
// ============================================================================

export interface LessonChunk {
  type: "concept" | "example" | "practice" | "checkpoint";
  duration: string;
  heading: string;
  content: string;
  visualDescription?: string;
  checkpointQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface GeneratedLessonData {
  moduleId: string;
  topicId: string;
  language: SupportedLanguage;
  title: string;
  description: string;
  totalDuration: string;
  chunks: LessonChunk[];
  generatedAt: string;
}

export interface PracticeQuestionData {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ============================================================================
// OFFLINE DATA TYPES
// ============================================================================

/**
 * Queued mutation for offline sync
 */
export interface QueuedMutation {
  id?: number;
  type:
    | "assessment_submit"
    | "progress_update"
    | "chat_message"
    | "points_award"
    | "lesson_complete"
    | "quiz_submit";
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
  lastError?: string;
  idempotencyKey?: string; // For deduplication
}

/**
 * Downloaded lesson content (new format for AI-generated lessons)
 */
export interface DownloadedLesson {
  // Composite key
  id: string; // `${moduleId}:${topicId}:${language}`
  moduleId: string;
  topicId: string;
  unitId?: string;
  language: SupportedLanguage;

  // Lesson content
  lesson: GeneratedLessonData;
  practiceQuestions: PracticeQuestionData[];

  // Optional media
  images?: Array<{ description: string; base64: string }>;
  ttsAudio?: string; // base64 encoded

  // Metadata
  downloadedAt: number;
  expiresAt: number;
  version: string;
  estimatedSize: number; // bytes
}

/**
 * Cached lesson content (legacy format - kept for backwards compatibility)
 */
export interface CachedLesson {
  topic_id: string;
  module_id: string;
  language: SupportedLanguage;
  content: {
    title: string;
    description: string;
    sections: Array<{
      type: string;
      content: string;
    }>;
    questions?: Array<{
      id: string;
      question: string;
      options?: string[];
      correctAnswer?: string;
    }>;
  };
  cached_at: number;
  expires_at: number;
}

/**
 * Cached student progress
 */
export interface CachedProgress {
  topic_id: string;
  student_id: string;
  module_id: string;
  mastery_score: number;
  status: "not_started" | "in_progress" | "mastered";
  last_synced: number;
}

/**
 * Offline lesson progress (tracks progress made while offline)
 */
export interface OfflineLessonProgress {
  id: string; // `${topicId}:${studentId}`
  topicId: string;
  studentId: string;
  moduleId: string;

  // Lesson progress
  currentChunk: number;
  completedChunks: number[];
  startedAt: number;
  lastActivityAt: number;

  // Quiz progress
  quizAnswers: Record<string, number>; // questionId → selectedIndex
  quizScore?: number;
  quizCompletedAt?: number;

  // Sync status
  needsSync: boolean;
  lastSyncedAt?: number;
}

/**
 * Cached AI conversation
 */
export interface CachedConversation {
  session_id: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
  topic_id?: string;
  language: SupportedLanguage;
  last_updated: number;
}

// ============================================================================
// DATABASE CLASS
// ============================================================================

/**
 * ATAL Offline Database - Version 2
 */
class ATALOfflineDB extends Dexie {
  // Tables
  syncQueue!: Table<QueuedMutation, number>;
  lessons!: Table<CachedLesson, string>;
  downloadedLessons!: Table<DownloadedLesson, string>;
  progress!: Table<CachedProgress, string>;
  offlineProgress!: Table<OfflineLessonProgress, string>;
  conversations!: Table<CachedConversation, string>;

  constructor() {
    super("ATAL_Offline");

    // Version 1 - Original schema
    this.version(1).stores({
      syncQueue: "++id, timestamp, type, retries",
      lessons: "topic_id, module_id, language, cached_at, expires_at",
      progress: "[topic_id+student_id], module_id, last_synced",
      conversations: "session_id, topic_id, language, last_updated",
    });

    // Version 2 - Added downloadedLessons and offlineProgress tables
    this.version(2).stores({
      syncQueue: "++id, timestamp, type, retries, idempotencyKey",
      lessons: "topic_id, module_id, language, cached_at, expires_at",
      downloadedLessons: "id, moduleId, topicId, language, downloadedAt, expiresAt",
      progress: "[topic_id+student_id], module_id, last_synced",
      offlineProgress: "id, topicId, studentId, moduleId, needsSync, lastActivityAt",
      conversations: "session_id, topic_id, language, last_updated",
    });
  }
}

// Export singleton database instance
export const offlineDB = new ATALOfflineDB();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if offline storage is available
 */
export function isOfflineStorageAvailable(): boolean {
  try {
    return typeof globalThis !== "undefined" && "indexedDB" in globalThis;
  } catch {
    return false;
  }
}

/**
 * Get database storage usage
 */
export async function getStorageUsage(): Promise<{
  used: number;
  quota: number;
  percentUsed: number;
}> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return { used: 0, quota: 0, percentUsed: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (used / quota) * 100 : 0;

    return { used, quota, percentUsed };
  } catch {
    return { used: 0, quota: 0, percentUsed: 0 };
  }
}

/**
 * Check if there's sufficient storage space available
 * @param requiredMB - Minimum required space in megabytes (default: 5MB)
 * @returns true if sufficient space is available, false otherwise
 */
export async function hasStorageSpace(requiredMB: number = 5): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    // If we can't check, assume space is available
    return true;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const availableBytes = quota - usage;
    const requiredBytes = requiredMB * 1024 * 1024;

    return availableBytes >= requiredBytes;
  } catch {
    // If check fails, assume space is available
    return true;
  }
}

/**
 * Get estimated remaining storage space in MB
 * @returns Available space in megabytes
 */
export async function getAvailableStorageMB(): Promise<number> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return 0;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const availableBytes = quota - usage;

    return Math.floor(availableBytes / (1024 * 1024));
  } catch {
    return 0;
  }
}

/**
 * Generate composite key for downloaded lessons
 */
export function getDownloadedLessonKey(
  moduleId: string,
  topicId: string,
  language: SupportedLanguage,
): string {
  return `${moduleId}:${topicId}:${language}`;
}

/**
 * Generate composite key for offline progress
 */
export function getOfflineProgressKey(topicId: string, studentId: string): string {
  return `${topicId}:${studentId}`;
}

/**
 * Check if a lesson is downloaded for offline use
 */
export async function isLessonDownloaded(
  moduleId: string,
  topicId: string,
  language: SupportedLanguage,
): Promise<boolean> {
  const key = getDownloadedLessonKey(moduleId, topicId, language);
  const lesson = await offlineDB.downloadedLessons.get(key);
  return !!lesson && lesson.expiresAt > Date.now();
}

/**
 * Get downloaded lesson
 */
export async function getDownloadedLesson(
  moduleId: string,
  topicId: string,
  language: SupportedLanguage,
): Promise<DownloadedLesson | undefined> {
  const key = getDownloadedLessonKey(moduleId, topicId, language);
  const lesson = await offlineDB.downloadedLessons.get(key);

  // Return undefined if expired
  if (lesson && lesson.expiresAt < Date.now()) {
    await offlineDB.downloadedLessons.delete(key);
    return undefined;
  }

  return lesson;
}

/**
 * Save downloaded lesson
 */
export async function saveDownloadedLesson(lesson: DownloadedLesson): Promise<void> {
  await offlineDB.downloadedLessons.put(lesson);
}

/**
 * Delete downloaded lesson
 */
export async function deleteDownloadedLesson(
  moduleId: string,
  topicId: string,
  language: SupportedLanguage,
): Promise<void> {
  const key = getDownloadedLessonKey(moduleId, topicId, language);
  await offlineDB.downloadedLessons.delete(key);
}

/**
 * Get all downloaded lessons for a module
 */
export async function getDownloadedLessonsForModule(
  moduleId: string,
): Promise<DownloadedLesson[]> {
  return offlineDB.downloadedLessons
    .where("moduleId")
    .equals(moduleId)
    .and((lesson) => lesson.expiresAt > Date.now())
    .toArray();
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  const now = Date.now();
  let cleared = 0;

  // Clear expired legacy lessons
  cleared += await offlineDB.lessons.where("expires_at").below(now).delete();

  // Clear expired downloaded lessons
  cleared += await offlineDB.downloadedLessons.where("expiresAt").below(now).delete();

  // Clear old conversations (older than 7 days)
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  cleared += await offlineDB.conversations.where("last_updated").below(weekAgo).delete();

  return cleared;
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  // Use transaction for all-or-nothing clearing (prevents partial state on crash)
  await offlineDB.transaction(
    "rw",
    [
      offlineDB.syncQueue,
      offlineDB.lessons,
      offlineDB.downloadedLessons,
      offlineDB.progress,
      offlineDB.offlineProgress,
      offlineDB.conversations,
    ],
    async () => {
      await offlineDB.syncQueue.clear();
      await offlineDB.lessons.clear();
      await offlineDB.downloadedLessons.clear();
      await offlineDB.progress.clear();
      await offlineDB.offlineProgress.clear();
      await offlineDB.conversations.clear();
    },
  );
}

/**
 * Get statistics about offline storage
 */
export async function getOfflineStats(): Promise<{
  downloadedLessonsCount: number;
  pendingSyncCount: number;
  storageUsed: number;
  storageQuota: number;
}> {
  const [downloadedLessonsCount, pendingSyncCount, storage] = await Promise.all([
    offlineDB.downloadedLessons.count(),
    offlineDB.syncQueue.count(),
    getStorageUsage(),
  ]);

  return {
    downloadedLessonsCount,
    pendingSyncCount,
    storageUsed: storage.used,
    storageQuota: storage.quota,
  };
}
