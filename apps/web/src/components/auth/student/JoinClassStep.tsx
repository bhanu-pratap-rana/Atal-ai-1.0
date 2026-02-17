/**
 * JoinClassStep Component
 * Extracted from StudentStartPage to reduce cognitive complexity
 * Handles joining a class after profile setup
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { joinClass } from "@/app/actions/student";
import {
  sanitizeClassCode,
  sanitizePIN,
  validateClassCode,
  validatePIN,
} from "@/lib/validation-utils";
import {
  PIN_LENGTH,
  CLASS_CODE_LENGTH,
} from "@/lib/auth-constants";
import { authLogger } from "@/lib/auth-logger";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseAuthStateReturn } from "@/hooks/useAuthState";

interface JoinClassStepProps {
  readonly state: UseAuthStateReturn["state"];
  readonly actions: UseAuthStateReturn["actions"];
  readonly isLoading: boolean;
}

export function JoinClassStep({
  state,
  actions,
  isLoading,
}: JoinClassStepProps) {
  const router = useRouter();

  // ========================================
  // JOIN CLASS
  // ========================================
  const handleJoinClassAfterProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setJoinClassError(null);

      // Validate class code
      const classCodeValidation = validateClassCode(state.joinClassCode);
      if (!classCodeValidation.valid) {
        actions.setJoinClassError(
          classCodeValidation.error || "Invalid class code",
        );
        actions.setIsLoading(false);
        return;
      }

      // Validate PIN
      const pinValidation = validatePIN(state.joinClassPin);
      if (!pinValidation.valid) {
        actions.setJoinClassError(pinValidation.error || "Invalid PIN");
        actions.setIsLoading(false);
        return;
      }

      try {
        authLogger.debug("[JoinClass] Attempting to join class", {
          code: state.joinClassCode,
        });
        const result = await joinClass({
          classCode: state.joinClassCode.toUpperCase(),
          pin: state.joinClassPin,
        });

        if (result.success) {
          authLogger.success("[JoinClass] Successfully joined class");
          toast.success("Successfully joined the class!");
          actions.resetJoinClass();

          // Redirect to dashboard
          setTimeout(() => {
            router.push("/app/dashboard");
          }, 500);
        } else {
          authLogger.error("[JoinClass] Failed to join class", result);
          const ERROR_MESSAGES: Record<string, string> = {
            "Class not found": "Class code not found. Please check and try again.",
            "Invalid PIN": "Incorrect PIN. Please try again.",
          };
          const errorMessage =
            (result.error && ERROR_MESSAGES[result.error]) ||
            result.error ||
            "Failed to join class";

          actions.setJoinClassError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (error) {
        authLogger.error("[JoinClass] Unexpected error", error);
        actions.setJoinClassError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [state.joinClassCode, state.joinClassPin, actions, router],
  );

  return (
    <AuthCard
      title="Join a Class"
      description="Enter the class code and PIN from your teacher"
    >
      <form onSubmit={handleJoinClassAfterProfile} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="join-class-code">Class Code</Label>
          <Input
            id="join-class-code"
            type="text"
            placeholder="e.g., ABC-123"
            value={state.joinClassCode}
            onChange={(e) =>
              actions.setJoinClassCode(sanitizeClassCode(e.target.value))
            }
            required
            disabled={isLoading}
            className="uppercase text-center font-mono text-lg"
            maxLength={CLASS_CODE_LENGTH}
          />
          <p className="text-xs text-text-secondary">
            Ask your teacher for the class code
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="join-class-pin">Class PIN</Label>
          <Input
            id="join-class-pin"
            type="password"
            placeholder="••••"
            value={state.joinClassPin}
            onChange={(e) =>
              actions.setJoinClassPin(sanitizePIN(e.target.value))
            }
            required
            disabled={isLoading}
            maxLength={PIN_LENGTH}
            className="text-center text-2xl font-mono tracking-widest"
          />
          <p className="text-xs text-text-secondary">
            4-digit PIN provided by your teacher
          </p>
        </div>

        <div className="bg-cyan-lightest border-l-4 border-cyan p-3 rounded-xl">
          <p className="text-xs text-cyan-darkest">
            <strong>📌 Note:</strong> Get the class code and PIN from your
            teacher to join their class.
          </p>
        </div>

        {state.joinClassError && (
          <p className="text-sm text-error">{state.joinClassError}</p>
        )}

        <Button
          type="submit"
          className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
          disabled={
            isLoading ||
            !state.joinClassCode ||
            state.joinClassPin.length !== PIN_LENGTH
          }
        >
          <span>Join Class</span>
          <span className="ml-2">→</span>
        </Button>

        <button
          type="button"
          onClick={() => router.push("/app/dashboard")}
          className="text-sm text-text-secondary hover:underline block w-full text-center"
          disabled={isLoading}
        >
          Skip for now →
        </button>
      </form>
    </AuthCard>
  );
}
