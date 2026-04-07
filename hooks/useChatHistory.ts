// hooks/useChatHistory.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

const STORAGE_KEY = "raghav_chat_sessions";
const ACTIVE_KEY  = "raghav_active_session";
const MAX_SESSIONS = 50; // keep last 50 sessions

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  // Keep only most recent MAX_SESSIONS
  const trimmed = sessions
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_SESSIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const allSessions = loadSessions();
    const activeId = localStorage.getItem(ACTIVE_KEY);
    setSessions(allSessions);

    if (activeId && allSessions.find(s => s.id === activeId)) {
      setActiveSessionId(activeId);
    } else if (allSessions.length > 0) {
      // Resume most recent
      const mostRecent = allSessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveSessionId(mostRecent.id);
      localStorage.setItem(ACTIVE_KEY, mostRecent.id);
    }
    setMounted(true);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // Create a new chat session
  const newSession = useCallback(() => {
    const id = generateId();
    const session: ChatSession = {
      id,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions(prev => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(id);
    localStorage.setItem(ACTIVE_KEY, id);
    return id;
  }, []);

  // Switch to existing session
  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  // Delete a session
  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSessions(updated);
      // If we deleted the active session, switch to most recent
      if (id === activeSessionId) {
        const next = updated[0];
        const nextId = next?.id ?? null;
        setActiveSessionId(nextId);
        if (nextId) localStorage.setItem(ACTIVE_KEY, nextId);
        else localStorage.removeItem(ACTIVE_KEY);
      }
      return updated;
    });
  }, [activeSessionId]);

  // Add message to active session (or create new session if none)
  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const newMsg: Message = {
      ...msg,
      id: generateId(),
      timestamp: Date.now(),
    };

    setSessions(prev => {
      let targetId = activeSessionId;

      // No active session → create one
      if (!targetId || !prev.find(s => s.id === targetId)) {
        const id = generateId();
        targetId = id;
        setActiveSessionId(id);
        localStorage.setItem(ACTIVE_KEY, id);
        const newSess: ChatSession = {
          id,
          title: msg.role === "user"
            ? msg.content.slice(0, 40) + (msg.content.length > 40 ? "…" : "")
            : "New Chat",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [newMsg],
        };
        const updated = [newSess, ...prev];
        saveSessions(updated);
        return updated;
      }

      const updated = prev.map(s => {
        if (s.id !== targetId) return s;
        const updatedMsgs = [...s.messages, newMsg];
        // Auto-title from first user message
        const title = s.messages.length === 0 && msg.role === "user"
          ? msg.content.slice(0, 40) + (msg.content.length > 40 ? "…" : "")
          : s.title;
        return { ...s, messages: updatedMsgs, title, updatedAt: Date.now() };
      });
      saveSessions(updated);
      return updated;
    });

    return newMsg;
  }, [activeSessionId]);

  // Clear messages in active session
  const clearSession = useCallback(() => {
    if (!activeSessionId) return;
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === activeSessionId
          ? { ...s, messages: [], title: "New Chat", updatedAt: Date.now() }
          : s
      );
      saveSessions(updated);
      return updated;
    });
  }, [activeSessionId]);

  return {
    sessions: sessions.sort((a, b) => b.updatedAt - a.updatedAt),
    activeSession,
    activeSessionId,
    messages,
    mounted,
    newSession,
    switchSession,
    deleteSession,
    addMessage,
    clearSession,
  };
}