"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PhoneInputWithPrefix } from "@/components/auth/PhoneInputWithPrefix";
import { validatePhone } from "@/lib/validation-utils";
import { requestOtp } from "@/app/actions/auth";
import {
  BaseFormComponentProps,
  useFormSubmission,
  FORM_TOAST_MESSAGES,
} from "@/lib/form-component-utils";

/**
 * PhoneOTPForm - Reusable phone OTP send form
 * Handles phone validation and OTP request via phone
 * Reduces code duplication between student and teacher auth flows
 */
export interface PhoneOTPFormProps extends BaseFormComponentProps {
  readonly phone: string;
  readonly onPhoneChange: (phone: string) => void;
  readonly onOtpSent: () => void;
  readonly helperText?: string;
}

export function PhoneOTPForm({
  phone,
  onPhoneChange,
  onOtpSent,
  isLoading,
  error,
  onErrorChange,
  submitButtonLabel = "Send OTP",
  helperText = "Enter your phone number to receive an OTP",
}: PhoneOTPFormProps) {
  const fullPhone = `+91${phone}`;

  const handleSubmit = useFormSubmission(
    async () => {
      // Validate phone
      const phoneValidation = validatePhone(fullPhone);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error || "Invalid phone number");
      }

      const result = await requestOtp(fullPhone);

      if (!result.success) {
        throw new Error(result.error || "Failed to send OTP");
      }

      toast.success(FORM_TOAST_MESSAGES.PHONE_OTP_SENT);
      return result;
    },
    onErrorChange,
    "[PhoneOTPForm]",
    () => onOtpSent(),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PhoneInputWithPrefix
        id="phone-input"
        label="Phone Number"
        value={phone}
        onChange={onPhoneChange}
        disabled={isLoading}
        error={error}
        helperText={helperText}
        required
      />

      <Button
        type="submit"
        disabled={isLoading || phone.length !== 10}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? "Sending..." : submitButtonLabel}
      </Button>
    </form>
  );
}
