import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmailInputProps {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  helperText?: string
  autoFocus?: boolean
  required?: boolean
}

/**
 * Reusable email input component
 * Handles email input with built-in validation feedback
 */
export function EmailInput({
  id,
  label = 'Email Address',
  value,
  onChange,
  error,
  disabled = false,
  placeholder = 'you@example.com',
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
        className="bg-muted"
        aria-label={label}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-text-secondary">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
