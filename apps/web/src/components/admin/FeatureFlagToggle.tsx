"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, X, ChevronDown, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Custom Toggle Switch Component
 * Since shadcn Switch is not installed, we create a styled toggle
 */
function ToggleSwitch({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-surface-dark"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  whitelist_user_ids: string[];
  created_at: string | null;
  updated_at: string | null;
}

interface FeatureFlagToggleProps {
  flag: FeatureFlag;
  onUpdate: (
    flagId: string,
    updates: Partial<Pick<FeatureFlag, "enabled" | "rollout_percentage" | "whitelist_user_ids">>
  ) => Promise<void>;
}

export function FeatureFlagToggle({ flag, onUpdate }: FeatureFlagToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(flag.enabled);
  const [localRollout, setLocalRollout] = useState(flag.rollout_percentage);
  const [localWhitelist, setLocalWhitelist] = useState(
    flag.whitelist_user_ids.join(", ")
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleEnabledChange = (checked: boolean) => {
    setLocalEnabled(checked);
    setHasChanges(true);
  };

  const handleRolloutChange = (value: number) => {
    setLocalRollout(value);
    setHasChanges(true);
  };

  const handleWhitelistChange = (value: string) => {
    setLocalWhitelist(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Parse whitelist - split by comma, trim, filter empty
      const whitelistArray = localWhitelist
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      await onUpdate(flag.id, {
        enabled: localEnabled,
        rollout_percentage: localRollout,
        whitelist_user_ids: whitelistArray,
      });
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalEnabled(flag.enabled);
    setLocalRollout(flag.rollout_percentage);
    setLocalWhitelist(flag.whitelist_user_ids.join(", "));
    setHasChanges(false);
  };

  const getRolloutColor = (percentage: number) => {
    if (percentage === 0) return "text-text-tertiary";
    if (percentage < 25) return "text-accent";
    if (percentage < 75) return "text-warning";
    if (percentage < 100) return "text-cyan";
    return "text-success";
  };

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Main Row - Always Visible */}
      <div
        className={cn(
          "p-4 flex items-center justify-between gap-4",
          isExpanded && "border-b border-border bg-surface"
        )}
      >
        {/* Flag Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-text truncate">{flag.name}</h3>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                localEnabled
                  ? "bg-success/10 text-success"
                  : "bg-surface-dark text-text-secondary"
              )}
            >
              {localEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          {flag.description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-1">
              {flag.description}
            </p>
          )}
        </div>

        {/* Rollout Badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn("text-sm font-medium", getRolloutColor(localRollout))}
          >
            {localRollout}%
          </span>
          {flag.whitelist_user_ids.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Users className="w-3 h-3" />
              {flag.whitelist_user_ids.length}
            </span>
          )}
        </div>

        {/* Toggle & Expand */}
        <div className="flex items-center gap-3">
          <ToggleSwitch
            checked={localEnabled}
            onCheckedChange={handleEnabledChange}
            aria-label={`Toggle ${flag.name}`}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Rollout Percentage */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-text">
              Rollout Percentage: {localRollout}%
            </Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                value={localRollout}
                onChange={(e) => handleRolloutChange(parseInt(e.target.value))}
                min={0}
                max={100}
                step={1}
                className="flex-1 h-2 bg-surface-dark rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <Input
                type="number"
                value={localRollout}
                onChange={(e) => {
                  const val = Math.max(
                    0,
                    Math.min(100, parseInt(e.target.value) || 0)
                  );
                  setLocalRollout(val);
                  setHasChanges(true);
                }}
                className="w-20"
                min={0}
                max={100}
              />
            </div>
            <p className="text-xs text-text-tertiary">
              {localRollout === 0 && "Feature disabled for all non-whitelisted users"}
              {localRollout > 0 && localRollout < 100 &&
                `~${localRollout}% of users will have access (based on user ID hash)`}
              {localRollout === 100 && "Feature enabled for all users"}
            </p>
          </div>

          {/* Whitelist */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-text">
              Whitelist User IDs
            </Label>
            <Input
              value={localWhitelist}
              onChange={(e) => handleWhitelistChange(e.target.value)}
              placeholder="Enter user UUIDs separated by commas"
              className="font-mono text-sm"
            />
            <p className="text-xs text-text-tertiary">
              Whitelisted users always have access regardless of rollout percentage
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-text-tertiary pt-2 border-t border-border">
            <span>ID: <code className="bg-surface px-1 rounded">{flag.id}</code></span>
            {flag.updated_at && (
              <span>
                Updated: {new Date(flag.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
