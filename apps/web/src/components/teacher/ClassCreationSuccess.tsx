"use client";

import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClassCreationSuccessProps {
  readonly classCode: string;
  readonly joinPin: string;
  readonly onDone: () => void;
}

export function ClassCreationSuccess({
  classCode,
  joinPin,
  onDone,
}: ClassCreationSuccessProps) {
  return (
    <div>
      <DialogHeader>
        <DialogTitle>Class Created! 🎉</DialogTitle>
        <DialogDescription>
          Share these codes with your students to join the class
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Class Code */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Class Code</span>
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg p-3 md:p-4">
            <p className="text-2xl md:text-3xl font-mono font-bold text-center text-primary tracking-widest break-all">
              {classCode}
            </p>
          </div>
          <p className="text-xs text-text-secondary">
            Students will enter this 6-character code
          </p>
        </div>

        {/* Join PIN */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Join PIN</span>
          <div className="bg-gradient-to-br from-cyan-lightest to-cyan/10 border-2 border-cyan/30 rounded-lg p-3 md:p-4">
            <p className="text-2xl md:text-3xl font-mono font-bold text-center text-cyan-dark tracking-widest">
              {joinPin}
            </p>
          </div>
          <p className="text-xs text-text-secondary">
            4-digit PIN for class security
          </p>
        </div>

        <div className="bg-warning-light border-l-4 border-warning p-3 rounded">
          <p className="text-sm text-warning-dark">
            <strong>📋 Keep these codes safe!</strong> Students need both
            the class code and PIN to join. You can view these codes
            anytime in the class details.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={onDone} className="w-full">
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}
