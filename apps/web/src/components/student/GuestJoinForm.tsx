"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  validateClassCode,
  validatePIN,
  sanitizeClassCode,
  sanitizePIN,
} from "@/lib/validation-utils";
import { PIN_LENGTH, CLASS_CODE_LENGTH } from "@/lib/auth-constants";
import { joinClass } from "@/app/actions/student";
import { createClient } from "@/lib/supabase-browser";
import { authLogger } from "@/lib/auth-logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { AuthState, AuthActions } from "@/hooks/useAuthState";

/**
 * ATAL AI Guest Join Class Form - Jyoti Theme
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

interface GuestJoinFormProps {
  readonly state: AuthState;
  readonly actions: AuthActions;
  readonly isLoading: boolean;
  readonly onSuccess: () => void;
}

export function GuestJoinForm({
  state,
  actions,
  isLoading,
  onSuccess,
}: GuestJoinFormProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleGuestJoinClass(e: React.FormEvent) {
    e.preventDefault();
    actions.setIsLoading(true);
    actions.setGuestError(null);

    // Validate inputs
    const codeValidation = validateClassCode(state.guestClassCode);
    const pinValidation = validatePIN(state.guestPin);

    // Check validations
    if (!codeValidation.valid || !pinValidation.valid) {
      const error = codeValidation.valid
        ? pinValidation.error
        : codeValidation.error;
      actions.setGuestError(error || "Invalid input");
      actions.setIsLoading(false);
      return;
    }

    try {
      // First, sign in anonymously
      const { error: anonError } = await supabase.auth.signInAnonymously();

      if (anonError) {
        actions.setGuestError(anonError.message);
        toast.error(anonError.message);
        actions.setIsLoading(false);
        return;
      }

      // Then join class
      const result = await joinClass({
        classCode: state.guestClassCode.toUpperCase().trim(),
        pin: state.guestPin.trim(),
      });

      if (result.success) {
        toast.success("Successfully joined class! 🎉");
        actions.resetGuest();
        onSuccess();
        router.push("/app/student/classes");
      } else {
        actions.setGuestError(result.error || "Failed to join class");
        toast.error(result.error || "Failed to join class");
      }
    } catch (error) {
      authLogger.error("[Guest Join] Failed to join class", error);
      actions.setGuestError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      actions.setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleGuestJoinClass} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guest-class-code" className="text-text-primary">
          Class Code
        </Label>
        <Input
          id="guest-class-code"
          type="text"
          placeholder="A3F7E2"
          value={state.guestClassCode}
          onChange={(e) =>
            actions.setGuestClassCode(sanitizeClassCode(e.target.value))
          }
          required
          disabled={isLoading}
          maxLength={CLASS_CODE_LENGTH}
          className="uppercase font-mono text-center text-xl tracking-widest"
        />
        <p className="text-xs text-text-tertiary">
          6-character code provided by your teacher
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guest-pin" className="text-text-primary">
          Class PIN
        </Label>
        <Input
          id="guest-pin"
          type="password"
          placeholder="••••"
          value={state.guestPin}
          onChange={(e) => actions.setGuestPin(sanitizePIN(e.target.value))}
          required
          disabled={isLoading}
          maxLength={PIN_LENGTH}
          className="text-center text-2xl font-mono tracking-widest"
        />
        <p className="text-xs text-text-tertiary">
          4-digit PIN provided by your teacher
        </p>
      </div>

      {/* Info Box - Primary Light */}
      <div className="bg-primary-light border border-primary/20 rounded-md p-4">
        <p className="text-xs text-primary-dark">
          <strong>📌 Note:</strong> You can add your roll number and profile
          details later in the Settings page.
        </p>
      </div>

      {state.guestError && (
        <p className="text-sm text-error">{state.guestError}</p>
      )}

      <Button
        type="submit"
        className="w-full text-[17px]"
        disabled={
          isLoading ||
          !state.guestClassCode ||
          state.guestPin.length !== PIN_LENGTH
        }
        loading={isLoading}
      >
        <span>Join Class</span>
        <span className="ml-2">→</span>
      </Button>
    </form>
  );
}
