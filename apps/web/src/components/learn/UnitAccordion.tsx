"use client";

import { useState, memo } from "react";
import { ChevronDown, BookOpen, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TopicRow, type TopicData } from "./TopicRow";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { MASTERY_THRESHOLDS } from "@/lib/constants/thresholds";

export interface UnitData {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  topics: TopicData[];
}

interface UnitAccordionProps {
  unit: UnitData;
  moduleId: string;
  defaultOpen?: boolean;
  onDownloadTopic: (topicId: string) => void;
  downloadingTopicId?: string | null;
}

export const UnitAccordion = memo(function UnitAccordion({
  unit,
  moduleId,
  defaultOpen = false,
  onDownloadTopic,
  downloadingTopicId,
}: UnitAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { t } = useLanguage();

  // Calculate unit progress
  const completedTopics = unit.topics.filter(
    (t) => t.progress.status === "mastered" || t.progress.masteryScore >= MASTERY_THRESHOLDS.PASSING
  ).length;
  const totalTopics = unit.topics.length;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const isUnitComplete = completedTopics === totalTopics && totalTopics > 0;

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isUnitComplete && "border-success/30"
    )}>
      <CardHeader
        className={cn(
          "cursor-pointer select-none transition-colors",
          "hover:bg-surface-dark/50",
          isOpen && "bg-surface/30"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isUnitComplete ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
            )}>
              {isUnitComplete ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                {t("learn.unit")} {unit.displayOrder}: {unit.name}
                {isUnitComplete && <CheckCircle2 className="h-4 w-4 text-success" />}
              </h3>
              {unit.description && (
                <p className="text-sm text-text-secondary">{unit.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <div className="text-right">
              <div className="text-sm font-medium">
                {completedTopics}/{totalTopics}
              </div>
              <div className="text-xs text-text-secondary">
                {t("learn.percentComplete", { percent: progressPercent })}
              </div>
            </div>

            {/* Chevron */}
            <ChevronDown
              className={cn(
                "h-5 w-5 text-text-secondary transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isUnitComplete ? "bg-success" : "bg-primary"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>

      {/* Collapsible content */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0 pb-4 space-y-2">
            {unit.topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                moduleId={moduleId}
                onDownload={onDownloadTopic}
                isDownloading={downloadingTopicId === topic.id}
              />
            ))}
          </CardContent>
        </div>
      </div>
    </Card>
  );
});
