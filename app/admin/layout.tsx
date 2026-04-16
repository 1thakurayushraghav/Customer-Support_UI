"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const { token, user, isLoading, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ========================
  // AUTH GUARD (CLEAN)
  // ========================
  useEffect(() => {
    if (!isLoading && (!token || user?.role !== "admin")) {
      router.replace("/login");
    }
  }, [token, user, isLoading]);

  // ========================
  // MOBILE CHECK
  // ========================
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ========================
  // LOADING STATE
  // ========================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-300 animate-pulse">
          Verifying admin access...
        </div>
      </div>
    );
  }

  if (isLoading || !token || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Redirecting...
      </div>
    );
  }

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${pathname === path
      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  const navItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin/conversations", label: "Conversations", icon: "💬" },
    { path: "/admin/live-chat", label: "Live Chat", icon: "🟢" },
    { path: "/admin/training", label: "AI Training", icon: "🤖" },
    { path: "/admin/analytics", label: "Analytics", icon: "📈" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 h-full transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-0 md:w-20"
          } bg-slate-900/95 border-r border-slate-800 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="text-white font-bold">QESPL Admin</div>
          ) : (
            <div className="text-white font-bold mx-auto">Q</div>
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block text-slate-400"
          >
            ☰
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={linkClass(item.path)}
            >
              <span>{item.icon}</span>
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 text-red-400 hover:text-red-300"
          >
            🚪 {isSidebarOpen && "Sign Out"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3 flex justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-white"
          >
            ☰
          </button>

          <div className="text-white font-medium">
            {user?.name || "Admin"}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

      </div>
    </div>
  );
}