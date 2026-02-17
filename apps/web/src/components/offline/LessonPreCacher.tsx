"use client";

/**
 * Lesson Pre-Cacher Component
 *
 * Client component that pre-caches lessons for offline access.
 * Runs silently in the background when a module page is loaded.
 * Uses the lesson-cache service to store content for offline use.
 */

import { useEffect, useState } from "react";
import { preCacheLessons, preCacheLesson, type Language } from "@/lib/offline/lesson-cache";
import { Download, CheckCircle, Loader2 } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Button } from "@/components/ui/button";
import { clientLogger } from "@/lib/client-logger";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

type CacheStatus = "idle" | "caching" | "done" | "error";
type DownloadStatus = "idle" | "downloading" | "done" | "error";

interface LessonPreCacherProps {
  readonly moduleId: string;
  readonly language?: Language;
  readonly topicIds: string[];
  /** Show a visible indicator (default: false for silent caching) */
  readonly showIndicator?: boolean;
}

/**
 * Get cache status icon based on caching state
 */
function getCacheStatusIcon(status: CacheStatus) {
  switch (status) {
    case "caching":
      return <Loader2 className="h-4 w-4 animate-spin text-warning" />;
    case "done":
      return <CheckCircle className="h-4 w-4 text-success" />;
    default:
      return <Download className="h-4 w-4 text-text-secondary" />;
  }
}

/**
 * Get cache status tooltip message
 */
function getCacheStatusTooltip(
  status: CacheStatus,
  cached: number,
  total: number,
  isOnline: boolean,
): string {
  if (status === "caching") {
    return `Caching lessons for offline... (${cached}/${total})`;
  }
  if (status === "done") {
    return `${cached} lessons available offline`;
  }
  if (status === "error") {
    return "Failed to cache lessons";
  }
  return isOnline ? "Preparing offline access..." : "Go online to cache lessons";
}

/**
 * Get download button content based on download state
 */
function getDownloadButtonContent(
  status: DownloadStatus,
  cached: number,
  moduleName: string,
) {
  switch (status) {
    case "downloading":
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Downloading...
        </>
      );
    case "done":
      return (
        <>
          <CheckCircle className="h-4 w-4 text-success" />
          Downloaded ({cached} lessons)
        </>
      );
    case "error":
      return (
        <>
          <Download className="h-4 w-4 text-error" />
          Retry Download
        </>
      );
    default:
      return (
        <>
          <Download className="h-4 w-4" />
          Download {moduleName}
        </>
      );
  }
}

export function LessonPreCacher({
  moduleId,
  language = "en",
  topicIds,
  showIndicator = false,
}: LessonPreCacherProps) {
  const { isOnline } = useNetworkStatus();
  const [status, setStatus] = useState<CacheStatus>("idle");
  const [cached, setCached] = useState(0);
  const [total, setTotal] = useState(topicIds.length);

  useEffect(() => {
    // Only pre-cache when online
    if (!isOnline) return;

    // Don't re-cache if already done
    if (status === "done") return;

    const doCaching = async () => {
      setStatus("caching");
      setTotal(topicIds.length);

      try {
        const result = await preCacheLessons(moduleId, language);
        setCached(result.cached);
        setStatus("done");

        // Log for debugging (can be removed in production)
        clientLogger.debug("[LessonPreCacher] Cached lessons", {
          cached: result.cached,
          failed: result.failed,
          moduleId,
        });
      } catch (error) {
        clientLogger.error(
          "[LessonPreCacher] Error",
          error instanceof Error ? error : { error: String(error) },
        );
        setStatus("error");
      }
    };

    // Delay caching slightly to not block initial render
    const timer = setTimeout(doCaching, 2000);
    return () => clearTimeout(timer);
  }, [moduleId, language, topicIds.length, isOnline, status]);

  // Silent mode - render nothing
  if (!showIndicator) {
    return null;
  }

  // Visible indicator mode
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={status === "caching"}
          >
            {getCacheStatusIcon(status)}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {getCacheStatusTooltip(status, cached, total, isOnline)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Get localStorage key for module download status
 */
function getDownloadStorageKey(moduleId: string, language: string): string {
  return `atal-module-downloaded-${moduleId}-${language}`;
}

/**
 * Check if module is already downloaded from localStorage
 */
function isModuleDownloaded(moduleId: string, language: string): { downloaded: boolean; cached: number } {
  if (typeof window === "undefined") return { downloaded: false, cached: 0 };
  const stored = localStorage.getItem(getDownloadStorageKey(moduleId, language));
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return { downloaded: true, cached: data.cached || 0 };
    } catch {
      return { downloaded: false, cached: 0 };
    }
  }
  return { downloaded: false, cached: 0 };
}

/**
 * Save module download status to localStorage
 */
function saveModuleDownloaded(moduleId: string, language: string, cached: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getDownloadStorageKey(moduleId, language),
    JSON.stringify({ cached, downloadedAt: new Date().toISOString() })
  );
}

/**
 * Manual Cache Button
 *
 * Allows users to explicitly download a module for offline use.
 * Persists download state in localStorage so button shows "Downloaded" after page refresh.
 */
