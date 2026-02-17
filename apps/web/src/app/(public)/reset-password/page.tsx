"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";
import { resetPasswordWithOtp } from "@/app/actions/auth";
import { validateEmail, validatePasswordMatch } from "@/lib/validation-utils";
import { getPasswordValidationError } from "@/lib/password-utils";
import { OTP_LENGTH } from "@/lib/auth-constants";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authLogger } from "@/lib/auth-logger";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Form state with email from URL param (set by password reset flow)
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated - redirect to dashboard
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/app/dashboard");
      }
    }
    checkAuth();
  }, [supabase, router]);

  // Handle OTP input change (max 6 digits)
  const handleOtpChange = (value: string) => {
    const cleanValue = value.replaceAll(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(cleanValue);
  };

  // Handle form submission
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!email.trim()) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }

      if (otp.length !== OTP_LENGTH) {
        setError(`Verification code must be ${OTP_LENGTH} digits`);
        setIsLoading(false);
        return;
      }

      if (!newPassword) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        setError(emailValidation.error || "Invalid email");
        setIsLoading(false);
        return;
      }

      // Validate password (min 8 chars, max 64 chars, no complexity rules)
      const passwordError = getPasswordValidationError(newPassword);
      if (passwordError) {
        setError(passwordError);
        setIsLoading(false);
        return;
      }

      // Validate password match
      const matchValidation = validatePasswordMatch(
        newPassword,
        confirmPassword,
      );
      if (!matchValidation.valid) {
        setError(matchValidation.error || "Passwords do not match");
        setIsLoading(false);
        return;
      }

      authLogger.debug("[ResetPassword] Attempting password reset", {
        email: email.slice(0, 5) + "...",
      });

      // Call server action to reset password with OTP
      const result = await resetPasswordWithOtp(email.trim(), otp, newPassword);

      if (result.success) {
        authLogger.success("[ResetPassword] Password reset successful");
        toast.success(
          "Password reset successfully! Please log in with your new password.",
        );

        // Redirect to student login or check role
        setTimeout(() => {
          router.push("/student/start");
        }, 2000);
      } else {
        authLogger.error("[ResetPassword] Password reset failed", {
          error: result.error,
        });
        setError(result.error || "Failed to reset password");
        toast.error(
          result.error || "Failed to reset password. Please try again.",
        );
      }
    } catch (error) {
      authLogger.error("[ResetPassword] Unexpected error", error);
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <AuthCard title="Reset Password">
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || Boolean(searchParams.get("email"))}
              className="w-full"
            />
            <p className="text-xs text-text-secondary">
              We sent a verification code to this email address
            </p>
          </div>

          {/* OTP Field */}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium">
              Verification Code
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              disabled={isLoading}
              maxLength={OTP_LENGTH}
              className="w-full text-center text-2xl tracking-widest font-mono"
            />
            <p className="text-xs text-text-secondary">
              Enter the 6-digit code from your email
            </p>
          </div>

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-text-secondary">Minimum 8 characters</p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-md">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              isLoading ||
              !email ||
              otp.length !== OTP_LENGTH ||
              !newPassword ||
              !confirmPassword
            }
            className="w-full mt-6"
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => router.push("/student/start")}
                className="text-primary hover:underline font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="animate-pulse text-text-secondary">Loading...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
