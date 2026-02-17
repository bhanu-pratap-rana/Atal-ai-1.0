"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  validatePhone,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation-utils";
import { PHONE_DIGIT_LENGTH, OTP_LENGTH } from "@/lib/auth-constants";
import type { UsePhoneInputReturn } from "@/hooks/usePhoneInput";
import type { UseOTPInputReturn } from "@/hooks/useOTPInput";
import { createClient } from "@/lib/supabase-browser";
import { authLogger } from "@/lib/auth-logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { AuthState, AuthActions } from "@/hooks/useAuthState";

/**
 * ATAL AI Student Sign Up (Phone) - Jyoti Theme
 *
 * Design Rules Applied:
 * - Primary button
 * - Info box: primary-light bg with primary-dark text
 * - Error text: text-error
 * - Muted text: text-text-muted
 */

interface SignUpPhoneFlowProps {
  readonly state: AuthState;
  readonly actions: AuthActions;
  readonly phoneInput: UsePhoneInputReturn;
  readonly otpInput: UseOTPInputReturn;
  readonly isLoading: boolean;
  readonly onSuccess: () => void;
}

export function SignUpPhoneFlow({
  state,
  actions,
  phoneInput,
  otpInput,
  isLoading,
  onSuccess,
}: SignUpPhoneFlowProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignUpPhoneSendOtp(e: React.FormEvent) {
    e.preventDefault();
    actions.setIsLoading(true);
    actions.setSignupPhoneError(null);

    // Validate phone
    const phoneValidation = validatePhone(phoneInput.fullValue);
    if (!phoneValidation.valid) {
      actions.setSignupPhoneError(phoneValidation.error || "Invalid phone");
      actions.setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneInput.fullValue,
      });

      if (error) {
        authLogger.error("[SignUp Phone] Failed to send OTP", error);
        actions.setSignupPhoneError(error.message || "Failed to send OTP");
        toast.error(error.message || "Failed to send OTP");
      } else {
        toast.success("OTP sent to your phone!");
        actions.setSignupPhoneOtpStep("verify");
      }
    } catch (error) {
      authLogger.error("[SignUp Phone] Error sending OTP", error);
      actions.setSignupPhoneError("Failed to send OTP");
      toast.error("Failed to send OTP");
    } finally {
      actions.setIsLoading(false);
    }
  }

  async function handleSignUpPhoneVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    actions.setSignupPhoneError(null);

    // Validate password before showing loading state
    const passwordValidation = validatePassword(state.signupPhonePassword);
    if (!passwordValidation.valid) {
      actions.setSignupPhoneError(
        passwordValidation.errors.join(", ") || "Invalid password",
      );
      return;
    }

    const matchValidation = validatePasswordMatch(
      state.signupPhonePassword,
      state.signupPhonePasswordConfirm,
    );
    if (!matchValidation.valid) {
      actions.setSignupPhoneError(
        matchValidation.error || "Passwords do not match",
      );
      return;
    }

    // Only set loading after validation passes
    actions.setIsLoading(true);

    try {
      authLogger.debug("[SignUp Phone] Verifying OTP");
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneInput.fullValue,
        token: otpInput.value,
        type: "sms",
      });

      if (error) {
        authLogger.error("[SignUp Phone] OTP verification failed", error);
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        authLogger.error("[SignUp Phone] No user returned");
        toast.error("Verification failed");
        return;
      }

      authLogger.debug("[SignUp Phone] Setting password");
      const { error: updateError } = await supabase.auth.updateUser({
        password: state.signupPhonePassword,
      });

      if (updateError) {
        authLogger.error("[SignUp Phone] Failed to set password", updateError);
        toast.error("Failed to set password");
        return;
      }

      authLogger.success("[SignUp Phone] Account created successfully");
      toast.success("Account created! 🎉");
      actions.resetSignupPhone();
      onSuccess();
      router.push("/app/dashboard");
    } catch (error) {
      authLogger.error("[SignUp Phone] Unexpected error", error);
      toast.error("Failed to verify OTP");
    } finally {
      actions.setIsLoading(false);
    }
  }

  // Phone input step
  if (state.signupPhoneOtpStep === "phone") {
    return (
      <form onSubmit={handleSignUpPhoneSendOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-phone" className="text-text">
            Phone Number
          </Label>
          <div className="flex items-center border-2 border-border rounded-md overflow-hidden focus-within:border-primary focus-within:ring-3 focus-within:ring-primary-light transition-all">
            <span className="px-3 text-text-secondary font-medium bg-border-light h-full py-3">
              +91
            </span>
            <Input
              id="signup-phone"
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

        {/* Info Box - Primary Light */}
        <div className="bg-primary-light border-l-4 border-primary p-3 rounded-md">
          <p className="text-xs text-primary-dark">
            <strong>📱 SMS Verification:</strong> You&apos;ll receive a 6-digit
            code via SMS. Standard rates may apply.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full text-[17px]"
          disabled={
            isLoading || phoneInput.displayValue.length < PHONE_DIGIT_LENGTH
          }
          loading={isLoading}
        >
          <span>Send OTP</span>
          <span className="ml-2">→</span>
        </Button>
      </form>
    );
  }

  // OTP verify & password step
  return (
    <form onSubmit={handleSignUpPhoneVerifyOtp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-phone-otp" className="text-text">
          Verification Code
        </Label>
        <Input
          id="signup-phone-otp"
          type="text"
          placeholder="123456"
          value={otpInput.value}
          onChange={(e) => otpInput.onChange(e.target.value)}
          required
          disabled={isLoading}
          maxLength={OTP_LENGTH}
          className="text-center text-2xl font-mono tracking-widest"
        />
        <p className="text-xs text-text-muted">
          Enter the 6-digit code sent to your phone
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-phone-password" className="text-text">
          Password
        </Label>
        <Input
          id="signup-phone-password"
          type="password"
          placeholder="Minimum 8 characters"
          value={state.signupPhonePassword}
          onChange={(e) => actions.setSignupPhonePassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-phone-password-confirm" className="text-text">
          Confirm Password
        </Label>
        <Input
          id="signup-phone-password-confirm"
          type="password"
          placeholder="Re-enter your password"
          value={state.signupPhonePasswordConfirm}
          onChange={(e) =>
            actions.setSignupPhonePasswordConfirm(e.target.value)
          }
          required
          disabled={isLoading}
        />
        {state.signupPhoneError && (
          <p className="text-sm text-error">{state.signupPhoneError}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full text-[17px]"
        disabled={
          isLoading ||
          otpInput.value.length !== OTP_LENGTH ||
          !state.signupPhonePassword ||
          !state.signupPhonePasswordConfirm
        }
        loading={isLoading}
      >
        <span>Create Account</span>
        <span className="ml-2">→</span>
      </Button>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleSignUpPhoneSendOtp}
          className="text-sm text-primary hover:text-primary-dark hover:underline"
          disabled={isLoading}
        >
          Resend OTP
        </button>
        <button
          type="button"
          onClick={() => actions.setSignupPhoneOtpStep("phone")}
          className="text-sm text-text-secondary hover:text-primary hover:underline transition-colors"
          disabled={isLoading}
        >
          Change phone number
        </button>
      </div>
    </form>
  );
}
