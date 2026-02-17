/**
 * TeacherSignUpStep Component
 * Extracted from teacher/start/page.tsx to reduce cognitive complexity
 * Handles teacher signup with email or phone verification (OTP)
 */

"use client";

import { useCallback } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  TeacherOnboardingState,
  TeacherOnboardingActions,
} from "@/hooks/useTeacherOnboarding";

interface TeacherSignUpStepProps {
  readonly state: TeacherOnboardingState;
  readonly actions: TeacherOnboardingActions;
}

export function TeacherSignUpStep({
  state,
  actions,
}: TeacherSignUpStepProps) {
  // Handle email method selection
  const handleEmailMethodSelect = useCallback(() => {
    actions.setSignupMethod("email");
    actions.setPhoneError("");
    actions.setEmailError("");
  }, [actions]);

  // Handle phone method selection
  const handlePhoneMethodSelect = useCallback(() => {
    actions.setSignupMethod("phone");
    actions.setPhoneError("");
    actions.setEmailError("");
  }, [actions]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-8 sm:px-6 md:px-8">
      <AuthCard
        title="Teacher Registration"
        description="Step 1 of 4: Choose your verification method"
      >
        <div className="space-y-3 sm:space-y-4">
          {/* Tab Navigation - Responsive sizing */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleEmailMethodSelect}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                state.signupMethod === "email"
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface text-text-secondary hover:bg-surface-dark"
              }`}
              disabled={state.loading}
            >
              <span className="hidden sm:inline">📧 </span>Email
            </button>
            <button
              onClick={handlePhoneMethodSelect}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                state.signupMethod === "phone"
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface text-text-secondary hover:bg-surface-dark"
              }`}
              disabled={state.loading}
            >
              <span className="hidden sm:inline">📱 </span>Phone
            </button>
          </div>

          {/* Email Method */}
          {state.signupMethod === "email" && (
            <>
              {state.otpSent ? (
                <form
                  onSubmit={actions.handleVerifyOTP}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={state.otp}
                      onChange={(e) =>
                        actions.setOtp(
                          e.target.value.replaceAll(/\D/g, "").slice(0, 6),
                        )
                      }
                      required
                      disabled={state.loading}
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-text-secondary">
                      Enter the 6-digit code sent to {state.email}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full shadow-[var(--shadow-primary)]"
                    disabled={state.loading || state.otp.length !== 6}
                    loading={state.loading}
                  >
                    Verify & Continue
                  </Button>

                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={actions.handleSendOTP}
                      className="text-sm text-primary hover:text-primary-dark hover:underline"
                      disabled={state.loading}
                    >
                      Resend OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        actions.setOtpSent(false);
                        actions.setOtp("");
                      }}
                      className="text-sm text-primary hover:underline"
                      disabled={state.loading}
                    >
                      Use different email
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={actions.handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="teacher@school.edu"
                      value={state.email}
                      onChange={(e) => actions.setEmail(e.target.value)}
                      required
                      disabled={state.loading}
                    />
                    {state.emailError && (
                      <div className="space-y-2">
                        <p className="text-sm text-error">
                          {state.emailError}
                        </p>
                        {state.emailSuggestion && (
                          <button
                            type="button"
                            onClick={() =>
                              actions.setEmail(state.emailSuggestion)
                            }
                            className="text-sm text-cyan hover:text-cyan-dark hover:underline"
                            disabled={state.loading}
                          >
                            ✓ Use suggested: {state.emailSuggestion}
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-text-secondary">
                      We&apos;ll send a 6-digit code to this email
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full shadow-[var(--shadow-primary)]"
                    disabled={state.loading || !state.email}
                    loading={state.loading}
                  >
                    Send Verification Code
                  </Button>
                </form>
              )}
            </>
          )}

          {/* Phone Method */}
          {state.signupMethod === "phone" && (
            <div className="space-y-4">
              <div className="bg-cyan-lightest border-l-4 border-cyan p-3 rounded-xl">
                <p className="text-xs text-cyan-darkest">
                  <strong>📱 Phone Verification</strong>
                  <br />
                  Enter your 10-digit phone number. We&apos;ll send a
                  verification code via OTP.
                </p>
              </div>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-surface rounded-lg">
                      <span className="text-sm font-medium text-text-secondary">
                        +91
                      </span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={state.phoneNumber}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replaceAll(/\D/g, "")
                          .slice(0, 10);
                        actions.setPhoneNumber(digits);
                        actions.setPhoneError("");
                      }}
                      required
                      disabled={state.loading}
                      maxLength={10}
                    />
                  </div>
                  {state.phoneError && (
                    <p className="text-sm text-error">{state.phoneError}</p>
                  )}
                  <p className="text-xs text-text-secondary">
                    10-digit Indian phone number
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => {
                    if (state.phoneNumber.length === 10) {
                      // Phone OTP will be sent here
                      actions.setPhoneOtpSent(true);
                    } else {
                      actions.setPhoneError("Phone number must be 10 digits");
                    }
                  }}
                  className="w-full shadow-[var(--shadow-primary)]"
                  disabled={state.loading || state.phoneNumber.length !== 10}
                  loading={state.loading}
                >
                  Send OTP to Phone
                </Button>
              </form>

              {state.phoneOtpSent && (
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-otp">Verification Code</Label>
                    <Input
                      id="phone-otp"
                      type="text"
                      placeholder="123456"
                      value={state.phoneOtp}
                      onChange={(e) =>
                        actions.setPhoneOtp(
                          e.target.value.replaceAll(/\D/g, "").slice(0, 6),
                        )
                      }
                      required
                      disabled={state.loading}
                      maxLength={6}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-text-secondary">
                      Enter the 6-digit code sent to +91{state.phoneNumber}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      if (state.phoneOtp.length === 6) {
                        // Phone verification would happen here
                        actions.setStep("set-password");
                      }
                    }}
                    className="w-full shadow-[var(--shadow-primary)]"
                    disabled={state.loading || state.phoneOtp.length !== 6}
                    loading={state.loading}
                  >
                    Verify & Continue
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      actions.setPhoneOtpSent(false);
                      actions.setPhoneOtp("");
                    }}
                    className="text-sm text-primary hover:underline block w-full text-center"
                    disabled={state.loading}
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => actions.setStep("choice")}
              className="text-sm text-primary hover:underline"
              disabled={state.loading}
            >
              ← Back to options
            </button>
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
