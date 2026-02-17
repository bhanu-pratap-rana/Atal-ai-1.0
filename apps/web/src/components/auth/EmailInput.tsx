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

interface EmailInputProps {
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
}

/**
 * Reusable email input component
 * Handles email input with built-in validation feedback
 */
export function EmailInput({
  id,
  label = "Email Address",
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "you@example.com",
  helperText,
  autoFocus = false,
  required = true,
}: EmailInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="email"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoFocus={autoFocus}
        required={required}
        className="bg-surface"
        aria-label={label}
        aria-describedby={getInputDescriptionId(id, error, helperText)}
      />
      {renderErrorOrHelper(id, error, helperText)}
    </div>
  );
}
