"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import io, { Socket } from "socket.io-client";

type Message = {
  role: string;
  content: string;
  sentBy?: string;
  senderName?: string;
  timestamp?: Date;
};

type User = {
  name: string;
  email: string;
  _id: string;
};

type Conversation = {
  _id: string;
  userId?: User;
  messages: Message[];
  mode: "ai" | "human" | "pending_review";
  status: string;
  requiresAttention: boolean;
  confidenceScore?: number;
  keywordsDetected?: string[];
  aiDraftResponse?: string;
  updatedAt: string;
};

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  metadata: any;
  createdAt: string;
};

export default function LiveChat() {
  const [chats, setChats] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [aiDraft, setAiDraft] = useState<string>("");
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const initialized = useRef(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent body scroll when mobile menu or modal is open
  useEffect(() => {
    if (isMobileMenuOpen || showNotifications) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen, showNotifications]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setShowNotifications(false);
        setShowReviewPanel(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchActiveChats = async () => {
    try {
      const res = await api.get("/admin/live-chats");
      setChats(res.data.chats || []);

      // Update selected chat if it exists
      if (selectedChat) {
        const updatedChat = res.data.chats?.find((c: Conversation) => c._id === selectedChat._id);
        if (updatedChat) {
          setSelectedChat(updatedChat);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/admin/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);

      // Show browser notification for high priority unread notifications
      if (res.data.unreadCount > 0 && Notification.permission === "granted") {
        const highPriorityUnread = res.data.notifications?.filter(
          (n: Notification) => !n.isRead && n.priority === 'high'
        );

        if (highPriorityUnread && highPriorityUnread.length > 0 && document.hidden) {
          new Notification(`🔔 ${highPriorityUnread.length} High Priority ${highPriorityUnread.length === 1 ? 'Notification' : 'Notifications'}`, {
            body: highPriorityUnread[0].message,
            icon: "/notification-icon.png"
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchAttentionNeeded = async () => {
    try {
      const res = await api.get("/admin/attention-needed");
      const attentionChats = res.data.conversations || [];

      setChats(prev => prev.map(chat => ({
        ...chat,
        requiresAttention: attentionChats.some((ac: any) => ac._id === chat._id)
      })));

      // If a chat that needs attention is selected, show visual indicator
      if (selectedChat && attentionChats.some((ac: any) => ac._id === selectedChat._id)) {
        // You can add a toast or visual indicator here
        console.log("Selected chat requires attention!");
      }
    } catch (err) {
      console.error("Failed to fetch attention needed:", err);
    }
  };

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      transports: ["polling", "websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("new_message", (data) => {
      setSelectedChat((prev) => {
        if (!prev || prev._id !== data.conversationId) return prev;
        return {
          ...prev,
          messages: [...prev.messages, data.message]
        };
      });
      fetchActiveChats();
    });

    // FIXED: Properly handle attention needed event
    socket.on("admin_attention_needed", async (data) => {
      console.log("Attention needed event received:", data);

      // Immediately fetch both notifications and attention needed chats
      await Promise.all([
        fetchNotifications(),
        fetchAttentionNeeded(),
        fetchActiveChats()
      ]);

      // Play a sound or show visual feedback (optional)
      // You can add a sound effect here
      // const audio = new Audio('/notification-sound.mp3');
      // audio.play().catch(e => console.log('Audio play failed:', e));
    });

    socket.on("review_completed", ({ conversationId }) => {
      setChats((prev) => [...prev]);
      fetchNotifications(); // Refresh notifications after review
      fetchAttentionNeeded(); // Update attention status
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Initial data fetch
    const loadInitialData = async () => {
      await Promise.all([
        fetchActiveChats(),
        fetchNotifications(),
        fetchAttentionNeeded()
      ]);
    };

    loadInitialData();

    // Set up periodic refresh with longer interval (30 seconds)
    notificationIntervalRef.current = setInterval(() => {
      fetchNotifications();
      fetchAttentionNeeded();
    }, 30000); // Changed from 10s to 30s to reduce server load

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || sending) return;

    setSending(true);
    const messageContent = messageInput;
    setMessageInput("");

    try {
      if (selectedChat.mode === "human") {
        const res = await api.post("/admin/send-message", {
          conversationId: selectedChat._id,
          message: messageContent
        });

        if (res.data.success) {
          setSelectedChat(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...prev.messages, res.data.message],
              mode: "human"
            };
          });

          // Refresh chats after sending message
          fetchActiveChats();
        }
      } else {
        setSelectedChat(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, {
              role: "user",
              content: messageContent,
              sentBy: "user",
              timestamp: new Date()
            }]
          };
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message");
      setMessageInput(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleReviewResponse = async (action: string, editedResponse?: string) => {
    if (!selectedChat) return;

    try {
      const res = await api.post("/admin/review-response", {
        conversationId: selectedChat._id,
        action,
        editedResponse
      });

      if (res.data.success) {
        await Promise.all([
          fetchActiveChats(),
          fetchNotifications(),
          fetchAttentionNeeded()
        ]);

        setShowReviewPanel(false);

        if (action === 'approve' || action === 'edit') {
          const convRes = await api.get(`/admin/conversations/${selectedChat._id}`);
          setSelectedChat(convRes.data);
        }
      }
    } catch (err) {
      console.error("Review failed:", err);
      alert("Failed to review response");
    }
  };

  const handleTakeOver = async () => {
    if (!selectedChat) return;

    try {
      const res = await api.post("/admin/takeover", {
        conversationId: selectedChat._id
      });

      if (res.data.success) {
        setSelectedChat(prev => ({
          ...prev!,
          mode: "human",
          status: "active"
        }));
        await fetchActiveChats();

        // Clear attention needed flag for this chat
        await fetchAttentionNeeded();
      }
    } catch (err) {
      console.error("Takeover failed:", err);
      alert("Failed to take over conversation");
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await api.put(`/admin/notifications/${notificationId}/read`);
      await fetchNotifications(); // Refresh after marking as read
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/admin/notifications/read-all");
      await fetchNotifications(); // Refresh after marking all as read
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ai': return '🤖';
      case 'human': return '👨‍💼';
      case 'pending_review': return '⏳';
      default: return '💬';
    }
  };

  // Chat Card Component for Mobile Grid View
  const ChatCard = ({ chat, onClick }: { chat: Conversation; onClick: () => void }) => (
    <div
      onClick={onClick}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
            {chat.userId?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">
              {chat.userId?.name || "Anonymous"}
            </h4>
            <p className="text-xs text-slate-400 truncate max-w-[150px]">
              {chat.userId?.email || "No email"}
            </p>
          </div>
        </div>
        {chat.requiresAttention && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </div>

      <div className="mb-3">
        <p className="text-xs text-slate-400 line-clamp-2">
          {chat.messages[chat.messages.length - 1]?.content?.substring(0, 80) || "No messages"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs ${chat.mode === 'ai' ? 'bg-blue-500/20 text-blue-400' :
          chat.mode === 'human' ? 'bg-green-500/20 text-green-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
          {getModeIcon(chat.mode)} {chat.mode.replace('_', ' ')}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {chat.confidenceScore && chat.confidenceScore < 0.6 && (
        <div className="mt-2 text-xs text-orange-400">
          ⚡ Confidence: {Math.round(chat.confidenceScore * 100)}%
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Live Chat Support</h1>
            <p className="text-sm text-slate-400">AI-powered chat with human escalation</p>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  // Optional: Mark as seen when opening (not read, just seen)
                  console.log("Opening notifications");
                }
              }}
              className="relative p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition w-10 h-10 flex items-center justify-center"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Modal */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                {/* Mobile View - Bottom Sheet (Same as before) */}
                <div className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-900 border-t border-slate-700 rounded-t-xl shadow-xl z-50 max-h-[80vh] overflow-y-auto">
                  <div className="sticky top-0 p-3 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                    <span className="font-semibold text-white">Notifications</span>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-emerald-400 hover:text-emerald-300">
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif._id}
                        onClick={() => markNotificationRead(notif._id)}
                        className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition ${!notif.isRead ? 'bg-slate-800/50' : ''
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(notif.priority)}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{notif.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop View - Center Modal */}
                <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-96 max-h-[500px] overflow-y-auto">
                    <div className="sticky top-0 p-3 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                      <span className="font-semibold text-white">Notifications</span>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-emerald-400 hover:text-emerald-300">
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">No notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif._id}
                          onClick={() => markNotificationRead(notif._id)}
                          className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition ${!notif.isRead ? 'bg-slate-800/50' : ''
                            }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(notif.priority)}`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">{notif.title}</p>
                              <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                              <p className="text-xs text-slate-500 mt-2">
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Show/Hide Chat List Button */}
      <div className="md:hidden mb-3">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="w-full py-3 bg-slate-800 rounded-xl text-white font-medium flex items-center justify-center gap-2"
        >
          <span>💬</span>
          {selectedChat ? 'Switch Conversation' : 'View Conversations'}
          <span className="text-xs text-slate-400">
            ({chats.filter(c => c.requiresAttention).length} needing attention)
          </span>
        </button>
      </div>

      {/* Main Chat Area - Grid/Card System for Mobile */}
      <div className="flex-1 flex gap-4 md:gap-6 min-h-0">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:flex w-80 bg-slate-900/50 border border-slate-800 rounded-xl flex-col">
          <div className="p-4 border-b border-slate-800">
            <h3 className="font-semibold text-white">Active Conversations</h3>
            <p className="text-xs text-slate-400 mt-1">
              {chats.filter(c => c.requiresAttention).length} need attention
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No active conversations</div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-slate-800 cursor-pointer transition-all hover:bg-slate-800/50 ${selectedChat?._id === chat._id ? "bg-slate-800/70 border-l-4 border-l-emerald-500" : ""
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getModeIcon(chat.mode)}</span>
                      <div>
                        <p className="text-sm font-semibold text-white truncate max-w-[150px]">
                          {chat.userId?.name || "Anonymous"}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">
                          {chat.userId?.email || "No email"}
                        </p>
                      </div>
                    </div>
                    {chat.requiresAttention && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {chat.messages[chat.messages.length - 1]?.content?.substring(0, 50) || "No messages"}
                  </p>
                  {chat.mode === "pending_review" && (
                    <div className="mt-2 text-xs text-yellow-500">⏳ Awaiting review</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile Chat List Modal */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div
              ref={modalRef}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Conversations</h3>
                  <p className="text-xs text-slate-400">
                    {chats.filter(c => c.requiresAttention).length} need attention
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-slate-800 text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No active conversations</div>
                ) : (
                  chats.map((chat) => (
                    <ChatCard
                      key={chat._id}
                      chat={chat}
                      onClick={() => {
                        setSelectedChat(chat);
                        setIsMobileMenuOpen(false);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Chat Area */}
        {selectedChat ? (
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                    {selectedChat.userId?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm md:text-base">
                      {selectedChat.userId?.name || "Anonymous User"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      <span className="text-slate-400 truncate max-w-[120px] sm:max-w-none">
                        {selectedChat.userId?.email}
                      </span>
                      <span className="text-slate-600 hidden sm:inline">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${selectedChat.mode === 'ai' ? 'bg-blue-500/20 text-blue-400' :
                        selectedChat.mode === 'human' ? 'bg-green-500/20 text-green-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                        {getModeIcon(selectedChat.mode)} {selectedChat.mode.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedChat.mode !== "human" && selectedChat.mode !== "pending_review" && (
                  <button
                    onClick={handleTakeOver}
                    className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition w-full sm:w-auto"
                  >
                    Take Over Chat
                  </button>
                )}
              </div>
            </div>

            {/* Detected Keywords */}
            {selectedChat.keywordsDetected && selectedChat.keywordsDetected.length > 0 && (
              <div className="mx-3 md:mx-4 mt-3 md:mt-4 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 break-words">
                  ⚠️ Keywords: {selectedChat.keywordsDetected.join(', ')}
                </p>
              </div>
            )}

            {/* Review Panel */}
            {selectedChat.mode === "pending_review" && selectedChat.aiDraftResponse && (
              <div className="m-3 md:m-4 p-3 md:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <h4 className="font-semibold text-yellow-400 text-sm md:text-base">🤖 AI Draft Response</h4>
                  <button onClick={() => setShowReviewPanel(!showReviewPanel)} className="text-xs text-slate-400">
                    {showReviewPanel ? 'Hide' : 'Review'}
                  </button>
                </div>
                {showReviewPanel && (
                  <>
                    <p className="text-white text-sm mb-3 p-3 bg-slate-800 rounded-lg break-words">
                      {selectedChat.aiDraftResponse}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleReviewResponse('approve')}
                        className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => {
                          const edited = prompt('Edit response:', selectedChat.aiDraftResponse);
                          if (edited) handleReviewResponse('edit', edited);
                        }}
                        className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleReviewResponse('reject')}
                        className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
              {selectedChat.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-lg px-3 md:px-4 py-2 ${msg.role === "user"
                      ? "bg-emerald-500 text-white"
                      : msg.role === "admin"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700 text-slate-200"
                      }`}
                  >
                    <div className="text-xs opacity-75 mb-1 flex flex-wrap gap-1">
                      <span>
                        {msg.role === "user" ? selectedChat.userId?.name || "User" :
                          msg.role === "admin" ? `👨‍💼 ${msg.senderName || "Admin"}` : "🤖 AI"}
                      </span>
                      <span className="text-[10px] opacity-50">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 md:p-4 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={selectedChat.mode === "human" ? "Type your message... (Enter to send)" : "Take over to respond..."}
                  disabled={selectedChat.mode !== "human"}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 md:px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50 text-sm md:text-base"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !messageInput.trim() || selectedChat.mode !== "human"}
                  className="px-4 md:px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
              {selectedChat.mode !== "human" && (
                <p className="text-xs text-yellow-500 mt-2">
                  ℹ️ Click "Take Over Chat" to respond manually
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                <span className="text-3xl md:text-4xl">💬</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No Chat Selected</h3>
              <p className="text-sm text-slate-400">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}