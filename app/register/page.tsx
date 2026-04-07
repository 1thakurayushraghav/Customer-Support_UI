// app/register/page.tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await api.post("/auth/register", data);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center px-4 overflow-hidden">

      {/* Orbs */}
      <div className="absolute top-[-150px] right-[-80px] w-[480px] h-[480px] rounded-full bg-teal-500/12 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-60px] w-[380px] h-[380px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-cyan-500/6 blur-[90px] pointer-events-none" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(52,211,153,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-slate-900/60 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-[0_0_0_1px_rgba(52,211,153,0.08),0_24px_64px_rgba(0,0,0,0.6)]">

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-500/12 border border-teal-500/25 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#2dd4bf" strokeWidth="1.6" />
            <path d="M4 20c0-4 3.582-6 8-6s8 2 8 6" stroke="#2dd4bf" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="19" cy="19" r="4" fill="#0d9488" />
            <path d="M17.5 19h3M19 17.5v3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white/95 tracking-tight mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Create account
          </h1>
          <p className="text-sm text-slate-400">
            Join Raghav-1.0 — your AI support companion
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
              Full name
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 14c0-3.314 2.686-4 6-4s6 .686 6 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Alex Johnson"
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white/90 placeholder-slate-500 outline-none focus:border-teal-500/60 focus:bg-teal-500/5 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
                onChange={e => setData({ ...data, name: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
              Email address
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M1.5 5.5l6.5 4 6.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white/90 placeholder-slate-500 outline-none focus:border-teal-500/60 focus:bg-teal-500/5 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
                onChange={e => setData({ ...data, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 7V5a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="8" cy="10.5" r="1" fill="currentColor" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white/90 placeholder-slate-500 outline-none focus:border-teal-500/60 focus:bg-teal-500/5 focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
                onChange={e => setData({ ...data, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold text-sm shadow-[0_4px_24px_rgba(20,184,166,0.3)] hover:shadow-[0_8px_32px_rgba(20,184,166,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
              <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              Create account
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}