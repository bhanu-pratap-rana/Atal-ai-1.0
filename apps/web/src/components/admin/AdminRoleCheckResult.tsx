"use client";

import { AlertCircle, CheckCircle } from "lucide-react";

interface AdminRoleCheckResultProps {
  readonly isAdmin: boolean;
}

export function AdminRoleCheckResult({
  isAdmin,
}: AdminRoleCheckResultProps) {
  return (
    <div
      className={`flex gap-3 p-4 rounded-lg border ${
        isAdmin
          ? "bg-success-light border-success/30"
          : "bg-warning-light border-warning/30"
      }`}
    >
      {isAdmin ? (
        <>
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-sm text-success">
            <strong>Ready to Login!</strong>
            <br />
            <span className="text-xs">
              This user now has admin access. Go to the login page and
              enter their credentials.
            </span>
          </div>
        </>
      ) : (
        <>
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm text-warning-dark">
            <strong>Not Admin Yet</strong>
            <br />
            <span className="text-xs">
              Click &quot;Set Admin Role&quot; below to grant admin
              access to this user.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
