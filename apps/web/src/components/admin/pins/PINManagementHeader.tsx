/**
 * PINManagementHeader Component
 * Displays header with navigation and sign out button
 */

import { LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PINManagementHeaderProps {
  readonly isSuperAdmin: boolean;
  readonly onSignOut: () => Promise<void>;
  readonly onDashboardClick: () => void;
}

export function PINManagementHeader({
  isSuperAdmin,
  onSignOut,
  onDashboardClick,
}: PINManagementHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-text">School PIN Management</h1>

        <div className="flex items-center gap-4">
          {isSuperAdmin && (
            <Button
              onClick={onDashboardClick}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </Button>
          )}

          <Button
            onClick={onSignOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
