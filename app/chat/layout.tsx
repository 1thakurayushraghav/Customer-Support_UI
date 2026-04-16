"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → login
    if (!token) {
      router.replace("/login");
      return;
    }

    // Admin should NOT use chat
    if (user?.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
  }, [token, user, isLoading, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-300 animate-pulse">
          Loading chat...
        </div>
      </div>
    );
  }

  // Block UI while redirecting
  if (!token || user?.role === "admin") {
    return null;
  }

  return <>{children}</>;
}