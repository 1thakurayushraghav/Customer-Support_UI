"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Message = {
  role: string;
  content: string;
};

type User = {
  name: string;
  email: string;
};

type Conversation = {
  _id: string;
  userId?: User;
  messages?: Message[];
  updatedAt?: string;
  createdAt?: string;
  messagesCount?: number;
};

export default function Conversations() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Search and filters
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const limit = 10;

  const router = useRouter();

  const fetchConversations = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `/admin/conversations?page=${page}&limit=${limit}&search=${search}&filterDate=${filterDate}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );

      setConvos(res.data?.conversations || []);
      setPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);

    } catch (err) {
      console.error("Conversation fetch error", err);
      setConvos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [page, search, filterDate, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await api.delete(`/admin/conversations/${id}`);
      fetchConversations();
      if (expanded === id) setExpanded(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete conversation");
    }
  };

  const lastMessage = (c: Conversation) => {
    const msg = c.messages?.[c.messages.length - 1];
    return msg ? msg.content.slice(0, 80) : "No messages";
  };

  const formatDate = (date?: string) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getMessageCount = (c: Conversation) => {
    return c.messages?.length || 0;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Conversations</h1>
        <p className="text-slate-400">Manage and monitor all user conversations</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="🔍 Search by user name, email, or message content..."
              className="w-full bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(filterDate !== "all" || sortBy !== "updatedAt") && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Time Period</label>
                <select
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="updatedAt">Last Updated</option>
                  <option value="createdAt">Created Date</option>
                  <option value="messagesCount">Message Count</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setFilterDate("all");
                setSortBy("updatedAt");
                setSortOrder("desc");
                setSearch("");
                setPage(1);
              }}
              className="mt-4 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {!loading && convos.length > 0 && (
        <div className="mb-4 text-sm text-slate-400">
          Showing {convos.length} of {total} conversations
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-400">Loading conversations...</p>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-4">
        {convos?.map((c) => {
          const open = expanded === c._id;
          const msgCount = getMessageCount(c);

          return (
            <div
              key={c._id}
              className="bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(open ? null : c._id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {c.userId?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {c.userId?.name || "Anonymous User"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {c.userId?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                      {lastMessage(c)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-slate-400 text-xs">Messages</div>
                        <div className="text-white font-semibold">{msgCount}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400 text-xs">Updated</div>
                        <div className="text-white text-xs break-words text-right">
                          {formatDate(c.updatedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c._id);
                        }}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Messages */}
              {open && (
                <div className="border-t border-slate-800 bg-slate-900/50">
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {c.messages && c.messages.length > 0 ? (
                      c.messages.map((m, i) => (
                        <div
                          key={i}
                          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                          <div
                            className={`px-4 py-2 rounded-lg max-w-[70%] ${m.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-200"
                              }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {m.role === "user" ? "User" : "Assistant"}
                            </div>
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {m.content}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 py-4">No messages in this conversation</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {convos.length === 0 && !loading && (
        <div className="text-center py-16 bg-slate-900 rounded-xl border border-slate-800">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-slate-400 text-lg">No conversations found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              let pageNum;
              if (pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pages - 2) {
                pageNum = pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg transition-colors ${page === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            disabled={page === pages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}