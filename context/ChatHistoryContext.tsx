// context/ChatHistoryContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
};

type Session = {
  id: string;
  title: string;
  updatedAt: string;
};

interface ChatContextType {
  sessions: Session[];
  activeSessionId: string | null;
  messages: Message[];
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => Message;
  newSession: () => Promise<string | null>;
  switchSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  loading: boolean;
  refreshSessions: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const isInitialMount = useRef(true);

  // Get title from first user message
  const getConversationTitle = useCallback((msgs: any[]) => {
    const firstUserMsg = msgs?.find(m => m.role === "user");
    if (firstUserMsg && firstUserMsg.content) {
      const content = firstUserMsg.content;
      return content.length > 30 ? content.substring(0, 30) + "..." : content;
    }
    return "New conversation";
  }, []);

  // Fetch all conversations from backend
  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get("/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const convos = response.data.conversations || [];
      const formattedSessions = convos.map((conv: any) => ({
        id: conv._id,
        title: conv.title || getConversationTitle(conv.messages || []),
        updatedAt: conv.updatedAt,
      }));

      setSessions(formattedSessions);
      return formattedSessions;
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      return [];
    }
  }, [token, getConversationTitle]);

  // Load single conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!token) return false;

    try {
      setLoading(true);
      const response = await api.get(`/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const conversation = response.data.conversation;
      const formattedMessages = conversation.messages.map((msg: any, index: number) => ({
        id: msg._id || `${conversationId}_${index}_${Date.now()}`,
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
      }));

      setMessages(formattedMessages);
      setActiveSessionId(conversationId);
      return true;
    } catch (error) {
      console.error("Failed to load conversation:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create new session in backend
  const createNewSession = useCallback(async () => {
    if (!token) return null;

    try {
      setLoading(true);
      const response = await api.post("/conversations", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newConvo = response.data.conversation;
      const newSessionObj: Session = {
        id: newConvo._id,
        title: "New conversation",
        updatedAt: newConvo.updatedAt,
      };

      // Add to sessions list
      setSessions(prev => [newSessionObj, ...prev]);

      // Clear messages and set active session
      setMessages([]);
      setActiveSessionId(newConvo._id);

      console.log("✅ Created new session:", newConvo._id);
      return newConvo._id;
    } catch (error) {
      console.error("Failed to create new session:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Add message locally and also save to backend via API
  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">): Message => {
    const newMsg = {
      ...msg,
      id: `temp_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }, []);

  // new session async function that returns the new session ID (for chaining after deletion)
  const newSession = useCallback(async (): Promise<string | null> => {
    const id = await createNewSession();
    return id;
  }, [createNewSession]);

  // Switch between sessions
  const switchSession = useCallback(async (id: string) => {
    if (id === activeSessionId) return;
    await loadConversation(id);
  }, [activeSessionId, loadConversation]);

  // Delete session
  const deleteSession = useCallback(async (id: string) => {
    if (!token) return;

    try {
      await api.delete(`/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from sessions list
      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== id);

        // If we deleted the active session, switch to another one
        if (activeSessionId === id) {
          if (filtered.length > 0) {
            loadConversation(filtered[0].id);
          } else {
            // No sessions left, create a new one
            createNewSession();
          }
        }

        return filtered;
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }, [token, activeSessionId, loadConversation, createNewSession]);

  // Refresh sessions list
  const refreshSessions = useCallback(async () => {
    const updatedSessions = await fetchConversations();

    // If we have an active session, update its title if needed
    if (activeSessionId && updatedSessions.length > 0) {
      const currentSession = updatedSessions.find((s: any) => s.id === activeSessionId);
      if (currentSession && currentSession.title !== "New conversation" && messages.length > 0) {
        // Update the session title in the list
        setSessions(prev => prev.map(s =>
          s.id === activeSessionId ? { ...s, title: currentSession.title } : s
        ));
      }
    }
  }, [fetchConversations, activeSessionId, messages.length]);

  // Initial load - create first session if none exists
  useEffect(() => {
    const init = async () => {
      if (token) {
        const existingSessions = await fetchConversations();
        if (existingSessions.length === 0) {
          // No conversations exist, create first one
          await createNewSession();
        } else if (!activeSessionId) {
          // Load the most recent conversation
          await loadConversation(existingSessions[0].id);
        }
      }
    };

    init();
  }, [token]); // Only run when token changes

  // Refresh sessions periodically or when messages change
  useEffect(() => {
    if (activeSessionId && messages.length > 0 && !isInitialMount.current) {
      // Debounce refresh to avoid too many API calls
      const timer = setTimeout(() => {
        refreshSessions();
      }, 2000);

      return () => clearTimeout(timer);
    }
    isInitialMount.current = false;
  }, [messages, activeSessionId, refreshSessions]);

  return (
    <ChatContext.Provider value={{
      sessions,
      activeSessionId,
      messages,
      addMessage,
      newSession,
      switchSession,
      deleteSession,
      loading,
      refreshSessions
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatHistoryProvider");
  }
  return context;
};