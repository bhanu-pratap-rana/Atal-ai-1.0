import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OTPInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  helperText?: string
  autoFocus?: boolean
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
  placeholder = '123456',
  maxLength = 6,
  helperText = 'Enter the 6-digit code',
  autoFocus = false,
}: OTPInputProps) {
  // Only allow numeric input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '').slice(0, maxLength)
    onChange(numericValue)
  }

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
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
      />
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
