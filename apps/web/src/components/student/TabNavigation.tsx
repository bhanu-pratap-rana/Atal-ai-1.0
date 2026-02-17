"use client";

import { cn } from "@/lib/utils";

/**
 * ATAL AI TabNavigation Component - Jyoti Theme
 *
 * STRICT RULES:
 * - Active tab: PRIMARY background with white text
 * - Inactive tab: surface background with text-secondary
 */

interface Tab {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

interface TabNavigationProps {
  readonly tabs: Tab[];
  readonly activeTab: string;
  readonly onTabChange: (tabId: string) => void;
  readonly disabled?: boolean;
  readonly size?: "sm" | "default" | "lg";
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  disabled = false,
  size = "default",
}: TabNavigationProps) {
  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs",
    default: "py-2 px-4 text-sm",
    lg: "py-3 px-5 text-base",
  };

  return (
    <div
      className="flex gap-2 p-1 bg-surface rounded-xl"
      role="tablist"
      aria-label="Navigation tabs"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-disabled={disabled || tab.disabled}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          className={cn(
            "flex-1 rounded-lg font-medium transition-all duration-200",
            sizeClasses[size],
            activeTab === tab.id
              ? "bg-gradient-primary text-white shadow-sm"
              : "bg-transparent text-text-secondary hover:bg-white hover:text-text-primary",
            (disabled || tab.disabled) && "opacity-50 cursor-not-allowed",
          )}
          disabled={disabled || tab.disabled}
        >
          {tab.icon && (
            <span className="mr-1.5" aria-hidden="true">
              {tab.icon}
            </span>
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
