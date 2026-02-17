"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PreAssessmentPromptProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
}

/**
 * Pre-Assessment Prompt Modal
 *
 * Shown to new students who haven't taken any assessments.
 * Encourages them to take a diagnostic assessment to find their starting level.
 */
export function PreAssessmentPrompt({ open, onDismiss }: PreAssessmentPromptProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center mb-2">
            <span className="text-5xl block mb-3">📋</span>
          </div>
          <DialogTitle className="text-center text-xl">
            Welcome! Let&apos;s Find Your Level
          </DialogTitle>
          <DialogDescription className="text-center">
            Take a quick 5-minute assessment so we can recommend the best
            lessons for you.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-info-light border-l-4 border-info p-3 rounded-md mt-2">
          <ul className="text-sm text-info-dark/80 space-y-1">
            <li>30 questions across 5 digital literacy areas</li>
            <li>No time limit — take your time</li>
            <li>Helps personalize your learning journey</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => router.push("/app/assessment/start?type=pre")}
            size="lg"
            className="w-full"
          >
            Start Pre-Assessment
          </Button>
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="w-full text-text-tertiary"
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
