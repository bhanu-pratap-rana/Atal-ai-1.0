import type { Metadata } from "next";
import {
  Nunito,
  Noto_Sans_Devanagari,
  Noto_Sans_Bengali,
} from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import { GlobalErrorBoundary } from "@/components/errors/GlobalErrorBoundary";
import { LanguageProvider } from "@/lib/i18n";
import "./globals.css";

/* ============================================
   ATAL AI - Jyoti Theme Typography
   
   Font Stack:
   - Display: Baloo 2 (headings, titles)
   - Body: Nunito (paragraphs, UI text)
   - Hindi: Noto Sans Devanagari
   - Assamese: Noto Sans Bengali
   ============================================ */

// Primary body font - Nunito (friendly, readable)
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Hindi font - Noto Sans Devanagari
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  display: "swap",
});

// Assamese font - Noto Sans Bengali
const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ATAL AI - Digital Empowerment Platform",
  description:
    "Empowering education through AI & technology - Jyoti (ज्योति) brings light to learning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ATAL AI",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    "ATAL AI",
    "digital literacy",
    "education",
    "India",
    "Northeast",
    "Jyoti",
  ],
  authors: [{ name: "ATAL AI Team" }],
};

// Viewport configuration for PWA
// NOTE: themeColor requires a static hex value (CSS variables not supported by PWA spec)
// This value must match --color-primary in globals.css
export const viewport = {
  themeColor: "#F98819", // Must match --color-primary (#F98819) - PWA requirement
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Baloo 2 for display headings - loaded via CSS for flexibility */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${nunito.variable} ${notoSansDevanagari.variable} ${notoSansBengali.variable} font-sans antialiased`}
        style={{
          fontFamily: "var(--font-nunito), 'Nunito', system-ui, sans-serif",
        }}
      >
        {/* Accessibility: Skip navigation link for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <GlobalErrorBoundary>
              {/* BackgroundSyncInitializer disabled: next-pwa is disabled for Next.js 16 compatibility */}
              <OfflineBanner position="top" />
              <main id="main-content">
                <PageTransition>{children}</PageTransition>
              </main>
              <Toaster />
            </GlobalErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
