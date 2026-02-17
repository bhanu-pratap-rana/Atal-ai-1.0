"use client";

/**
 * usePWAInstall Hook
 *
 * Handles PWA installation prompt and state.
 * Provides a way for users to manually install the app.
 *
 * Features:
 * - Captures beforeinstallprompt event
 * - Provides install() function for manual trigger
 * - Tracks installation state
 * - Works across different browsers
 */

import { useState, useEffect, useCallback } from "react";
import { clientLogger } from "@/lib/client-logger";

/**
 * Extended Window interface for PWA install prompt
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export interface UsePWAInstallReturn {
  /** Whether the app can be installed (install prompt is available) */
  canInstall: boolean;
  /** Whether the app is already installed */
  isInstalled: boolean;
  /** Whether we're currently showing the install prompt */
  isPrompting: boolean;
  /** Trigger the install prompt */
  install: () => Promise<boolean>;
  /** Dismiss the install prompt without installing */
  dismiss: () => void;
}

/**
 * Hook for managing PWA installation
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari specific check
        ("standalone" in window.navigator && (window.navigator as Navigator & { standalone: boolean }).standalone);

      if (isStandalone) {
        setIsInstalled(true);
        clientLogger.debug("[usePWAInstall] App already installed (standalone mode)");
        return;
      }
    }

    // Capture the install prompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      clientLogger.debug("[usePWAInstall] Install prompt captured", {
        platforms: e.platforms,
      });
    };

    // Track when the app is installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      clientLogger.info("[usePWAInstall] App installed successfully");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the install prompt
   * @returns true if user accepted, false otherwise
   */
  const install = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) {
      clientLogger.debug("[usePWAInstall] No install prompt available");
      return false;
    }

    setIsPrompting(true);

    try {
      // Show the install prompt
      await installPrompt.prompt();

      // Wait for the user to respond
      const choiceResult = await installPrompt.userChoice;

      clientLogger.info("[usePWAInstall] User choice", { outcome: choiceResult.outcome });

      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setInstallPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      clientLogger.error("[usePWAInstall] Install failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      setIsPrompting(false);
    }
  }, [installPrompt]);

  /**
   * Dismiss the install prompt without installing
   */
  const dismiss = useCallback(() => {
    setInstallPrompt(null);
    clientLogger.debug("[usePWAInstall] Install prompt dismissed");
  }, []);

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isPrompting,
    install,
    dismiss,
  };
}
