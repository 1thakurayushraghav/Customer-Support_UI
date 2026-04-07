// app/chat/page.tsx
"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import ChatBox from "@/components/ChatBox";
import { useTheme } from "@/context/ThemeContext";
import { AuthContext } from "@/context/AuthContext";
import { useChat } from "@/context/ChatHistoryContext";

type Session = {
  id: string;
  title: string;
  updatedAt: string;
};



/* ─── Icons ─────────────────────────────────────── */
const Icon = {
  Sun: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Moon: () => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path d="M17.5 11.5A7.5 7.5 0 118.5 2.5a5.5 5.5 0 009 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Trash: () => (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M11.5 3.5l-.8 8a.5.5 0 01-.5.5H3.8a.5.5 0 01-.5-.5l-.8-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Menu: () => (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Chat: () => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M2 2.5h10a.5.5 0 01.5.5v6.5a.5.5 0 01-.5.5H8l-2 2-2-2H2a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  Logout: () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ─── Sidebar ────────────────────────────────────── */
function Sidebar({ open, onClose, dark }: { open: boolean; onClose: () => void; dark: boolean }) {
  const {
    sessions,
    activeSessionId,
    newSession,
    switchSession,
    deleteSession
  } = useChat() as {
    sessions: Session[];
    activeSessionId: string;
    newSession: () => void;
    switchSession: (id: string) => void;
    deleteSession: (id: string) => void;
  };
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  const now = Date.now();
  const DAY = 86_400_000;

  // helper (clean code)
  const getTime = (date: string) => new Date(date).getTime();

  const groups = [
    {
      label: "Today",
      items: sessions.filter(s => now - getTime(s.updatedAt) < DAY),
    },
    {
      label: "This week",
      items: sessions.filter(s => {
        const diff = now - getTime(s.updatedAt);
        return diff >= DAY && diff < 7 * DAY;
      }),
    },
    {
      label: "Older",
      items: sessions.filter(s => now - getTime(s.updatedAt) >= 7 * DAY),
    },
  ].filter(g => g.items.length > 0);

  return (
    <>
      {/* Mobile-only backdrop — hidden on md+ */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}

      {/*
        Mobile:  fixed overlay, slides in/out via translate
        Desktop: relative, always visible, no z-index fighting
      */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:z-auto md:h-full
        ${dark ? "bg-slate-900 border-r border-slate-800" : "bg-white border-r border-slate-200"}
      `}>

        {/* Header */}
        <div className={`flex items-center justify-between px-4 h-16 flex-shrink-0 border-b ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <span className={`text-sm font-semibold ${dark ? "text-white/90" : "text-slate-800"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Conversations
          </span>
          <button
            onClick={() => { newSession(); onClose(); }}
            title="New chat"
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-150 ${dark ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"}`}
          >
            <Icon.Plus />
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2 px-1.5">
          {sessions.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>No conversations yet</p>
              <p className={`text-xs mt-1 ${dark ? "text-slate-600" : "text-slate-300"}`}>Start a new chat above</p>
            </div>
          ) : (
            groups.map(group => (
              <div key={group.label} className="mb-1">
                <p className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                  {group.label}
                </p>
                {group.items.map(session => {
                  const active = session.id === activeSessionId;
                  return (
                    <div key={session.id} className="relative flex sidebar-item-wrap">
                      <button
                        onClick={() => { switchSession(session.id); onClose(); }}
                        className={`flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-left min-w-0 transition-all duration-150 ${active
                          ? dark
                            ? "bg-emerald-500/12 border border-emerald-500/20 text-emerald-400"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          : dark
                            ? "text-slate-400 hover:bg-slate-800 border border-transparent"
                            : "text-slate-500 hover:bg-slate-100 border border-transparent"
                          }`}
                      >
                        <span className="opacity-60 flex-shrink-0"><Icon.Chat /></span>
                        <span className={`text-[13px] truncate flex-1 min-w-0 ${active ? "font-medium" : "font-normal"}`}>
                          {session.title}
                        </span>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                        className={`sidebar-delete-btn absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center opacity-0 transition-opacity duration-150 ${dark ? "bg-slate-900 border border-slate-700 text-slate-500 hover:text-red-400" : "bg-white border border-slate-200 text-slate-400 hover:text-red-500"}`}
                        title="Delete"
                      >
                        <Icon.Trash />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Sign out */}
        <div className={`px-1.5 pb-3 pt-2 flex-shrink-0 border-t ${dark ? "border-slate-800" : "border-slate-200"}`}>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${dark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
          >
            <Icon.Logout />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── Chat Page ──────────────────────────────────── */
export default function ChatPage() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`flex h-full overflow-hidden ${dark ? "bg-slate-950" : "bg-slate-50"}`}>

      {/*
        Sidebar container:
        - Mobile: zero width (sidebar overlays via fixed positioning)
        - Desktop: fixed 256px width, participates in flex layout
      */}
      <div className="w-0 md:w-64 flex-shrink-0">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dark={dark} />
      </div>

      {/* Main column */}
      <div className="flex-1 min-w-0 grid grid-rows-[auto_1fr] h-full overflow-hidden relative">

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className={`absolute top-[-20%] left-[30%] w-[600px] h-[400px] rounded-full ${dark ? "bg-emerald-500/8" : "bg-emerald-400/10"} blur-[100px]`} />
          <div className={`absolute bottom-[-10%] right-[20%] w-[400px] h-[300px] rounded-full ${dark ? "bg-teal-500/6" : "bg-teal-400/8"} blur-[90px]`} />
        </div>

        {/* ── HEADER ── */}
        <header className={`relative z-10 flex-shrink-0 h-16 flex items-center justify-between px-5 backdrop-blur-xl border-b ${dark ? "bg-slate-950/85 border-slate-800" : "bg-slate-50/85 border-slate-200"}`}>

          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Sidebar toggle — shown on mobile always, on desktop only when sidebar is closed */}
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title="Toggle history"
              className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-all duration-150 ${dark ? "bg-slate-800 border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400" : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"}`}
            >
              <Icon.Menu />
            </button>

            {/* Logo + name */}
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-[10px] flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_3px_14px_rgba(16,185,129,0.4)]">
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.2" />
                  <path d="M4 8c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="8" cy="8" r="1.5" fill="white" />
                </svg>
              </div>
              <div>
                <p className={`text-[14px] font-semibold leading-tight ${dark ? "text-white/90" : "text-slate-800"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Raghav-1.0
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse-dot inline-block" />
                  <span className={`text-[10px] font-medium ${dark ? "text-slate-500" : "text-slate-400"}`}>Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${dark ? "bg-amber-500/8 border-amber-500/20 text-slate-400" : "bg-amber-50 border-amber-200 text-slate-500"}`}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.35 2.73 3.01.44-2.18 2.12.51 3-2.69-1.42L3.31 9.29l.51-3L1.64 4.17l3.01-.44z" fill="#fbbf24" />
              </svg>
              <span className="font-medium">AI Support</span>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={dark ? "Light mode" : "Dark mode"}
              className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-all duration-150 ${dark ? "bg-slate-800 border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400" : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"}`}
            >
              {dark ? <Icon.Sun /> : <Icon.Moon />}
            </button>
          </div>
        </header>

        {/* ── CHAT AREA ── */}
        <main className="relative z-10 min-h-0 overflow-hidden">
          <div className="h-full max-w-[760px] mx-auto w-full">
            <ChatBox />
          </div>
        </main>
      </div>
    </div>
  );
}