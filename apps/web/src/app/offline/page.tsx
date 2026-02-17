"use client";

/**
 * Offline Fallback Page - PWA Optimized
 *
 * Displayed when the user is offline and the requested page is not cached.
 *
 * Responsive Design:
 * - Mobile (< 640px): Full-width card, compact padding
 * - Tablet (640px - 1024px): Centered card with more padding
 * - Desktop (> 1024px): Larger card with maximum content width
 *
 * Uses CSS variables with fallbacks for when globals.css isn't loaded.
 * Touch-friendly with minimum 44px tap targets (PWA best practice).
 */

// Theme fallbacks for service worker context (when globals.css may not be loaded)
// CSS variables are preferred, these are fallbacks only
const THEME = {
  surface: "#FFFBF7",
  white: "#FFFFFF",
  textPrimary: "#2D2A26",
  textSecondary: "#57534E",
  textMuted: "#A8A29E",
  primary: "#F98819",
  primaryDark: "#E07510",
  primaryLight: "#FFCFA3",
  error: "#DC2626",
  gradientPrimary: "linear-gradient(135deg, #F98819 0%, #FFAB4A 100%)",
} as const;


export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100dvh", // Dynamic viewport height for mobile browsers (fallback to 100vh)
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(1rem, 5vw, 2rem)", // Responsive padding
        fontFamily: 'var(--font-body, "Nunito", system-ui, sans-serif)',
        backgroundColor: `var(--color-surface, ${THEME.surface})`,
        // Safe area support for notched devices
        paddingTop:
          "max(env(safe-area-inset-top, 0px), clamp(1rem, 5vw, 2rem))",
        paddingBottom:
          "max(env(safe-area-inset-bottom, 0px), clamp(1rem, 5vw, 2rem))",
        paddingLeft:
          "max(env(safe-area-inset-left, 0px), clamp(1rem, 5vw, 2rem))",
        paddingRight:
          "max(env(safe-area-inset-right, 0px), clamp(1rem, 5vw, 2rem))",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "min(400px, 90vw)", // Responsive max-width
          textAlign: "center",
          padding: "clamp(1.5rem, 4vw, 2.5rem)", // Responsive card padding
          backgroundColor: `var(--color-white, ${THEME.white})`,
          borderRadius: "var(--radius-xl, 1.25rem)",
          boxShadow: "var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12))",
        }}
      >
        {/* Offline Icon - Responsive size */}
        <figure
          style={{
            fontSize: "clamp(3rem, 10vw, 4.5rem)", // 48px on mobile, 72px on desktop
            marginBottom: "clamp(0.75rem, 2vw, 1rem)",
            lineHeight: 1,
            margin: 0,
          }}
          aria-label="Offline indicator"
        >
          📡
        </figure>

        {/* Heading - Responsive typography */}
        <h1
          style={{
            fontSize: "clamp(1.25rem, 4vw, 1.75rem)", // 20px on mobile, 28px on desktop
            fontWeight: "bold",
            color: `var(--color-text-primary, ${THEME.textPrimary})`,
            marginBottom: "0.5rem",
            fontFamily: 'var(--font-display, "Baloo 2", system-ui, sans-serif)',
            lineHeight: 1.2,
          }}
        >
          You&apos;re Offline
        </h1>

        {/* Description - Responsive text */}
        <p
          style={{
            color: `var(--color-text-secondary, ${THEME.textSecondary})`,
            marginBottom: "clamp(1rem, 3vw, 1.5rem)",
            fontSize: "clamp(0.875rem, 2.5vw, 1rem)", // 14px on mobile, 16px on desktop
            lineHeight: 1.5,
            maxWidth: "30ch", // Optimal reading width
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Please check your internet connection and try again.
        </p>

        {/* Action Buttons - Touch-friendly */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {/* Primary Action - Try Again */}
          <button
            onClick={() => globalThis.location.reload()}
            style={{
              width: "100%",
              minHeight: "2.75rem", // 44px touch target (PWA requirement)
              padding: "0.75rem 1.5rem",
              background: `var(--gradient-primary, ${THEME.gradientPrimary})`,
              color: "white",
              border: "none",
              borderRadius: "var(--radius-md, 0.75rem)",
              fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(249, 136, 25, 0.25)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(249, 136, 25, 0.35)";
            }}
            onFocus={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(249, 136, 25, 0.35)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(249, 136, 25, 0.25)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(249, 136, 25, 0.25)";
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = "scale(0.98)";
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Try Again
          </button>

          {/* Secondary Action - Go Home */}
          <button
            onClick={() => {
              globalThis.location.href = "/";
            }}
            style={{
              width: "100%",
              minHeight: "2.75rem", // 44px touch target
              padding: "0.75rem 1.5rem",
              background: "transparent",
              color: `var(--color-primary, ${THEME.primary})`,
              border: `2px solid var(--color-primary, ${THEME.primary})`,
              borderRadius: "var(--radius-md, 0.75rem)",
              fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s, transform 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = `var(--color-primary-light, ${THEME.primaryLight})`;
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = `var(--color-primary-light, ${THEME.primaryLight})`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = "scale(0.98)";
              e.currentTarget.style.backgroundColor = `var(--color-primary-light, ${THEME.primaryLight})`;
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Go to Home
          </button>
        </div>

        {/* Info Text */}
        <p
          style={{
            marginTop: "clamp(1rem, 3vw, 1.5rem)",
            fontSize: "clamp(0.7rem, 2vw, 0.75rem)",
            color: `var(--color-text-muted, ${THEME.textMuted})`,
            lineHeight: 1.4,
          }}
        >
          Cached content may still be available.
          <br />
          <strong style={{ color: `var(--color-primary, ${THEME.primary})` }}>
            ATAL AI
          </strong>{" "}
          - Learning continues offline
        </p>
      </div>

      {/* Network Status Indicator (optional visual feedback) */}
      <output
        style={{
          position: "fixed",
          bottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          backgroundColor: "rgba(45, 42, 38, 0.9)",
          color: "white",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: "500",
        }}
        aria-live="polite"
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: `var(--color-error, ${THEME.error})`,
            animation: "pulse 2s infinite",
          }}
        />
        <span>No Internet Connection</span>
      </output>

      {/* Pulse animation for the status indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
