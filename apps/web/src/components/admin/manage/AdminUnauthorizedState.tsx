/**
 * AdminUnauthorizedState Component
 * Displays access denied message for non-super-admin users
 */

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/AuthCard";

export function AdminUnauthorizedState() {
  const redirectToLogin = () => {
    globalThis.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button
          onClick={redirectToLogin}
          variant="outline"
          size="sm"
          className="text-sm border-primary text-primary hover:bg-primary/10"
        >
          ← Back to Login
        </Button>
      </div>

      <AuthCard
        title="Access Denied"
        description="Super admin access required"
      >
        <div className="space-y-6">
          <div className="bg-error-light border border-error/30 rounded-lg p-4">
            <div className="flex gap-3">
              <ShieldAlert className="w-6 h-6 text-error flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-error">
                  Unauthorized Access
                </p>
                <p className="text-xs text-error/80 mt-1">
                  This page requires super admin privileges. Only super admins
                  can delete users and manage admin accounts.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-sm text-text-primary font-semibold mb-2">
              What to do:
            </p>
            <ul className="text-xs text-text-secondary space-y-1 list-disc list-inside">
              <li>
                Sign in with a super admin account at{" "}
                <strong>/admin/login</strong>
              </li>
              <li>Contact your system administrator for access</li>
            </ul>
          </div>

          <Button
            onClick={redirectToLogin}
            className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary"
          >
            Go to Admin Login
          </Button>
        </div>
      </AuthCard>
    </div>
  );
}
