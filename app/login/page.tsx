"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, token, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (token && user) {
      const destination =
        user.role === "admin" ? "/admin/dashboard" : "/chat";

      router.replace(destination);
    }
  }, [token, user, isLoading, router]);

  // Alert states for success & error messages (professional toast-style)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    // Auto-dismiss after 4 seconds
    setTimeout(() => setAlert(null), 4000);
  };

  // app/login/page.tsx mein handleLogin function ko aise modify karo:

const handleLogin = async () => {
  if (!email.trim()) {
    showAlert("error", "Email address is required");
    return;
  }

  if (!password.trim()) {
    showAlert("error", "Password is required");
    return;
  }

  setLoading(true);

  try {
    const res = await api.post("/auth/login", { email, password });

    const { token, user } = res.data;
    
    // SIRF login karo - manual redirect MAT karo
    login(token, user);
    
    showAlert(
      "success",
      `Welcome back, ${user?.name || "User"}! Redirecting...`
    );
    
    // YEH DELETE KARO (setTimeout wala redirect):
    // const destination = user?.role === "admin" ? "/admin/dashboard" : "/chat";
    // setTimeout(() => {
    //   router.replace(destination);
    // }, 800);
    
    // setLoading(false) bhi hatao - useEffect handle karega

  } catch (err: any) {
    const errorMessage =
      err?.response?.data?.message ||
      "Invalid email or password. Please try again.";

    showAlert("error", errorMessage);
    setLoading(false);
  }
};

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center px-4 overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full bg-emerald-500/12 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-[-80px] right-[-60px] w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: "10s", animationDelay: "1s" }} />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/6 blur-[90px] pointer-events-none" />

      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(52,211,153,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Toast / Alert Container - Professional positioning */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none">
        {alert && (
          <div
            className={`
              pointer-events-auto backdrop-blur-xl rounded-2xl shadow-2xl p-4 flex items-start gap-3 
              animate-in slide-in-from-top-5 fade-in duration-300
              ${alert.type === "success"
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-100"
                : "bg-rose-500/15 border border-rose-500/30 text-rose-100"}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {alert.type === "success" ? (
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">{alert.message}</div>
            <button
              onClick={() => setAlert(null)}
              className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-slate-900/60 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-[0_0_0_1px_rgba(52,211,153,0.08),0_24px_64px_rgba(0,0,0,0.6)]">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/12 border border-emerald-500/25 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#34d399" strokeWidth="1.5" />
            <path d="M6 12c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2.5" fill="#10b981" />
          </svg>
        </div>

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-white/95 tracking-tight mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome back
          </h1>
          <p className="text-sm text-slate-400">
            Sign in to your Raghav-1.0 account
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
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
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white/90 placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:bg-emerald-500/5 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white/90 placeholder-slate-500 outline-none focus:border-emerald-500/60 focus:bg-emerald-500/5 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
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

        {/* Submit Button with professional loading state */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-[0_4px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              Sign in
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>

        {/* Register Link */}
        <p className="mt-5 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Create one
          </Link>
        </p>
      </div>

      {/* CSS for animations (Tailwind might not have slide-in by default) */}
      <style jsx>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-in {
          animation: slideInFromTop 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}