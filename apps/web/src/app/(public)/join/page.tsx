"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import { useOTPInput } from "@/hooks/useOTPInput";
import { OTP_LENGTH, PHONE_DIGIT_LENGTH } from "@/lib/auth-constants";
import { clientLogger } from "@/lib/client-logger";
import {
  handleSendOTP as sendOTPHandler,
  handleVerifyOTP as verifyOTPHandler,
} from "@/lib/auth-handlers";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinClass, previewClass } from "@/app/actions/student";

// ========================================
// STEP 1: AUTH SELECTION
// ========================================
function AuthSelectionStep({
  onPhoneAuth,
  onAnonymousAuth,
}: Readonly<{
  onPhoneAuth: () => void;
  onAnonymousAuth: () => void;
}>) {
  return (
    <AuthCard
      title="Join Class"
      description="Choose how you'd like to continue"
    >
      <div className="space-y-4">
        <div className="bg-surface/50 p-4 rounded-lg border border-border">
          <p className="text-sm text-text-secondary mb-4">
            You need to sign in first to join a class. Choose one of the options
            below:
          </p>
        </div>

        <Button
          onClick={onPhoneAuth}
          className="w-full h-14 text-base text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5 transition-all"
          variant="default"
        >
          <span className="text-xl mr-2">📱</span>
          <span>Continue with Phone (OTP)</span>
        </Button>

        <Button
          onClick={onAnonymousAuth}
          className="w-full h-14 text-base text-[17px] border-2 hover:border-primary hover:shadow-[var(--shadow-primary-sm)] hover:-translate-y-0.5 transition-all"
          variant="outline"
        >
          <span className="text-xl mr-2">👤</span>
          <span>Continue as Guest</span>
        </Button>

        <div className="bg-cyan-lightest border-l-4 border-cyan p-3 rounded-xl">
          <p className="text-xs text-cyan-darkest">
            <strong>💡 Guest Access:</strong> You can join as a guest and
            upgrade your account later by adding a phone number or email.
          </p>
        </div>

        <div className="text-center pt-2">
          <a
            href="/student/start"
            className="text-sm text-primary hover:underline"
          >
            Already have an account with email? Sign in here
          </a>
        </div>
      </div>
    </AuthCard>
  );
}

// ========================================
// STEP 2: PHONE OTP SIGN-IN
// ========================================
function PhoneOTPStep({
  onComplete,
  onBack,
  loading,
}: Readonly<{
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
}>) {
  const supabase = createClient();
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [stepLoading, setStepLoading] = useState(false);
  const phoneInput = usePhoneInput();
  const otpInput = useOTPInput();

  async function handleSendOTPClick(e: React.FormEvent) {
    e.preventDefault();
    setStepLoading(true);

    try {
      const result = await sendOTPHandler(
        supabase,
        phoneInput.fullValue,
        "phone",
      );

      if (result.success) {
        toast.success("OTP sent to your phone!");
        setStep("verify");
      } else {
        toast.error(result.error || "Failed to send OTP");
      }
    } catch (error) {
      clientLogger.error(
        "[JoinClass] Failed to send OTP",
        error instanceof Error ? error : { error },
      );
      toast.error("Failed to send OTP");
    } finally {
      setStepLoading(false);
    }
  }

  async function handleVerifyOTPClick(e: React.FormEvent) {
    e.preventDefault();
    setStepLoading(true);

    try {
      const result = await verifyOTPHandler(
        supabase,
        { phone: phoneInput.fullValue },
        otpInput.value,
        "sms",
      );

      if (result.success) {
        toast.success("Phone verified! 🎉");
        onComplete();
      } else {
        toast.error(result.error || "Failed to verify OTP");
      }
    } catch (error) {
      clientLogger.error(
        "[JoinClass] Failed to verify OTP",
        error instanceof Error ? error : { error },
      );
      toast.error("Failed to verify OTP");
    } finally {
      setStepLoading(false);
    }
  }

  if (step === "verify") {
    return (
      <AuthCard
        title="Verify OTP"
        description={`Enter the 6-digit code sent to ${phoneInput.fullValue}`}
      >
        <form onSubmit={handleVerifyOTPClick} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={otpInput.value}
              onChange={(e) => otpInput.onChange(e.target.value)}
              required
              disabled={stepLoading || loading}
              maxLength={OTP_LENGTH}
              className="text-center text-2xl font-mono tracking-widest"
            />
            <p className="text-xs text-text-secondary">
              Enter the 6-digit code sent to your phone
            </p>
          </div>

          <Button
            type="submit"
            className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
            disabled={
              stepLoading || loading || otpInput.value.length !== OTP_LENGTH
            }
            loading={stepLoading || loading}
          >
            <span>Verify & Continue</span>
            <span className="ml-2">→</span>
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleSendOTPClick}
              className="text-sm text-primary hover:text-primary-dark hover:underline block w-full"
              disabled={stepLoading || loading}
            >
              Resend OTP
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="text-sm text-primary hover:underline block w-full"
              disabled={stepLoading || loading}
            >
              Change phone number
            </button>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-text-secondary hover:underline block w-full"
              disabled={stepLoading || loading}
            >
              Back to options
            </button>
          </div>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Phone Sign-in"
      description="Enter your phone number to receive an OTP"
    >
      <form onSubmit={handleSendOTPClick} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex items-center border border-input rounded-md">
            <span className="px-3 text-text-secondary font-medium bg-surface">
              +91
            </span>
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              value={phoneInput.displayValue}
              onChange={(e) => phoneInput.onChange(e.target.value)}
              required
              disabled={stepLoading || loading}
              className="border-0 flex-1"
              maxLength={12}
            />
          </div>
          <p className="text-xs text-text-secondary">
            Enter your 10-digit phone number
          </p>
        </div>

        <div className="bg-cyan-lightest border-l-4 border-cyan p-3 rounded-xl">
          <p className="text-xs text-cyan-darkest">
            <strong>📱 SMS Verification:</strong> You&apos;ll receive a 6-digit
            code via SMS. Standard rates may apply.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
          disabled={
            stepLoading ||
            loading ||
            phoneInput.displayValue.length < PHONE_DIGIT_LENGTH
          }
          loading={stepLoading || loading}
        >
          <span>Send OTP</span>
          <span className="ml-2">→</span>
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-text-secondary hover:underline block w-full"
            disabled={stepLoading || loading}
          >
            Back to options
          </button>
        </div>
      </form>
    </AuthCard>
  );
}

