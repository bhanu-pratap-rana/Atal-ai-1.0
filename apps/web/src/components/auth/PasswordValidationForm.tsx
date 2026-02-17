"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation-utils";
import {
  BaseFormComponentProps,
  useFormSubmission,
  usePasswordVisibility,
} from "@/lib/form-component-utils";
import { Eye, EyeOff } from "lucide-react";

/**
 * Get password visibility toggle icon
 */
function getPasswordVisibilityIcon(isVisible: boolean): React.ReactNode {
  if (isVisible) {
    return <EyeOff className="w-4 h-4" />;
  }
  return <Eye className="w-4 h-4" />;
}

/**
 * PasswordValidationForm - Reusable password validation form
 * Handles password and confirm password input with validation
 * Reduces code duplication in auth flows
 */
export interface PasswordValidationFormProps extends BaseFormComponentProps {
  readonly password: string;
  readonly onPasswordChange: (password: string) => void;
  readonly passwordConfirm: string;
  readonly onPasswordConfirmChange: (password: string) => void;
  readonly onSubmit: () => Promise<void>;
  readonly submitButtonLabel?: string;
  readonly showValidation?: boolean;
}

export function PasswordValidationForm({
  password,
  onPasswordChange,
  passwordConfirm,
  onPasswordConfirmChange,
  isLoading,
  error,
  onErrorChange,
  onSubmit,
  submitButtonLabel = "Create Account",
  showValidation = true,
}: PasswordValidationFormProps) {
  const {
    showPassword,
    showConfirm,
    togglePasswordVisibility,
    toggleConfirmVisibility,
  } = usePasswordVisibility();

  const handleSubmit = useFormSubmission(
    async () => {
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(
          passwordValidation.errors.join(", ") || "Invalid password",
        );
      }

      // Validate password match
      const matchValidation = validatePasswordMatch(password, passwordConfirm);
      if (!matchValidation.valid) {
        throw new Error(matchValidation.error || "Passwords do not match");
      }

      await onSubmit();
    },
    onErrorChange,
    "[PasswordValidationForm]",
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password-input">Password</Label>
        <div className="relative">
          <Input
            id="password-input"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password (min. 8 characters)"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={isLoading}
            required
            aria-describedby={error ? "password-error" : "password-helper"}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {getPasswordVisibilityIcon(showPassword)}
          </button>
        </div>
        {showValidation && (
          <p className="text-xs text-text-secondary">
            Minimum 8 characters, must include uppercase, lowercase, number, and
            special character (!@#$%^&*)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password-input">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password-input"
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm your password"
            value={passwordConfirm}
            onChange={(e) => onPasswordConfirmChange(e.target.value)}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            onClick={toggleConfirmVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {getPasswordVisibilityIcon(showConfirm)}
          </button>
        </div>
      </div>

      {error && (
        <p id="password-error" className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        aria-busy={isLoading}
      >
        {isLoading ? "Processing..." : submitButtonLabel}
      </Button>
    </form>
  );
}
