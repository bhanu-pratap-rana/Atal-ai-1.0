/**
 * SignUpStep Component
 * Extracted from StudentStartPage to reduce cognitive complexity
 * Handles email, phone, and quick-start (username) sign-up methods
 */

"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";
import {
  requestOtp,
  registerWithUsername,
} from "@/app/actions/auth";
import { useOTPInput } from "@/hooks/useOTPInput";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validatePhone,
} from "@/lib/validation-utils";
import {
  OTP_LENGTH,
} from "@/lib/auth-constants";
import { authLogger } from "@/lib/auth-logger";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseAuthStateReturn } from "@/hooks/useAuthState";

interface SignUpStepProps {
  readonly state: UseAuthStateReturn["state"];
  readonly actions: UseAuthStateReturn["actions"];
  readonly isLoading: boolean;
}

export function SignUpStep({ state, actions, isLoading }: SignUpStepProps) {
  const supabase = createClient();
  const signupPhoneInput = usePhoneInput(state.signupPhoneNumber);
  const signupEmailOtpInput = useOTPInput(state.signupEmailOtp);
  const signupPhoneOtpInput = useOTPInput(state.signupPhoneOtp);

  // ========================================
  // SIGN UP - EMAIL OTP SEND
  // ========================================
  const handleSignUpEmailSendOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setSignupEmailError(null);

      const emailValidation = validateEmail(state.signupEmailAddress);
      if (!emailValidation.valid) {
        actions.setSignupEmailError(emailValidation.error || "Invalid email");
        actions.setIsLoading(false);
        return;
      }

      try {
        const result = (await requestOtp(state.signupEmailAddress.trim())) as {
          success: boolean;
          error?: string;
          exists?: boolean;
          role?: string;
        };
        if (result.success) {
          toast.success("OTP sent to your email!");
          actions.setSignupEmailOtpSent(true);
        } else if (result.exists) {
          authLogger.debug("[SignUp Email] Email already exists", {
            role: result.role,
          });
          toast.error(result.error || "This email is already registered");

          if (
            result.role === "teacher" ||
            result.role === "admin" ||
            result.role === "super_admin"
          ) {
            actions.setSignupEmailError(
              result.error || "Please use the teacher login page.",
            );
          } else {
            actions.setSigninEmailAddress(state.signupEmailAddress);
            actions.setMainStep("signin");
            actions.setSigninTab("email");
          }
        } else {
          actions.setSignupEmailError(result.error || "Failed to send OTP");
          toast.error(result.error || "Failed to send OTP");
        }
      } catch (error) {
        authLogger.error("[SignUp Email] Failed to send OTP", error);
        actions.setSignupEmailError("Failed to send OTP");
        toast.error("Failed to send OTP");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [state.signupEmailAddress, actions],
  );

  // ========================================
  // SIGN UP - EMAIL OTP VERIFY & CREATE
  // ========================================
  const handleSignUpEmailVerifyAndCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setSignupEmailError(null);

      const passwordValidation = validatePassword(state.signupEmailPassword);
      if (!passwordValidation.valid) {
        actions.setSignupEmailError(
          passwordValidation.errors.join(", ") || "Invalid password",
        );
        actions.setIsLoading(false);
        return;
      }

      const matchValidation = validatePasswordMatch(
        state.signupEmailPassword,
        state.signupEmailPasswordConfirm,
      );
      if (!matchValidation.valid) {
        actions.setSignupEmailError(
          matchValidation.error || "Passwords do not match",
        );
        actions.setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: state.signupEmailAddress,
          token: signupEmailOtpInput.value,
          type: "email",
        });

        if (error) {
          authLogger.error("[SignUp Email] Verification failed", error);
          let errorMessage = "OTP verification failed";
          if (
            error.message?.includes("expired") ||
            error.message?.includes("invalid")
          ) {
            errorMessage =
              "OTP has expired or is invalid. Please request a new one.";
          } else if (error.message) {
            errorMessage = error.message;
          }
          actions.setSignupEmailError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        if (!data.user) {
          actions.setSignupEmailError("Verification failed");
          toast.error("Email verification failed");
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: state.signupEmailPassword,
        });

        if (updateError) {
          authLogger.error("[SignUp Email] Failed to set password", updateError);
          let errorMessage = "Failed to set password";
          if (
            updateError.message?.includes("same as") ||
            updateError.message?.includes("different from")
          ) {
            errorMessage =
              "This password was already used. Please choose a different password.";
          } else if (updateError.message) {
            errorMessage = updateError.message;
          }
          actions.setSignupEmailError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        toast.success("Account created! Now set up your profile.");
        actions.resetSignupEmail();
        actions.setMainStep("profile");
      } catch (error) {
        authLogger.error("[SignUp Email] Unexpected error", error);
        actions.setSignupEmailError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [
      state.signupEmailAddress,
      state.signupEmailPassword,
      state.signupEmailPasswordConfirm,
      signupEmailOtpInput.value,
      supabase,
      actions,
    ],
  );

  // ========================================
  // SIGN UP - PHONE OTP SEND
  // ========================================
  const handleSignUpPhoneSendOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setSignupPhoneError(null);

      const phoneValidation = validatePhone(signupPhoneInput.fullValue);
      if (!phoneValidation.valid) {
        actions.setSignupPhoneError(phoneValidation.error || "Invalid phone");
        actions.setIsLoading(false);
        return;
      }

      try {
        const result = (await requestOtp(signupPhoneInput.fullValue)) as {
          success: boolean;
          error?: string;
          exists?: boolean;
          role?: string;
        };

        if (result.success) {
          toast.success("OTP sent to your phone!");
          actions.setSignupPhoneOtpStep("verify");
        } else if (result.exists) {
          authLogger.debug("[SignUp Phone] Phone already exists", {
            role: result.role,
          });
          toast.error(result.error || "This phone is already registered");

          if (
            result.role === "teacher" ||
            result.role === "admin" ||
            result.role === "super_admin"
          ) {
            actions.setSignupPhoneError(
              result.error || "Please use the teacher login page.",
            );
          } else {
            actions.setSigninPhoneNumber(signupPhoneInput.fullValue);
            actions.setMainStep("signin");
            actions.setSigninTab("phone");
          }
        } else {
          actions.setSignupPhoneError(result.error || "Failed to send OTP");
          toast.error(result.error || "Failed to send OTP");
        }
      } catch (error) {
        authLogger.error("[SignUp Phone] Failed to send OTP", error);
        actions.setSignupPhoneError("Failed to send OTP");
        toast.error("Failed to send OTP");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [signupPhoneInput.fullValue, actions],
  );

  // ========================================
  // SIGN UP - PHONE OTP VERIFY
  // ========================================
  const handleSignUpPhoneVerifyOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setSignupPhoneError(null);

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: signupPhoneInput.fullValue,
          token: signupPhoneOtpInput.value,
          type: "sms",
        });

        if (error) {
          authLogger.error("[SignUp Phone] Verification failed", error);
          let errorMessage = "OTP verification failed";
          if (
            error.message?.includes("expired") ||
            error.message?.includes("invalid")
          ) {
            errorMessage =
              "OTP has expired or is invalid. Please request a new one.";
          } else if (error.message) {
            errorMessage = error.message;
          }
          actions.setSignupPhoneError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        if (!data.user) {
          actions.setSignupPhoneError("Verification failed");
          toast.error("Phone verification failed");
          return;
        }

        toast.success("Phone verified! Now set up your profile.");
        actions.resetSignupPhone();
        actions.setMainStep("profile");
      } catch (error) {
        authLogger.error("[SignUp Phone] Unexpected error", error);
        actions.setSignupPhoneError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        actions.setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signupPhoneInput.fullValue, signupPhoneOtpInput.value, actions],
  );

  // ========================================
  // SIGN UP - USERNAME (Quick Start)
  // ========================================
  const handleUsernameSignup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      actions.setIsLoading(true);
      actions.setSignupUsernameError(null);

      if (!state.signupUsername.trim()) {
        actions.setSignupUsernameError("Username is required");
        actions.setIsLoading(false);
        return;
      }

      const passwordValidation = validatePassword(state.signupUsernamePassword);
      if (!passwordValidation.valid) {
        actions.setSignupUsernameError(
          passwordValidation.errors.join(", ") || "Invalid password",
        );
        actions.setIsLoading(false);
        return;
      }

      try {
        authLogger.debug("[SignUp Username] Attempting username registration");
        const result = await registerWithUsername(
          state.signupUsername.trim(),
          state.signupUsernamePassword,
        );

        if (result.success) {
          authLogger.success("[SignUp Username] Registration successful");
          toast.success("Account created! Now set up your profile.");
          actions.resetSignupUsername();
          actions.setMainStep("profile");
        } else {
          authLogger.error("[SignUp Username] Registration failed", {
            error: result.error,
          });
          actions.setSignupUsernameError(
            result.error || "Registration failed. Try again.",
          );
          toast.error("Registration failed: " + (result.error || "Unknown error"));
        }
      } catch (error) {
        authLogger.error("[SignUp Username] Unexpected error", error);
        actions.setSignupUsernameError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      } finally {
        actions.setIsLoading(false);
      }
    },
    [state.signupUsername, state.signupUsernamePassword, actions],
  );

  return (
    <AuthCard title="Create Account" description="Choose your sign-up method">
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => actions.setSignupTab("email")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
              state.signupTab === "email"
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-surface-dark"
            }`}
            disabled={isLoading}
          >
            📧 Email
          </button>
          <button
            onClick={() => actions.setSignupTab("phone")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
              state.signupTab === "phone"
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-surface-dark"
            }`}
            disabled={isLoading}
          >
            📱 Phone
          </button>
          <button
            onClick={() => actions.setSignupTab("guest")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
              state.signupTab === "guest"
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary hover:bg-surface-dark"
            }`}
            disabled={isLoading}
          >
            ⚡ Quick Start
          </button>
        </div>

        {/* Email Sign Up Form */}
        {state.signupTab === "email" && (
          <>
            {state.signupEmailOtpSent ? (
              <form
                onSubmit={handleSignUpEmailVerifyAndCreate}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-email-otp">Verification Code</Label>
                  <Input
                    id="signup-email-otp"
                    type="text"
                    placeholder="123456"
                    value={signupEmailOtpInput.value}
                    onChange={(e) =>
                      signupEmailOtpInput.onChange(e.target.value)
                    }
                    required
                    disabled={isLoading}
                    maxLength={OTP_LENGTH}
                    className="text-center text-2xl font-mono tracking-widest"
                  />
                  <p className="text-xs text-text-secondary">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email-password">Password</Label>
                  <Input
                    id="signup-email-password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={state.signupEmailPassword}
                    onChange={(e) =>
                      actions.setSignupEmailPassword(e.target.value)
                    }
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  {state.signupEmailPassword.length > 0 &&
                    (() => {
                      const validation = validatePassword(
                        state.signupEmailPassword,
                      );
                      if (!validation.valid && validation.errors.length > 0) {
                        return (
                          <p className="text-xs text-error">
                            {validation.errors.join(", ")}
                          </p>
                        );
                      }
                      return null;
                    })()}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email-confirm">
                    Confirm Password
                  </Label>
                  <Input
                    id="signup-email-confirm"
                    type="password"
                    placeholder="Re-enter your password"
                    value={state.signupEmailPasswordConfirm}
                    onChange={(e) =>
                      actions.setSignupEmailPasswordConfirm(e.target.value)
                    }
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                {state.signupEmailError && (
                  <p className="text-sm text-error">{state.signupEmailError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
                  disabled={
                    isLoading ||
                    !signupEmailOtpInput.value ||
                    !state.signupEmailPassword ||
                    !state.signupEmailPasswordConfirm
                  }
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUpEmailSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={state.signupEmailAddress}
                    onChange={(e) =>
                      actions.setSignupEmailAddress(e.target.value)
                    }
                    required
                    disabled={isLoading}
                  />
                </div>

                {state.signupEmailError && (
                  <p className="text-sm text-error">{state.signupEmailError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
                  disabled={isLoading || !state.signupEmailAddress}
                >
                  {isLoading ? "Sending code..." : "Send Verification Code"}
                </Button>

                <p className="text-center text-sm text-text-secondary">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => actions.setMainStep("signin")}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </>
        )}

        {/* Phone Sign Up Form */}
        {state.signupTab === "phone" && (
          <>
            {state.signupPhoneOtpStep === "verify" ? (
              <form
                onSubmit={handleSignUpPhoneVerifyOtp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-phone-otp">Verification Code</Label>
                  <Input
                    id="signup-phone-otp"
                    type="text"
                    placeholder="123456"
                    value={signupPhoneOtpInput.value}
                    onChange={(e) =>
                      signupPhoneOtpInput.onChange(e.target.value)
                    }
                    required
                    disabled={isLoading}
                    maxLength={OTP_LENGTH}
                    className="text-center text-2xl font-mono tracking-widest"
                  />
                  <p className="text-xs text-text-secondary">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                {state.signupPhoneError && (
                  <p className="text-sm text-error">{state.signupPhoneError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
                  disabled={isLoading || !signupPhoneOtpInput.value}
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUpPhoneSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={signupPhoneInput.displayValue}
                    onChange={(e) => signupPhoneInput.onChange(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {state.signupPhoneError && (
                  <p className="text-sm text-error">{state.signupPhoneError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
                  disabled={isLoading || !signupPhoneInput.fullValue}
                >
                  {isLoading ? "Sending code..." : "Send Verification Code"}
                </Button>

                <p className="text-center text-sm text-text-secondary">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => actions.setMainStep("signin")}
                    className="text-primary hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </>
        )}

        {/* Quick Start (Username) Form */}
        {state.signupTab === "guest" && (
          <form onSubmit={handleUsernameSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                type="text"
                placeholder="Choose a username"
                value={state.signupUsername}
                onChange={(e) => actions.setSignupUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-username-password">Password</Label>
              <Input
                id="signup-username-password"
                type="password"
                placeholder="Minimum 8 characters"
                value={state.signupUsernamePassword}
                onChange={(e) =>
                  actions.setSignupUsernamePassword(e.target.value)
                }
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
              {state.signupUsernamePassword.length > 0 &&
                (() => {
                  const validation = validatePassword(
                    state.signupUsernamePassword,
                  );
                  if (!validation.valid && validation.errors.length > 0) {
                    return (
                      <p className="text-xs text-error">
                        {validation.errors.join(", ")}
                      </p>
                    );
                  }
                  return null;
                })()}
            </div>

            {state.signupUsernameError && (
              <p className="text-sm text-error">{state.signupUsernameError}</p>
            )}

            <Button
              type="submit"
              className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
              disabled={
                isLoading || !state.signupUsername || !state.signupUsernamePassword
              }
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => actions.setMainStep("signin")}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </AuthCard>
  );
}
