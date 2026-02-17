"use client";

import { useEffect } from "react";
import { clientLogger } from "@/lib/client-logger";

/**
 * ServiceWorkerRegistrar
 *
 * Registers the service worker at app root for PWA installability and offline support.
 * Uses the native Next.js 16 approach (manual public/sw.js, no next-pwa dependency).
 */
export function BackgroundSyncInitializer() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        clientLogger.info("[SW] Service Worker registered", {
          scope: registration.scope,
        });
      })
      .catch((error) => {
        clientLogger.warn("[SW] Registration failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, []);

  return null;
}
