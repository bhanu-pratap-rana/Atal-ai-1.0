/**
 * SchoolDetailCard Component
 * Displays selected school information and PIN status
 */

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SchoolPINInfo } from "@/app/actions/admin-pin-management";

interface SchoolDetailCardProps {
  readonly school: SchoolPINInfo;
  readonly onCopyCode: () => Promise<void>;
  readonly copied: boolean;
}

export function SchoolDetailCard({
  school,
  onCopyCode,
  copied,
}: SchoolDetailCardProps) {
  return (
    <div className="bg-success-light border-l-4 border-success rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-success mb-2">{school.schoolName}</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm text-text-secondary">School Code:</p>
              <p className="text-sm font-mono text-text">{school.schoolCode}</p>
            </div>
            {school.districtName && (
              <p className="text-sm text-text-secondary">
                District: {school.districtName}
              </p>
            )}

            {/* PIN Status */}
            <div className="mt-3 pt-3 border-t border-success/20">
              {school.currentPin ? (
                <div>
                  <p className="text-xs text-success font-medium mb-1">
                    ✓ PIN Configured
                  </p>
                  <p className="text-xs text-text-secondary">
                    Created:{" "}
                    {new Date(school.createdAt).toLocaleDateString()}
                  </p>
                  {school.lastRotatedAt && (
                    <p className="text-xs text-text-secondary">
                      Last rotated:{" "}
                      {new Date(school.lastRotatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-warning font-medium">
                  ⚠ No PIN configured
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={onCopyCode}
          variant="ghost"
          size="sm"
          className="flex-shrink-0"
        >
          {copied ? (
            <Check size={18} className="text-success" />
          ) : (
            <Copy size={18} />
          )}
        </Button>
      </div>
    </div>
  );
}
