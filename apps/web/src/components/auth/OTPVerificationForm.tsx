"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/auth/OTPInput";
import {
  BaseFormComponentProps,
  useFormSubmission,
  FORM_TOAST_MESSAGES,
} from "@/lib/form-component-utils";

/**
 * OTPVerificationForm - Reusable OTP verification form
 * Handles OTP input and verification logic
 * Reduces code duplication between different auth flows
 */
export interface OTPVerificationFormProps extends BaseFormComponentProps {
  readonly otp: string;
  readonly onOtpChange: (otp: string) => void;
  readonly onSubmit: (otp: string) => Promise<void>;
  readonly label?: string;
  readonly helperText?: string;
}

export function OTPVerificationForm({
  otp,
  onOtpChange,
  isLoading,
  error,
  onErrorChange,
  onSubmit,
  submitButtonLabel = "Verify OTP",
  label = "OTP Code",
  helperText = "Enter the 6-digit code sent to your email",
}: OTPVerificationFormProps) {
  const handleSubmit = useFormSubmission(
    async () => {
      if (otp.length !== 6) {
        throw new Error("OTP must be 6 digits");
      }

      await onSubmit(otp);
      toast.success(FORM_TOAST_MESSAGES.OTP_VERIFIED);
    },
    onErrorChange,
    "[OTPVerificationForm]",
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp-input">{label}</Label>
        <OTPInput
          id="otp-input"
          label={label}
          value={otp}
          onChange={onOtpChange}
          disabled={isLoading}
          error={error}
          helperText={helperText}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || otp.length !== 6}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? "Verifying..." : submitButtonLabel}
      </Button>
    </form>
  );
}