export function DownloadModuleButton({
  moduleId,
  moduleName,
  language = "en",
}: {
  readonly moduleId: string;
  readonly moduleName: string;
  readonly language?: Language;
}) {
  const { isOnline } = useNetworkStatus();

  // Use lazy initialization to load download state from localStorage
  const [status, setStatus] = useState<DownloadStatus>(() => {
    const stored = isModuleDownloaded(moduleId, language);
    return stored.downloaded ? "done" : "idle";
  });
  const [progress, setProgress] = useState(() => {
    const stored = isModuleDownloaded(moduleId, language);
    return stored.downloaded
      ? { cached: stored.cached, total: stored.cached }
      : { cached: 0, total: 0 };
  });

  const handleDownload = async () => {
    if (!isOnline || status === "downloading") return;

    setStatus("downloading");

    try {
      const result = await preCacheLessons(moduleId, language);
      setProgress({
        cached: result.cached,
        total: result.cached + result.failed,
      });
      setStatus("done");
      // Persist to localStorage so it remembers on next page load
      saveModuleDownloaded(moduleId, language, result.cached);
    } catch (error) {
      clientLogger.error(
        "[DownloadModuleButton] Error",
        error instanceof Error ? error : { error: String(error) },
      );
      setStatus("error");
    }
  };

  return (
    <Button
      variant={status === "done" ? "secondary" : "outline"}
      size="sm"
      onClick={handleDownload}
      disabled={!isOnline || status === "downloading"}
      className="gap-2"
    >
      {getDownloadButtonContent(status, progress.cached, moduleName)}
    </Button>
  );
}

/**
 * Get localStorage key for topic download status
 */
function getTopicDownloadStorageKey(moduleId: string, topicId: string, language: string): string {
  return `atal-topic-downloaded-${moduleId}-${topicId}-${language}`;
}

/**
 * Check if topic is already downloaded from localStorage
 */
function isTopicDownloaded(moduleId: string, topicId: string, language: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getTopicDownloadStorageKey(moduleId, topicId, language)) === "true";
}

/**
 * Save topic download status to localStorage
 */
function saveTopicDownloaded(moduleId: string, topicId: string, language: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getTopicDownloadStorageKey(moduleId, topicId, language), "true");
}

/**
 * Get download button content for topic
 */
function getTopicDownloadButtonContent(
  status: DownloadStatus,
  topicName: string,
  compact: boolean,
) {
  switch (status) {
    case "downloading":
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {!compact && "Downloading..."}
        </>
      );
    case "done":
      return (
        <>
          <CheckCircle className="h-4 w-4 text-success" />
          {!compact && "Downloaded"}
        </>
      );
    case "error":
      return (
        <>
          <Download className="h-4 w-4 text-error" />
          {!compact && "Retry"}
        </>
      );
    default:
      return (
        <>
          <Download className="h-4 w-4" />
          {!compact && `Download ${topicName}`}
        </>
      );
  }
}

/**
 * Topic-wise Download Button
 *
 * Allows users to download individual topics for offline use.
 * Useful when bandwidth is limited and user only needs specific topics.
 *
 * @example
 * ```tsx
 * <DownloadTopicButton
 *   moduleId="M1"
 *   topicId="T1.1"
 *   topicName="The Four Jobs of a Computer"
 *   language="hi"
 * />
 * ```
 */
export function DownloadTopicButton({
  moduleId,
  topicId,
  topicName,
  language = "en",
  compact = false,
}: {
  readonly moduleId: string;
  readonly topicId: string;
  readonly topicName: string;
  readonly language?: Language;
  /** Compact mode - show only icon */
  readonly compact?: boolean;
}) {
  const { isOnline } = useNetworkStatus();

  // Use lazy initialization to load download state from localStorage
  const [status, setStatus] = useState<DownloadStatus>(() => {
    return isTopicDownloaded(moduleId, topicId, language) ? "done" : "idle";
  });

  const handleDownload = async () => {
    if (!isOnline || status === "downloading") return;

    setStatus("downloading");

    try {
      const success = await preCacheLesson(moduleId, topicId, language);
      if (success) {
        setStatus("done");
        saveTopicDownloaded(moduleId, topicId, language);
      } else {
        setStatus("error");
      }
    } catch (error) {
      clientLogger.error(
        "[DownloadTopicButton] Error",
        error instanceof Error ? error : { error: String(error) },
      );
      setStatus("error");
    }
  };

  // Compact mode with tooltip
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={status === "done" ? "ghost" : "outline"}
              size="icon"
              onClick={handleDownload}
              disabled={!isOnline || status === "downloading"}
              className="h-8 w-8"
            >
              {getTopicDownloadButtonContent(status, topicName, true)}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {status === "done"
              ? "Available offline"
              : status === "downloading"
                ? "Downloading..."
                : isOnline
                  ? `Download "${topicName}" for offline`
                  : "Go online to download"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full button mode
  return (
    <Button
      variant={status === "done" ? "secondary" : "outline"}
      size="sm"
      onClick={handleDownload}
      disabled={!isOnline || status === "downloading"}
      className="gap-2"
    >
      {getTopicDownloadButtonContent(status, topicName, false)}
    </Button>
  );
}
