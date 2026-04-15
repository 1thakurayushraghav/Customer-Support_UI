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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { token, isLoading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      router.push("/login");
    }

    // Check for mobile screen
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 h-full transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-0 md:w-20"
          } bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col shadow-2xl overflow-hidden`}
      >
        {/* Logo & Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Q</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">QESPL Admin</h2>
                <p className="text-xs text-slate-400">v1.0.0</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
          )}

          {/* Close button for mobile sidebar */}
          {isMobile && isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Desktop toggle button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isSidebarOpen ? (
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={linkClass(item.path)}
              title={!isSidebarOpen ? item.label : undefined}
              onClick={() => isMobile && setIsSidebarOpen(false)}
            >
              <span className="text-lg">{item.icon}</span>
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 ${!isSidebarOpen && "justify-center"
              }`}
            title={!isSidebarOpen ? "Sign Out" : undefined}
          >
            <span className="text-lg">🚪</span>
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm text-white font-medium">Admin User</p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>

    </div>
  );
}