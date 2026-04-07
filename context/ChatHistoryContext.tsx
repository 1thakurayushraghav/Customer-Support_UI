"use client";

import { createContext, useContext } from "react";
import { useChatHistory } from "@/hooks/useChatHistory";

const ChatHistoryContext = createContext<any>(null);

export function ChatHistoryProvider({ children }: { children: React.ReactNode }) {
  const chat = useChatHistory();

  return (
    <ChatHistoryContext.Provider value={chat}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatHistoryContext);
}