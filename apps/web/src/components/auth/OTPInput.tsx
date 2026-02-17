import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInputDescriptionId } from "@/lib/form-utils";

/**
 * Render error or helper text
 */
function renderErrorOrHelper(
  id: string,
  error: string | undefined,
  helperText: string | undefined,
): React.ReactNode {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-sm text-error" role="alert">
        {error}
      </p>
    );
  }
  if (helperText) {
    return (
      <p id={`${id}-helper`} className="text-xs text-text-secondary">
        {helperText}
      </p>
    );
  }
  return null;
}

interface OTPInputProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly maxLength?: number;
  readonly helperText?: string;
  readonly autoFocus?: boolean;
}

/**
 * Reusable OTP input component for email/phone verification
 * Handles formatting and validation of 6-digit OTP codes
 */
export function OTPInput({
  id,
  label,
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "123456",
  maxLength = 6,
  helperText = "Enter the 6-digit code",
  autoFocus = false,
}: OTPInputProps) {
  // Only allow numeric input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replaceAll(/\D/g, "").slice(0, maxLength);
    onChange(numericValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={maxLength}
        autoFocus={autoFocus}
        required
        className="text-center text-2xl font-mono tracking-widest"
        aria-label={label}
        aria-describedby={getInputDescriptionId(id, error, helperText)}
      />
      {renderErrorOrHelper(id, error, helperText)}
    </div>
  );
}
