// components/ChatBox.tsx
"use client";

import { useContext, useRef, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import { useChat } from "@/context/ChatHistoryContext";
import MessageBubble from "./MessageBubble";
import { useTheme } from "@/context/ThemeContext";

const SUGGESTED = [
  "Device installation",
  "Sensor issue",
  "Billing query",
  "Talk to a human",
];

export default function ChatBox() {
  const { token } = useContext(AuthContext);
  const { messages, addMessage, activeSessionId } = useChat();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    firstRender.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [activeSessionId]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg = addMessage({ role: "user", content: trimmed });
    setNewMsgIds(prev => new Set(prev).add(userMsg.id));
    setLoading(true);

    try {
      const res = await api.post(
        "/chat",
        { message: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const aiMsg = addMessage({ role: "assistant", content: res.data.reply });
      setNewMsgIds(prev => new Set(prev).add(aiMsg.id));
    } catch {
      setError("Something went wrong. Please try again.");
      const errMsg = addMessage({ role: "assistant", content: "Sorry, I couldn't process that. Please try again." });
      setNewMsgIds(prev => new Set(prev).add(errMsg.id));
    } finally {
      setLoading(false);
    }
  }, [input, loading, token, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full grid grid-rows-[1fr_auto] overflow-hidden min-h-0">

      {/* ── MESSAGES ── */}
      <div ref={scrollRef} className="min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth">
        <div className="p-6 pb-4 flex flex-col gap-4">

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${dark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"} shadow-sm`}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="12" stroke={dark ? "#34d399" : "#10b981"} strokeWidth="1.4" />
                  <path d="M7 14c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={dark ? "#34d399" : "#10b981"} strokeWidth="1.7" strokeLinecap="round" />
                  <circle cx="14" cy="14" r="2.5" fill={dark ? "#10b981" : "#059669"} />
                </svg>
              </div>
              <h2 className={`text-lg font-semibold mb-2 ${dark ? "text-white/90" : "text-slate-800"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                How can I help you?
              </h2>
              <p className={`text-sm max-w-[280px] mb-6 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                Ask me anything about your devices, billing, or support.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer transition-all duration-150 ${dark ? "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400" : "bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(m => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              timestamp={m.timestamp}
              isNew={newMsgIds.has(m.id)}
            />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2 animate-fade-in">
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${dark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke={dark ? "#34d399" : "#10b981"} strokeWidth="1.1" />
                  <circle cx="7" cy="7" r="2.2" fill={dark ? "#10b981" : "#059669"} />
                </svg>
              </div>
              <div className={`px-4 py-2.5 rounded-[18px_18px_18px_4px] ${dark ? "bg-slate-800/80 border border-slate-700" : "bg-white border border-slate-200"} shadow-sm`}>
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 160, 320].map(d => (
                    <span
                      key={d}
                      className={`w-1.5 h-1.5 rounded-full ${dark ? "bg-emerald-400" : "bg-emerald-500"} inline-block animate-bounce-typing`}
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error toast */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-red-500/8 border border-red-500/20 text-red-400">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              {error}
              <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none text-base text-inherit">×</button>
            </div>
          )}

          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* ── INPUT BAR ── */}
      <div className={`px-4 pb-4 pt-2 flex-shrink-0 ${dark ? "bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" : "bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent"}`}>
        <div
          className={`flex items-end gap-2.5 px-3 py-2.5 rounded-2xl transition-all duration-200 ${focused
              ? dark
                ? "bg-slate-800 border border-emerald-500/50 shadow-[0_0_0_3px_rgba(52,211,153,0.08)]"
                : "bg-white border border-emerald-400/60 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]"
              : dark
                ? "bg-slate-800/70 border border-slate-700"
                : "bg-white border border-slate-200 shadow-sm"
            }`}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Type a message…"
            disabled={loading}
            className={`flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed max-h-[140px] font-[Outfit,sans-serif] p-0 ${dark ? "text-white/90" : "text-slate-800"}`}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            title="Send (Enter)"
            className={`w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center border-none cursor-pointer transition-all duration-150 bg-gradient-to-br from-emerald-500 to-teal-600 ${!input.trim() || loading
                ? "opacity-30 cursor-not-allowed"
                : "opacity-100 hover:scale-105 hover:shadow-[0_3px_14px_rgba(16,185,129,0.5)] active:scale-95"
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <p className={`text-center text-[10px] mt-1.5 ${dark ? "text-slate-600" : "text-slate-400"}`}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}