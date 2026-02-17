/**
 * CreateAdminForm Component
 * Displays form for creating a new admin account
 */

import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateAdminFormProps {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly showPassword: boolean;
  readonly isLoading: boolean;
  readonly completed: boolean;
  readonly message: {
    readonly type: "success" | "error";
    readonly text: string;
  } | null;
  readonly onEmailChange: (email: string) => void;
  readonly onPasswordChange: (password: string) => void;
  readonly onConfirmPasswordChange: (password: string) => void;
  readonly onShowPasswordChange: (show: boolean) => void;
  readonly onCreate: () => Promise<void>;
  readonly onNavigateToLogin: () => void;
}

export function CreateAdminForm({
  email,
  password,
  confirmPassword,
  showPassword,
  isLoading,
  completed,
  message,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordChange,
  onCreate,
  onNavigateToLogin,
}: CreateAdminFormProps) {
  return (
    <>
      {/* Success Badge */}
      {completed && (
        <div className="bg-success-light border border-success/30 rounded-lg p-4">
          <div className="flex gap-2">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-success">
              <strong>✓ Account Created Successfully!</strong>
              <br />
              <span className="text-xs">
                You can now login with these credentials.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="create-email" className="text-sm font-semibold">
          Admin Email
        </Label>
        <Input
          id="create-email"
          type="email"
          placeholder="atal.app.ai@gmail.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isLoading || completed}
          className="focus:ring-primary focus:border-primary"
        />
        <p className="text-xs text-text-secondary">
          This email will be used to login to the admin panel
        </p>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label
          htmlFor="create-password"
          className="text-sm font-semibold"
        >
          Password (min. 8 characters)
        </Label>
        <div className="relative">
          <Input
            id="create-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter secure password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={isLoading || completed}
            className="focus:ring-primary focus:border-primary pr-10"
          />
          <button
            type="button"
            onClick={() => onShowPasswordChange(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Label
          htmlFor="confirm-password"
          className="text-sm font-semibold"
        >
          Confirm Password
        </Label>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          disabled={isLoading || completed}
          className="focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`flex gap-3 p-4 rounded-lg border whitespace-pre-wrap ${
            message.type === "success"
              ? "bg-success-light border-success/30"
              : "bg-error-light border-error/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          )}
          <span
            className={`text-sm ${
              message.type === "success" ? "text-success" : "text-error"
            }`}
          >
            {message.text}
          </span>
        </div>
      )}

      {/* Create or Go to Login Button */}
      {completed ? (
        <Button
          onClick={onNavigateToLogin}
          className="w-full bg-success hover:bg-success/90"
        >
          Go to Login Page
        </Button>
      ) : (
        <Button
          onClick={onCreate}
          disabled={
            isLoading || !email.trim() || !password || !confirmPassword
          }
          className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Admin Account"
          )}
        </Button>
      )}

      {/* Security Notice */}
      <div className="bg-warning-light border border-warning/30 rounded-lg p-4">
        <p className="text-xs text-warning-dark">
          <strong>🔒 Security:</strong> Store your admin password
          securely. You&apos;ll need it to login to the admin panel.
        </p>
      </div>
    </>
  );
}
