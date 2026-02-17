"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateEmail } from "@/lib/validation-utils";
import { requestOtp } from "@/app/actions/auth";
import { FormErrorHelper } from "@/components/form/FormErrorHelper";
import {
  BaseFormComponentProps,
  useFormSubmission,
  FORM_TOAST_MESSAGES,
} from "@/lib/form-component-utils";

/**
 * EmailOTPForm - Reusable email OTP send form
 * Handles email validation and OTP request
 * Reduces code duplication between student and teacher auth flows
 */
export interface EmailOTPFormProps extends BaseFormComponentProps {
  readonly email: string;
  readonly onEmailChange: (email: string) => void;
  readonly onOtpSent: () => void;
  readonly helperText?: string;
}

export function EmailOTPForm({
  email,
  onEmailChange,
  onOtpSent,
  isLoading,
  error,
  onErrorChange,
  submitButtonLabel = "Send OTP",
  helperText = "Enter your email to receive an OTP",
}: EmailOTPFormProps) {
  const handleSubmit = useFormSubmission(
    async () => {
      // Validate email
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error || "Invalid email");
      }

      const result = await requestOtp(email.trim());

      if (!result.success) {
        throw new Error(result.error || "Failed to send OTP");
      }

      toast.success(FORM_TOAST_MESSAGES.EMAIL_OTP_SENT);
      return result;
    },
    onErrorChange,
    "[EmailOTPForm]",
    () => onOtpSent(),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-input">Email Address</Label>
        <Input
          id="email-input"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading}
          required
          aria-describedby={error ? "email-error" : "email-helper"}
        />
        <FormErrorHelper
          error={error}
          helperText={helperText}
          errorId="email-error"
          helperId="email-helper"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? "Sending..." : submitButtonLabel}
      </Button>
    </form>
  );
}
