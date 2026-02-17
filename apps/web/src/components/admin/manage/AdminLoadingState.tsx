/**
 * AdminLoadingState Component
 * Displays loading screen while checking authorization
 */

import { Loader2 } from "lucide-react";

export function AdminLoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-text-secondary">Verifying authorization...</p>
      </div>
    </div>
  );
}
