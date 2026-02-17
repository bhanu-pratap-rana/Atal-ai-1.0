"use client";

import { memo } from "react";
import Link from "next/link";
import { Download, CheckCircle2, Circle, PlayCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";

export interface TopicProgress {
  status: "not_started" | "in_progress" | "mastered";
  masteryScore: number;
}

export interface TopicData {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  displayOrder: number;
  progress: TopicProgress;
  isDownloaded: boolean;
}

interface TopicRowProps {
  topic: TopicData;
  moduleId: string;
  onDownload: (topicId: string) => void;
  isDownloading?: boolean;
}

function getStatusIcon(status: TopicProgress["status"], masteryScore: number) {
  if (status === "mastered" || masteryScore >= MASTERY_THRESHOLDS.PASSING) {
    return <CheckCircle2 className="h-5 w-5 text-success" />;
  }
  if (status === "in_progress" || masteryScore > 0) {
    return <PlayCircle className="h-5 w-5 text-primary" />;
  }
  return <Circle className="h-5 w-5 text-text-secondary" />;
}

function getStatusKey(status: TopicProgress["status"], masteryScore: number): string {
  if (status === "mastered" || masteryScore >= MASTERY_THRESHOLDS.PASSING) {
    return "learn.mastered";
  }
  if (status === "in_progress" || masteryScore > 0) {
    return "learn.inProgress";
  }
  return "learn.notStarted";
}

/**
 * PERF-013 FIX: Memoize TopicRow to prevent re-renders when parent state changes
 * Only re-renders when topic, moduleId, onDownload, or isDownloading props change
 */
export const TopicRow = memo(function TopicRow({
  topic,
  moduleId,
  onDownload,
  isDownloading = false,
}: TopicRowProps) {
  const { t } = useLanguage();
  const isMastered = topic.progress.status === "mastered" || topic.progress.masteryScore >= MASTERY_THRESHOLDS.PASSING;
  const isInProgress = topic.progress.status === "in_progress" || topic.progress.masteryScore > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-colors",
        isMastered && "bg-success/5 border-success/20",
        isInProgress && !isMastered && "bg-primary/5 border-primary/20",
        !isMastered && !isInProgress && "bg-background border-border hover:bg-surface-dark/50"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getStatusIcon(topic.progress.status, topic.progress.masteryScore)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{topic.name}</h4>
            {topic.isDownloaded && (
              <span className="text-xs bg-surface px-2 py-0.5 rounded text-text-secondary">
                {t("learn.offline")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t(getStatusKey(topic.progress.status, topic.progress.masteryScore))}</span>
            <span>•</span>
            <span>{topic.durationMinutes} {t("learn.minutes")}</span>
            {topic.progress.masteryScore > 0 && (
              <>
                <span>•</span>
                <span>{topic.progress.masteryScore}%</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2">
        {/* Download Button / Re-download Button */}
        {topic.isDownloaded ? (
          // Show downloaded indicator with re-download option
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-success/10 hover:bg-success/20"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDownload(topic.id);
                  }}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <RefreshCw className="h-4 w-4 text-success animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("learn.downloaded")} - {t("learn.redownload")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          // Show download button when not downloaded
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDownload(topic.id);
            }}
            disabled={isDownloading}
            title={t("learn.downloadForOffline")}
          >
            <Download
              className={cn(
                "h-4 w-4 text-text-secondary",
                isDownloading && "animate-spin"
              )}
            />
          </Button>
        )}

        {/* Go to Lesson Button */}
        <Link href={`/app/learn/${moduleId}/${topic.id}`}>
          <Button
            variant={isMastered ? "outline" : "default"}
            size="sm"
            className="truncate"
          >
            {isMastered ? t("learn.reviewModule") : isInProgress ? t("common.continue") : t("common.start")}
          </Button>
        </Link>
      </div>
    </div>
  );
});
