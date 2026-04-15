import type { Metadata, Viewport } from "next";
import AuthProvider from "@/context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ChatHistoryProvider } from "@/context/ChatHistoryContext";
import "../app/globals.css";

const BASE_URL = "https://conversationalai-for-customer-support.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "AI Customer Support Software | Raghav-1.0",
    template: "%s | Raghav-1.0 AI Support",
  },

  description:
    "Raghav-1.0 is an AI customer support chatbot that automates conversations, detects keywords, and provides real-time assistance for businesses.",

  keywords: [
    "AI customer support",
    "customer support chatbot",
    "AI chat support",
    "automation customer service",
    "Next.js AI chatbot",
    "real-time AI support",
    "customer support automation software",
  ],

  // ✅ Canonical URL
  alternates: {
    canonical: "/",
  },

  // ✅ App identity
  applicationName: "Raghav-1.0",
  authors: [{ name: "Raghav AI Team" }],
  creator: "Raghav AI",
  publisher: "Raghav AI",

  // ✅ Open Graph (FIXED)
  openGraph: {
    title: "AI Customer Support Software | Raghav-1.0",
    description:
      "Automate your customer support with AI. Real-time chat, admin dashboard, keyword alerts.",
    url: BASE_URL,
    siteName: "Raghav-1.0",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Raghav AI Customer Support",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // ✅ Twitter
  twitter: {
    card: "summary_large_image",
    title: "AI Customer Support Software | Raghav-1.0",
    description:
      "Smart AI chatbot for customer support with real-time notifications.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@your_twitter_handle",
  },

  // ✅ FULL favicon setup (based on your files)
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome",
        url: "/android-chrome-512x512.png",
      },
    ],
  },

  // ✅ PWA manifest
  manifest: "/site.webmanifest",

  // ✅ Robots (SEO crawl control)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "technology",
};

// ✅ Mobile SEO
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ChatHistoryProvider>
              {children}
            </ChatHistoryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}