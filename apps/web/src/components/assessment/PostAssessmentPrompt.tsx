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

interface PostAssessmentPromptProps {
  readonly open: boolean;
  readonly onDismiss: () => void;
}

/**
 * Post-Assessment Prompt Modal
 *
 * Shown to students who have completed the curriculum (all 5 categories mastered).
 * Encourages them to take a final assessment to measure improvement.
 */
export function PostAssessmentPrompt({ open, onDismiss }: PostAssessmentPromptProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center mb-2">
            <span className="text-5xl block mb-3">🎓</span>
          </div>
          <DialogTitle className="text-center text-xl">
            Congratulations! Curriculum Complete!
          </DialogTitle>
          <DialogDescription className="text-center">
            You&apos;ve mastered all 5 digital literacy areas. Take the final
            assessment to see how much you&apos;ve improved.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-success/5 border-l-4 border-success p-3 rounded-md mt-2">
          <ul className="text-sm text-success space-y-1">
            <li>Compare your scores with the pre-assessment</li>
            <li>See your improvement in each category</li>
            <li>Get a complete learning summary</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => router.push("/app/assessment/start?type=post")}
            size="lg"
            className="w-full"
          >
            Take Final Assessment
          </Button>
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="w-full text-text-tertiary"
          >
            Remind me later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
