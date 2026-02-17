"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createAdminUser, checkAdminExists } from "@/app/actions/admin-auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminAccessDeniedState } from "@/components/admin/AdminAccessDeniedState";
import { toast } from "sonner";
import { FORM_TIMING } from "@/lib/constants/ui-timings";

export default function CreateAdminPage() {
  const [email, setEmail] = useState("");
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check if admin exists on mount
  useEffect(() => {
    async function checkAdmin() {
      const result = await checkAdminExists();
      setAdminExists(result.exists);
      setCheckingAdmin(false);
    }
    checkAdmin();
  }, []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateAdmin() {
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
      const result = await createAdminUser(
        email.trim().toLowerCase(),
        password,
      );

      if (result.success) {
        setMessage({
          type: "success",
          text: `✓ Admin account created! Email: ${email}`,
        });
        toast.success(`Admin account created for ${email}`);

        // Clear form
        setEmail("atal.app.ai@gmail.com");
        setPassword("");
        setConfirmPassword("");

        // Show next steps message after brief delay
        // SECURITY: Never display passwords in messages - recommend password manager
        setTimeout(() => {
          setMessage({
            type: "success",
            text: `✓ You can now login at /admin/login with:\nEmail: ${email}\n\nTip: Use a password manager to securely store your credentials.`,
          });
        }, FORM_TIMING.nextStepsDelay);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to create admin account",
        });
        toast.error(result.error || "Failed to create admin account");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading while checking admin status
  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-text-secondary">Checking system status...</p>
        </div>
      </div>
    );
  }

  // Show access denied if admin already exists
  if (adminExists) {
    return (
      <AdminAccessDeniedState
        onNavigateToLogin={() => {
          globalThis.location.href = "/admin/login";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button
          onClick={() => (globalThis.location.href = "/admin/login")}
          variant="outline"
          size="sm"
          className="text-sm border-primary text-primary hover:bg-primary/10"
        >
          ← Back to Login
        </Button>
      </div>

      <AuthCard
        title="Create Admin Account"
        description="Create a new admin user account for system access"
      >
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-cyan-lightest border border-cyan/30 rounded-lg p-4">
            <p className="text-sm text-cyan-darkest">
              <strong>ℹ️ First Time Setup:</strong>
              <br />
              <span className="text-xs">
                Create the first super admin account. This account will have
                full system access and can create additional admin accounts.
              </span>
            </p>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-semibold">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="atal.app.ai@gmail.com"
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
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-sm font-semibold">
              Password (min. 8 characters)
            </Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="focus:ring-primary focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              Use a strong, unique password
            </p>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-semibold">
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
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

          {/* Create Button */}
          <Button
            onClick={handleCreateAdmin}
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

          {/* Security Notice */}
          <div className="bg-warning-light border border-warning/30 rounded-lg p-4">
            <p className="text-xs text-warning-dark">
              <strong>🔒 Security:</strong> Store your admin password securely.
              You&apos;ll need it to login to the admin panel.
            </p>
          </div>

          {/* Instructions Box */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-sm text-text-primary font-semibold mb-2">
              📋 Next Steps:
            </p>
            <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
              <li>Create admin account with email and password</li>
              <li>Go to /admin/login</li>
              <li>Enter the email and password you just created</li>
              <li>Access the admin panel</li>
            </ol>
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