// ========================================
// CLASS PREVIEW INTERFACE
// ========================================
interface ClassPreviewData {
  className: string;
  teacherName: string;
  subject: string | null;
  studentCount: number;
}

// ========================================
// STEP 3: JOIN CLASS FORM (WITH PREVIEW)
// ========================================
function JoinClassForm({
  initialCode,
  initialPin,
}: Readonly<{
  initialCode?: string;
  initialPin?: string;
}>) {
  const router = useRouter();
  const [classCode, setClassCode] = useState(initialCode || "");
  const [pin, setPin] = useState(initialPin || "");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<ClassPreviewData | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Preview class when code is complete (6 characters)
  async function handlePreviewClass() {
    if (classCode.length !== 6) return;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);

    try {
      const result = await previewClass(classCode.toUpperCase().trim());

      if (result?.success && result?.data) {
        setPreview(result.data);
      } else {
        setPreviewError(result?.error || "Class not found");
      }
    } catch (error) {
      clientLogger.error(
        "[JoinClass] Failed to preview class",
        error instanceof Error ? error : { error },
      );
      setPreviewError("Failed to lookup class");
    } finally {
      setPreviewLoading(false);
    }
  }

  // Auto-preview when code changes and becomes complete
  useEffect(() => {
    if (classCode.length === 6) {
      handlePreviewClass();
    } else {
      setPreview(null);
      setPreviewError(null);
      setShowConfirm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // If we have a preview but haven't confirmed yet, show confirmation
    if (preview && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);

    try {
      const result = await joinClass({
        classCode: classCode.toUpperCase().trim(),
        pin: pin.trim(),
      });

      if (result.success) {
        toast.success("Successfully joined class!");
        router.push("/app/student/classes");
      } else {
        toast.error(result.error || "Failed to join class");
      }
    } catch (error) {
      clientLogger.error(
        "[JoinClass] Failed to join class",
        error instanceof Error ? error : { error },
      );
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Join Class"
      description="Enter the class code and PIN provided by your teacher"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="class-code">Class Code</Label>
          <Input
            id="class-code"
            type="text"
            placeholder="A3F7E2"
            value={classCode}
            onChange={(e) => {
              setClassCode(e.target.value.toUpperCase());
              setShowConfirm(false);
            }}
            required
            disabled={loading}
            maxLength={6}
            className="uppercase font-mono text-center text-xl tracking-widest"
          />
          <p className="text-xs text-text-secondary">
            6-character code provided by your teacher
          </p>
        </div>

        {/* Class Preview Section */}
        {previewLoading && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-text-secondary">
                Looking up class...
              </span>
            </div>
          </div>
        )}

        {previewError && (
          <div className="bg-error-light border-l-4 border-error p-3 rounded">
            <p className="text-sm text-error-dark">{previewError}</p>
          </div>
        )}

        {preview && (
          <div className="bg-success-light border border-success/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-success text-lg">✓</span>
              <span className="font-medium text-success-dark">
                Class Found!
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Class Name:</span>
                <span className="font-medium text-text-primary">
                  {preview.className}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Teacher:</span>
                <span className="font-medium text-text-primary">
                  {preview.teacherName}
                </span>
              </div>
              {preview.subject && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subject:</span>
                  <span className="font-medium text-text-primary">
                    {preview.subject}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Students:</span>
                <span className="font-medium text-text-primary">
                  {preview.studentCount} enrolled
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="pin">Class PIN</Label>
          <Input
            id="pin"
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replaceAll(/\D/g, "").slice(0, 4));
              setShowConfirm(false);
            }}
            required
            disabled={loading}
            maxLength={4}
            className="text-center text-2xl font-mono tracking-widest"
          />
          <p className="text-xs text-text-secondary">
            4-digit PIN provided by your teacher
          </p>
        </div>

        {/* Confirmation Message */}
        {showConfirm && preview && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-sm text-primary-dark text-center">
              Ready to join <strong>{preview.className}</strong> with{" "}
              {preview.teacherName}?
            </p>
          </div>
        )}

        <div className="bg-info-light border-l-4 border-info p-3 rounded">
          <p className="text-xs text-info-dark">
            <strong>Note:</strong> Your roll number from your profile will be
            used to identify you in the class roster.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full text-[17px] shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-hover)] hover:-translate-y-0.5"
          disabled={
            loading ||
            classCode?.length !== 6 ||
            pin.length !== 4 ||
            !preview
          }
          loading={loading}
        >
          <span>{showConfirm ? "Confirm & Join Class" : "Join Class"}</span>
          <span className="ml-2">→</span>
        </Button>
      </form>
    </AuthCard>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================
function JoinPageContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeFromUrl = searchParams.get("code");
  const pinFromUrl = searchParams.get("pin");
  const viaInvite = searchParams.get("via") === "invite";

  const [authState, setAuthState] = useState<
    "loading" | "unauthenticated" | "authenticated"
  >("loading");
  const [authMethod, setAuthMethod] = useState<
    "selection" | "phone" | "complete"
  >("selection");
  const [loading, setLoading] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setAuthState("authenticated");
        setAuthMethod("complete");
      } else {
        setAuthState("unauthenticated");

        // If not via invite link, redirect to student start page
        if (!viaInvite && !codeFromUrl) {
          router.push("/student/start");
        }
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, viaInvite, codeFromUrl]);

  // Handle anonymous sign-in
  async function handleAnonymousAuth() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Signed in as guest!");
        setAuthMethod("complete");
        setAuthState("authenticated");
      }
    } catch (error) {
      clientLogger.error(
        "[JoinClass] Failed to sign in as guest",
        error instanceof Error ? error : { error },
      );
      toast.error("Failed to sign in as guest");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (authState === "loading") {
    return (
      <AuthCard title="Join Class" description="Loading...">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthCard>
    );
  }

  // Already authenticated - show join form
  if (authState === "authenticated" && authMethod === "complete") {
    return (
      <JoinClassForm
        initialCode={codeFromUrl || undefined}
        initialPin={pinFromUrl || undefined}
      />
    );
  }

  // Not authenticated - show auth options
  if (authMethod === "selection") {
    return (
      <AuthSelectionStep
        onPhoneAuth={() => setAuthMethod("phone")}
        onAnonymousAuth={handleAnonymousAuth}
      />
    );
  }

  // Phone OTP flow
  if (authMethod === "phone") {
    return (
      <PhoneOTPStep
        onComplete={() => {
          setAuthMethod("complete");
          setAuthState("authenticated");
        }}
        onBack={() => setAuthMethod("selection")}
        loading={loading}
      />
    );
  }

  // Fallback
  return (
    <JoinClassForm
      initialCode={codeFromUrl || undefined}
      initialPin={pinFromUrl || undefined}
    />
  );
}

export default function JoinClassPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Join Class" description="Loading...">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AuthCard>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
