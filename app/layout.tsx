// app/layout.tsx
import type { Metadata } from "next";
import AuthProvider from "@/context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ChatHistoryProvider } from "@/context/ChatHistoryContext";
import "../app/globals.css";

export const metadata: Metadata = {
  title: "Raghav-1.0 · AI Customer Support",
  description: "Instant, intelligent customer support powered by Raghav-1.0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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