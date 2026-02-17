/**
 * PINGenerator Component
 * Handles PIN generation and rotation
 */

import { Eye, EyeOff, Wand2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SchoolPINInfo } from "@/app/actions/admin-pin-management";

interface PINGeneratorProps {
  readonly selectedSchool: SchoolPINInfo | null;
  readonly newPin: string | null;
  readonly showNewPin: boolean;
  readonly onShowNewPinChange: (show: boolean) => void;
  readonly onGeneratePin: () => void;
  readonly onRotatePin: () => Promise<void>;
  readonly onCopyPin: () => Promise<void>;
  readonly rotatingId: string | null;
  readonly copied: boolean;
}

export function PINGenerator({
  selectedSchool,
  newPin,
  showNewPin,
  onShowNewPinChange,
  onGeneratePin,
  onRotatePin,
  onCopyPin,
  rotatingId,
  copied,
}: PINGeneratorProps) {
  if (!selectedSchool) {
    return null;
  }

  const isRotating = rotatingId === selectedSchool.schoolId;

  return (
    <div className="space-y-4">
      {/* School Code Display */}
      <div className="space-y-2">
        <span>School Code</span>
        <Input
          type="text"
          value={selectedSchool.schoolCode}
          disabled
          className="bg-surface"
        />
      </div>

      {/* PIN Display */}
      {newPin && (
        <div className="space-y-2">
          <span>Generated PIN</span>
          <div className="flex gap-2">
            <Input
              type={showNewPin ? "text" : "password"}
              value={newPin}
              disabled
              className="font-mono font-bold text-lg text-center bg-primary/5 border-primary"
            />
            <Button
              onClick={() => onShowNewPinChange(!showNewPin)}
              variant="outline"
              size="icon"
            >
              {showNewPin ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          <p className="text-xs text-text-secondary">
            This PIN will replace the current PIN when you rotate it.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {newPin ? (
          <>
            <Button
              onClick={onCopyPin}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              {copied ? (
                <Check size={18} className="text-success" />
              ) : (
                <Copy size={18} />
              )}
              <span>Copy</span>
            </Button>
            <Button
              onClick={onRotatePin}
              disabled={isRotating}
              variant="default"
              className="flex-1 flex items-center justify-center gap-2"
            >
              {isRotating ? (
                <>
                  <span className="animate-spin">↻</span>
                  <span>Rotating...</span>
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  <span>Rotate PIN</span>
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={onGeneratePin}
            variant="default"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Wand2 size={18} />
            <span>Generate New PIN</span>
          </Button>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-blue-lightest border-l-4 border-blue p-3 rounded-lg">
        <p className="text-xs text-blue-darkest">
          <strong>🔒 Security:</strong> Staff PINs are encrypted and never
          exposed to clients. Only school administrators can view and rotate
          their PIN.
        </p>
      </div>
    </div>
  );
}
