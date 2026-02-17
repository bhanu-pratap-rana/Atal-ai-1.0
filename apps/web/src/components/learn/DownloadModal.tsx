"use client";

import { useState, memo } from "react";
import { Download, Volume2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage, type SupportedLanguage } from "@/lib/i18n";

interface DownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string | null;
  topicName: string;
  onConfirm: (language: SupportedLanguage, includeTTS: boolean) => void;
  /** Whether this is a re-download of existing content */
  isRedownload?: boolean;
}

interface LanguageOption {
  value: SupportedLanguage;
  label: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "hi", label: "हिंदी", flag: "🇮🇳" },
  { value: "as", label: "অসমীয়া", flag: "🏔️" },
];

// Estimated sizes (rough estimates for UI display)
const ESTIMATED_LESSON_SIZE_MB = 2;
const ESTIMATED_TTS_SIZE_MB = 5;

export const DownloadModal = memo(function DownloadModal({
  open,
  onOpenChange,
  topicId,
  topicName,
  onConfirm,
  isRedownload = false,
}: DownloadModalProps) {
  const { t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");
  const [includeTTS, setIncludeTTS] = useState(false);

  const estimatedSize = ESTIMATED_LESSON_SIZE_MB + (includeTTS ? ESTIMATED_TTS_SIZE_MB : 0);

  const handleConfirm = () => {
    if (topicId) {
      onConfirm(selectedLanguage, includeTTS);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {isRedownload ? t("learn.redownload") : t("learn.downloadForOffline")}
          </DialogTitle>
          <DialogDescription>
            {topicName ? `"${topicName}"` : t("learn.selectDownloadOptions")}
            {isRedownload && (
              <span className="block mt-1 text-warning">
                {t("learn.redownloadWarning")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">{t("learn.selectLanguage")}</label>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedLanguage(option.value)}
                  aria-pressed={selectedLanguage === option.value}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                    selectedLanguage === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl">{option.flag}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                  {selectedLanguage === option.value && (
                    <span className="text-xs text-primary">✓ {t("learn.selected")}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TTS Option */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t("learn.includeVoiceAudio")}
            </label>
            <button
              type="button"
              role="checkbox"
              aria-checked={includeTTS}
              onClick={() => setIncludeTTS(!includeTTS)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                includeTTS
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  includeTTS
                    ? "bg-primary border-primary text-white"
                    : "border-muted-foreground"
                )}
              >
                {includeTTS && "✓"}
              </div>
              <Volume2 className="h-5 w-5 text-text-secondary" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">{t("learn.yesIncludeTTS")}</div>
                <div className="text-xs text-text-secondary">
                  {t("learn.mbExtra", { size: ESTIMATED_TTS_SIZE_MB })}
                </div>
              </div>
            </button>
          </div>

          {/* Estimated Size */}
          <div className="flex items-center justify-between p-3 bg-surface/50 rounded-lg">
            <span className="text-sm text-text-secondary">
              {t("learn.estimatedDownloadSize")}
            </span>
            <span className="font-medium">~{estimatedSize} MB</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Download className="h-4 w-4" />
            {isRedownload ? t("learn.redownload") : t("learn.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
