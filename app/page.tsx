"use client";

import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M17.5 11.5A7.5 7.5 0 118.5 2.5a5.5 5.5 0 009 9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <main
      className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-16 sm:py-0 ${
        dark ? "bg-slate-950" : "bg-slate-50"
      }`}
    >
      {/* Ambient orbs */}
      <div
        className={`absolute top-[-200px] left-[-150px] w-[500px] h-[500px] rounded-full pointer-events-none blur-[100px] ${
          dark ? "bg-emerald-500/10" : "bg-emerald-400/20"
        }`}
      />
      <div
        className={`absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none blur-[90px] ${
          dark ? "bg-teal-500/8" : "bg-teal-400/15"
        }`}
      />
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full pointer-events-none blur-[120px] ${
          dark ? "bg-cyan-500/5" : "bg-cyan-400/10"
        }`}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: dark
            ? "radial-gradient(circle, rgba(52,211,153,0.08) 1px, transparent 1px)"
            : "radial-gradient(circle, rgba(15,118,110,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
          dark
            ? "bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50"
            : "bg-white/80 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300"
        } backdrop-blur-sm`}
        title="Toggle theme"
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-xl mx-auto">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest px-4 py-2 rounded-full mb-6 uppercase ${
            dark
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              dark
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            }`}
          />
          AI-Powered Support · v1.0
        </div>

        {/* Hero heading — responsive font size */}
        <h1
          className={`font-bold leading-[1.05] tracking-tighter mb-5 text-[2.4rem] sm:text-[3.5rem] lg:text-[4.5rem]`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <span className={`block ${dark ? "text-white/90" : "text-slate-900"}`}>
              Conversational AI
          </span>
          <span
            className={`block bg-clip-text text-transparent ${
              dark
                ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400"
                : "bg-gradient-to-r from-emerald-600 via-cyan-600 to-indigo-500"
            }`}
          >
           Customer Support
          </span>
          <span className={`block ${dark ? "text-white/90" : "text-slate-900"}`}>
            Platform
          </span>
        </h1>

        {/* Paragraph — properly centered */}
        <p
          className={`text-sm sm:text-base leading-relaxed mb-8 w-full max-w-sm mx-auto text-center ${
            dark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Instant, intelligent support — powered by Raghav-1.0.
          <br className="hidden sm:block" />
          Your questions answered at the speed of thought.
        </p>

        {/* CTAs — stacked on mobile, row on sm+ */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 w-full sm:w-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(5,150,105,0.4)] active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_4px_20px_rgba(5,150,105,0.3)]"
          >
            Sign In
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href="/register"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
              dark
                ? "bg-slate-800/80 border border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400"
                : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
            } backdrop-blur-sm`}
          >
            Create Account
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {[
            { num: "99.9", unit: "%", label: "Uptime" },
            { num: "<1", unit: "s", label: "Response" },
            { num: "24", unit: "/7", label: "Available" },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-8 sm:gap-12">
              {i > 0 && (
                <div
                  className={`w-px h-8 -ml-8 sm:-ml-12 ${
                    dark
                      ? "bg-gradient-to-b from-transparent via-slate-600 to-transparent"
                      : "bg-gradient-to-b from-transparent via-slate-300 to-transparent"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`text-lg sm:text-2xl font-bold tracking-tight ${
                    dark ? "text-white/90" : "text-slate-900"
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {s.num}
                  <span
                    className={`text-[0.75em] ${
                      dark ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  >
                    {s.unit}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-widest ${
                    dark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}