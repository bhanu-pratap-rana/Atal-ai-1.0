"use client";

import { useState } from "react";
import { createAdminAccount } from "@/app/actions/admin-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FORM_TIMING } from "@/lib/constants/ui-timings";
import { clientLogger } from "@/lib/client-logger";

interface AdminCreateFormProps {
  readonly onSuccess?: () => void;
  readonly adminRole?: "admin" | "super_admin";
}

/**
 * AdminCreateForm - Form to create a new admin account
 */
export function AdminCreateForm({
  onSuccess,
  adminRole = "admin",
}: AdminCreateFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateAdmin() {
    // Validation
    if (!email.trim()) {
      setMessage({ type: "error", text: "Please enter an email address" });
      return;
    }

    if (!password) {
      setMessage({ type: "error", text: "Please enter a password" });
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await createAdminAccount(
        email.trim().toLowerCase(),
        password,
        adminRole,
      );

      if (result.success) {
        setMessage({
          type: "success",
          text: `✓ Admin account created successfully for ${email}`,
        });
        toast.success(`Admin account created for ${email}`);

        // Clear form
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Call success callback after brief delay for user feedback
        if (onSuccess) {
          setTimeout(onSuccess, FORM_TIMING.successCallback);
        }
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to create admin account",
        });
        toast.error(result.error || "Failed to create admin account");
      }
    } catch (error) {
      clientLogger.error(
        "[AdminCreateForm] Error creating admin",
        error instanceof Error ? error : { error: String(error) },
      );
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="admin-email" className="text-sm font-semibold">
          Admin Email
        </Label>
        <Input
          id="admin-email"
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="focus:ring-primary focus:border-primary"
        />
        <p className="text-xs text-text-secondary">
          This email will be used to login to the admin panel
        </p>
      </div>

      {/* Password Input */}
      <PasswordInput
        id="create-password"
        label="Password"
        placeholder="Enter secure password"
        value={password}
        onChange={setPassword}
        disabled={isLoading}
        showPassword={showPassword}
        onShowPasswordChange={setShowPassword}
        helpText="Minimum 8 characters required"
        aria-describedby="password-requirements"
      />

      {/* Confirm Password Input */}
      <PasswordInput
        id="confirm-password"
        label="Confirm Password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={isLoading}
        showPassword={showPassword}
        onShowPasswordChange={setShowPassword}
      />

      {/* Message Display */}
      {message && (
        <div
          className={`flex gap-3 p-4 rounded-lg border ${
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
            className={
              message.type === "success"
                ? "text-success text-sm"
                : "text-error text-sm"
            }
          >
            {message.text}
          </span>
        </div>
      )}

      {/* Create Button */}
      <Button
        onClick={handleCreateAdmin}
        disabled={isLoading || !email.trim() || !password || !confirmPassword}
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
    </div>
  );
}
