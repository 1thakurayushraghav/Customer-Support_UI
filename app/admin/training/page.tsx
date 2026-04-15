"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

interface TrainingItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  priority: "high" | "medium" | "low";
  usageCount: number;
  lastUsed?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TrainingPage() {
  const [data, setData] = useState<TrainingItem[]>([]);
  const [selected, setSelected] = useState<TrainingItem | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "",
    keywords: "",
    priority: "medium" as "high" | "medium" | "low"
  });

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (isMobileMenuOpen || isFormModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen, isFormModalOpen, isDeleteModalOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/training", {
        params: { search, category, page }
      });
      setData(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to fetch training:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, category, page]);

  const handleSave = async () => {
    try {
      await api.post("/training", {
        ...form,
        keywords: form.keywords.split(",").map(k => k.trim()).filter(k => k)
      });
      resetForm();
      setIsFormModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save training:", err);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      await api.put(`/training/${selected._id}`, {
        question: selected.question,
        answer: selected.answer,
        category: selected.category,
        keywords: selected.keywords,
        priority: selected.priority
      });
      setEditing(false);
      setIsFormModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update training:", err);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/training/${itemToDelete}`);
      if (selected?._id === itemToDelete) setSelected(null);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete training:", err);
    }
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setForm({
      question: "",
      answer: "",
      category: "",
      keywords: "",
      priority: "medium"
    });
    setEditing(false);
    setSelected(null);
  };

  const openAddForm = () => {
    resetForm();
    setEditing(false);
    setIsFormModalOpen(true);
  };

  const openEditForm = () => {
    setEditing(true);
    setIsFormModalOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-green-400";
      default: return "text-slate-400";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 border-red-500/30";
      case "medium": return "bg-yellow-500/20 border-yellow-500/30";
      case "low": return "bg-green-500/20 border-green-500/30";
      default: return "bg-slate-800";
    }
  };

  // Training Card Component for Mobile Grid
  const TrainingCard = ({ item, onClick }: { item: TrainingItem; onClick: () => void }) => (
    <div
      onClick={onClick}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-white text-sm flex-1 line-clamp-2">
          {item.question}
        </h4>
        <span className={`text-xs font-medium ml-2 px-2 py-0.5 rounded-full ${getPriorityColor(item.priority)} bg-slate-900`}>
          {item.priority}
        </span>
      </div>
      
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
        {item.answer.substring(0, 100)}
      </p>
      
      <div className="flex items-center justify-between">
        {item.category && (
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>📊 {item.usageCount}</span>
          {item.keywords?.length > 0 && (
            <span>🏷️ {item.keywords.length}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-3 md:p-4">
      
      {/* Header with Add Button */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">AI Training</h1>
            <p className="text-sm text-slate-400">Manage Q&A pairs for AI responses</p>
          </div>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            + Add New Training
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              placeholder="🔍 Search by question, answer, or keywords..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full p-2.5 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="w-full p-2.5 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-white"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="support">Support</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats and View Toggle */}
      <div className="mb-3 flex justify-between items-center">
        <div className="text-xs text-slate-400">
          Total: {data.length} items • Page {page} of {totalPages}
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-white"
        >
          {isMobileMenuOpen ? "Show Grid" : "Show List"}
        </button>
      </div>

      {/* Main Content Area - Desktop Table View / Mobile Grid View */}
      <div className="flex-1 min-h-0">
        
        {/* Desktop Table View */}
        <div className="hidden md:block bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Question</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Answer</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Category</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Priority</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Usage</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">Loading...</td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">No training data found</td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => setSelected(item)}
                      className={`border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition ${selected?._id === item._id ? "bg-slate-800/70" : ""
                        }`}
                    >
                      <td className="p-3">
                        <p className="text-sm text-white line-clamp-2">{item.question}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-slate-300 line-clamp-2">{item.answer}</p>
                      </td>
                      <td className="p-3">
                        {item.category && (
                          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-400">{item.usageCount}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(item);
                              openEditForm();
                            }}
                            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(item._id);
                            }}
                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 text-white"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 text-white"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Mobile Grid View */}
        <div className="md:hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No training data found</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {data.map((item) => (
                <TrainingCard
                  key={item._id}
                  item={item}
                  onClick={() => {
                    setSelected(item);
                    setIsMobileMenuOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 p-3 flex justify-between items-center bg-slate-800/50 rounded-lg">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Detail Modal */}
      {isMobileMenuOpen && selected && (
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
              <h3 className="font-semibold text-white text-lg">Training Details</h3>
              <div className="flex gap-2">
                <button
                  onClick={openEditForm}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDelete(selected._id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Question</label>
                <p className="text-white text-sm bg-slate-800 p-3 rounded-lg">{selected.question}</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Answer</label>
                <p className="text-white text-sm bg-slate-800 p-3 rounded-lg whitespace-pre-wrap">{selected.answer}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Category</label>
                  <p className="text-white text-sm bg-slate-800 p-3 rounded-lg">{selected.category || "Uncategorized"}</p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Priority</label>
                  <p className={`text-sm bg-slate-800 p-3 rounded-lg ${getPriorityColor(selected.priority)}`}>
                    {selected.priority}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Keywords</label>
                <div className="flex flex-wrap gap-2">
                  {selected.keywords?.map((kw, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-300">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                <span>📊 Used: {selected.usageCount} times</span>
                <span>📅 Created: {new Date(selected.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Form Modal */}
      {isFormModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setIsFormModalOpen(false)}
          />
          <div
            ref={modalRef}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-slate-900 rounded-t-2xl md:rounded-2xl max-h-[85vh] md:max-h-[90vh] md:w-[600px] overflow-y-auto"
          >
            <div className="sticky top-0 bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-white text-lg">
                {editing ? "Edit Training" : "Add New Training"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Question *</label>
                <input
                  placeholder="e.g., How do I reset my password?"
                  value={editing ? selected?.question : form.question}
                  onChange={e => editing 
                    ? setSelected({ ...selected!, question: e.target.value })
                    : setForm({ ...form, question: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Answer *</label>
                <textarea
                  placeholder="Detailed answer to the question..."
                  rows={5}
                  value={editing ? selected?.answer : form.answer}
                  onChange={e => editing
                    ? setSelected({ ...selected!, answer: e.target.value })
                    : setForm({ ...form, answer: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select
                    value={editing ? selected?.category : form.category}
                    onChange={e => editing
                      ? setSelected({ ...selected!, category: e.target.value })
                      : setForm({ ...form, category: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-white"
                  >
                    <option value="">Select category</option>
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="support">Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Priority</label>
                  <select
                    value={editing ? selected?.priority : form.priority}
                    onChange={e => editing
                      ? setSelected({ ...selected!, priority: e.target.value as any })
                      : setForm({ ...form, priority: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Keywords (comma separated)
                </label>
                <input
                  placeholder="password, reset, account, security"
                  value={editing ? selected?.keywords?.join(", ") : form.keywords}
                  onChange={e => editing
                    ? setSelected({ ...selected!, keywords: e.target.value.split(",").map(k => k.trim()) })
                    : setForm({ ...form, keywords: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-800 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 text-white"
                />
              </div>

              <button
                onClick={editing ? handleUpdate : handleSave}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 rounded-lg hover:shadow-lg transition font-semibold text-white"
              >
                {editing ? "Update Training" : "Save Training"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-900 rounded-2xl w-[90%] max-w-[320px] p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Training Item</h3>
              <p className="text-sm text-slate-400">Are you sure you want to delete this training item? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}