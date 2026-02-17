"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validatePhone } from "@/lib/validation-utils";
import { PHONE_DIGIT_LENGTH } from "@/lib/auth-constants";
import { createClient } from "@/lib/supabase-browser";
import { authLogger } from "@/lib/auth-logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { AuthState, AuthActions } from "@/hooks/useAuthState";
import type { UsePhoneInputReturn } from "@/hooks/usePhoneInput";

/**
 * ATAL AI Student Sign In (Phone) - Jyoti Theme
 *
 * Design Rules Applied:
 * - Primary button
 * - Error text: text-error
 * - Muted text: text-text-muted
 * - Links: text-primary and text-text-secondary
 */

interface SignInPhoneFormProps {
  readonly state: AuthState;
  readonly actions: AuthActions;
  readonly phoneInput: UsePhoneInputReturn;
  readonly isLoading: boolean;
  readonly onSuccess: () => void;
}

export function SignInPhoneForm({
  state,
  actions,
  phoneInput,
  isLoading,
  onSuccess,
}: SignInPhoneFormProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignInPhone(e: React.FormEvent) {
    e.preventDefault();
    actions.setIsLoading(true);
    actions.setSigninPhoneError(null);

    // Validate phone
    const phoneValidation = validatePhone(phoneInput.fullValue);
    if (!phoneValidation.valid) {
      actions.setSigninPhoneError(phoneValidation.error || "Invalid phone");
      actions.setIsLoading(false);
      return;
    }

    try {
      authLogger.debug("[SignIn Phone] Attempting phone authentication");
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: phoneInput.fullValue,
        password: state.signinPhonePassword,
      });

      if (error) {
        authLogger.error("[SignIn Phone] Authentication failed", error);
        actions.setSigninPhoneError(
          error.message || "Invalid phone or password",
        );
        toast.error(
          "Login failed: " + (error.message || "Invalid credentials"),
        );
      } else if (data.user) {
        authLogger.success("[SignIn Phone] Authentication successful");
        toast.success("Login successful!");
        onSuccess();
        router.push("/app/dashboard");
      }
    } catch (error) {
      authLogger.error("[SignIn Phone] Unexpected error", error);
      actions.setSigninPhoneError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      actions.setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignInPhone} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-phone" className="text-text">
          Phone Number
        </Label>
        <div className="flex items-center border-2 border-border rounded-md overflow-hidden focus-within:border-primary focus-within:ring-3 focus-within:ring-primary-light transition-all">
          <span className="px-3 text-text-secondary font-medium bg-surface h-full py-3">
            +91
          </span>
          <Input
            id="signin-phone"
            type="tel"
            placeholder="9876543210"
            value={phoneInput.displayValue}
            onChange={(e) => phoneInput.onChange(e.target.value)}
            required
            disabled={isLoading}
            className="border-0 flex-1 focus:ring-0 focus:shadow-none"
            maxLength={12}
          />
        </div>
        <p className="text-xs text-text-muted">
          Enter your 10-digit phone number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signin-phone-password" className="text-text">
          Password
        </Label>
        <Input
          id="signin-phone-password"
          type="password"
          placeholder="Enter your password"
          value={state.signinPhonePassword}
          onChange={(e) => actions.setSigninPhonePassword(e.target.value)}
          required
          disabled={isLoading}
        />
        {state.signinPhoneError && (
          <p className="text-sm text-error">{state.signinPhoneError}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full text-[17px]"
        disabled={
          isLoading ||
          phoneInput.displayValue.length < PHONE_DIGIT_LENGTH ||
          !state.signinPhonePassword
        }
        loading={isLoading}
      >
        <span>Sign In</span>
        <span className="ml-2">→</span>
      </Button>

      <div className="text-center space-y-2 text-sm">
        <button
          type="button"
          onClick={() => actions.setMainStep("forgot-password")}
          className="text-primary hover:underline block w-full"
          disabled={isLoading}
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={() => actions.setMainStep("signup")}
          className="text-text-secondary hover:text-primary hover:underline block w-full transition-colors"
          disabled={isLoading}
        >
          Don&apos;t have an account? Sign up
        </button>
      </div>
    </form>
  );
}
