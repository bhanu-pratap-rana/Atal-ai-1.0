import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhoneInputWithPrefixProps {
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
  prefix?: string
  maxLength?: number
}

/**
 * Reusable phone input component with country prefix
 * Shows +91 prefix for Indian phone numbers
 */
export function PhoneInputWithPrefix({
  id,
  label = 'Phone Number',
  value,
  onChange,
  error,
  disabled = false,
  placeholder = '9876543210',
  helperText = 'Enter 10-digit phone number',
  autoFocus = false,
  required = true,
  prefix = '+91',
  maxLength = 10,
}: PhoneInputWithPrefixProps) {
  // Only allow numeric input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '').slice(0, maxLength)
    onChange(numericValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div className="flex items-center px-3 bg-muted border border-input rounded-md min-w-fit">
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
          className="bg-muted"
          aria-label={label}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : (
        <p id={`${id}-helper`} className="text-xs text-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  )
}
