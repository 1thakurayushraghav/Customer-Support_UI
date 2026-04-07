// components/MessageBubble.tsx
"use client";

import { memo, useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  isNew?: boolean;
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied)
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 5V4a1.5 1.5 0 00-1.5-1.5h-6A1.5 1.5 0 002 4v7A1.5 1.5 0 003.5 12.5H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const MessageBubble = memo(function MessageBubble({
  role, content, timestamp, isNew = false,
}: MessageBubbleProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const copyBtnRef = useRef<HTMLButtonElement>(null);

  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  useEffect(() => {
    if (copyBtnRef.current) {
      copyBtnRef.current.style.opacity = copied ? "1" : "";
    }
  }, [copied]);

  return (
    <div
      className={`flex w-full items-end gap-2 px-0.5 ${isUser ? "flex-row-reverse justify-start" : "flex-row justify-start"} ${isNew ? "animate-fade-slide-up" : ""}`}
    >

      {/* Avatar */}
      {!isUser ? (
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${dark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke={dark ? "#34d399" : "#10b981"} strokeWidth="1.1" />
            <circle cx="7" cy="7" r="2.2" fill={dark ? "#10b981" : "#059669"} />
          </svg>
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_2px_10px_rgba(16,185,129,0.35)]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="4" r="2.2" stroke="white" strokeWidth="1.2" />
            <path d="M1.5 11c0-2.485 2.015-3.5 4.5-3.5s4.5 1.015 4.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Bubble + meta */}
      <div className={`flex flex-col min-w-0 flex-[0_1_auto] max-w-[min(75%,580px)] ${isUser ? "items-end" : "items-start"}`}>
        {/* Name */}
        <span className={`text-[11px] font-medium mb-1 tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>
          {isUser ? "You" : "Raghav"}
        </span>

        {/* Bubble */}
        <div
          className={`msg-bubble-hover-parent relative px-3.5 py-2.5 text-sm leading-[1.7] break-words overflow-wrap-anywhere whitespace-pre-wrap ${
            isUser
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[18px_18px_4px_18px] shadow-[0_4px_16px_rgba(16,185,129,0.28)]"
              : dark
                ? "bg-slate-800/80 text-white/85 border border-slate-700 rounded-[18px_18px_18px_4px] shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 rounded-[18px_18px_18px_4px] shadow-sm"
          }`}
        >
          {content}

          {/* Copy button (AI only) */}
          {!isUser && (
            <button
              ref={copyBtnRef}
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy message"}
              className={`copy-btn absolute top-1.5 right-1.5 w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer opacity-0 transition-all duration-150 ${
                copied
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : dark
                    ? "text-slate-500 border-slate-600 bg-slate-900 hover:text-slate-300"
                    : "text-slate-400 border-slate-200 bg-white hover:text-slate-600"
              }`}
            >
              <CopyIcon copied={copied} />
            </button>
          )}
        </div>

        {/* Time */}
        <span className={`text-[10px] mt-1 ${dark ? "text-slate-600" : "text-slate-400"}`}>
          {timeStr}
        </span>
      </div>
    </div>
  );
});

export default MessageBubble;