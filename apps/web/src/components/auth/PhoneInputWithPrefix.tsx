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
  return (
    <p id={`${id}-helper`} className="text-xs text-text-secondary">
      {helperText}
    </p>
  );
}

interface PhoneInputWithPrefixProps {
  readonly id: string;
  readonly label?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly helperText?: string;
  readonly autoFocus?: boolean;
  readonly required?: boolean;
  readonly prefix?: string;
  readonly maxLength?: number;
}

/**
 * Reusable phone input component with country prefix
 * Shows +91 prefix for Indian phone numbers
 */
export function PhoneInputWithPrefix({
  id,
  label = "Phone Number",
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "9876543210",
  helperText = "Enter 10-digit phone number",
  autoFocus = false,
  required = true,
  prefix = "+91",
  maxLength = 10,
}: PhoneInputWithPrefixProps) {
  // Only allow numeric input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replaceAll(/\D/g, "").slice(0, maxLength);
    onChange(numericValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div className="flex items-center px-3 bg-surface border border-input rounded-md min-w-fit">
          <span className="font-semibold text-text-primary">{prefix}</span>
        </div>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          maxLength={maxLength}
          autoFocus={autoFocus}
          required={required}
          className="bg-surface"
          aria-label={label}
          aria-describedby={getInputDescriptionId(id, error, helperText)}
        />
      </div>
      {renderErrorOrHelper(id, error, helperText)}
    </div>
  );
}
