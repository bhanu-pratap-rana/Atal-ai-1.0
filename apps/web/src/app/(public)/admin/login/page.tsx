"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ArrowRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { clientLogger } from "@/lib/client-logger";

/**
 * ATAL AI Admin Login Page - Jyoti Theme
 *
 * Rule.md Compliant: Uses CSS variable classes from globals.css
 * NO hardcoded hex values - all colors via design tokens
 */

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [hasNonAdminSession, setHasNonAdminSession] = useState(false);

  // Check if already authenticated as admin - only redirect if already an admin
  // Non-admin users should stay on this page to login with admin credentials
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        const role = user.app_metadata?.role as string;
        // Only redirect if already logged in as admin/super_admin
        if (role === "admin" || role === "super_admin") {
          setHasSession(true);
          if (role === "super_admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/admin/pins");
          }
        }
        // If logged in as teacher/student, show sign out option
        // They need to sign out first or use different admin credentials
        setHasNonAdminSession(true);
      }
    }
    checkAuth();
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setHasNonAdminSession(false);
    toast.success("Signed out successfully");
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim()) {
        setError("Email is required");
        setIsLoading(false);
        return;
      }

      if (!password) {
        setError("Password is required");
        setIsLoading(false);
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError || !data.user) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      const user = data.user;
      const role = user.app_metadata?.role as string | undefined;

      clientLogger.info("Admin login - user role check", {
        email: user.email,
        role: role,
        app_metadata: user.app_metadata,
      });

      const isAdmin = role === "admin" || role === "super_admin";

      if (!isAdmin) {
        await supabase.auth.signOut();
        setError("This account does not have admin access");
        setIsLoading(false);
        return;
      }

      toast.success("Admin login successful!");
      if (role === "super_admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/admin/pins");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      clientLogger.error("Admin login error", { error: error });
    } finally {
      setIsLoading(false);
    }
  }

  if (hasSession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Button onClick={() => router.push("/")} variant="outline" size="sm">
          ← Back
        </Button>
      </div>

      <AuthCard
        title="Admin Login"
        description="Enter your admin credentials to access the administrative panel"
      >
        <form onSubmit={handleAdminLogin} className="space-y-6">
          {/* Admin Icon - Primary Light Background */}
          <div className="flex justify-center">
            <div className="bg-primary-light p-4 rounded-xl border-2 border-primary/20">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Non-Admin Session Warning */}
          {hasNonAdminSession && (
            <div className="bg-warning-light border border-warning rounded-xl p-4">
              <p className="text-warning-dark text-sm mb-2">
                <strong>Already logged in as teacher/student</strong>
              </p>
              <p className="text-xs text-warning-dark mb-3">
                Sign out first, then login with admin credentials.
              </p>
              <Button
                type="button"
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out Current Session
              </Button>
            </div>
          )}

          {/* Error Message - Error Semantic Color */}
          {error && (
            <div className="bg-error-light border border-error rounded-xl p-4">
              <span className="text-error-dark text-sm">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label
              htmlFor="admin-email"
              className="text-sm font-semibold text-text-primary"
            >
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-text-tertiary">
              Example: atal.app.ai@gmail.com
            </p>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="admin-password"
              className="text-sm font-semibold text-text-primary"
            >
              Password
            </Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-text-tertiary">
              Enter your secure admin password
            </p>
          </div>

          {/* Login Button - Primary Gradient */}
          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? "Logging in..." : "Login as Admin"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Security Notice - Warning Style with Primary */}
          <div className="bg-primary-light border-l-4 border-primary p-4 rounded-xl">
            <p className="text-sm text-primary-dark">
              <strong>🔒 Security Notice</strong>
              <br />
              <span className="text-xs">
                Admin access is restricted. Only accounts with admin role can
                login here.
              </span>
            </p>
          </div>

          {/* Info Box - Info Semantic Color */}
          <div className="bg-info-light border border-info rounded-xl p-4">
            <p className="text-sm text-info-dark">
              <strong>👤 Default Admin:</strong>
              <br />
              <span className="text-xs font-mono">atal.app.ai@gmail.com</span>
              <br />
              <span className="text-xs">
                Contact system administrator if you don&apos;t have admin
                credentials
              </span>
            </p>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}
