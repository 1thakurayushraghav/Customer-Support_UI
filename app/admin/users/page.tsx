"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { debounce } from "lodash";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Shield,
  User,
  Trash2,
  Save,
  RefreshCw,
  Mail,
  Calendar,
  AlertCircle,
  Download,
  Eye
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  conversationsCount?: number;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  users: number;
}

export default function UsersPage() {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    users: 0
  });

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [sortBy, setSortBy] = useState<keyof User>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showDeleteConfirm || isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showDeleteConfirm, isMobileMenuOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDeleteConfirm(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Fetch users with debounced search
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/users", {
        params: {
          search,
          role: role !== "all" ? role : undefined,
          status: status !== "all" ? status : undefined,
          page,
          limit: 10,
          sortBy,
          sortOrder,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      setUsers(res.data.data);
      setPages(res.data.pages);
      setTotalUsers(res.data.total);
      setStats(res.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page, sortBy, sortOrder, dateRange]);

  const debouncedFetch = useCallback(
    debounce(() => fetchUsers(), 300),
    [fetchUsers]
  );

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [search, role, status, page, sortBy, sortOrder, dateRange, debouncedFetch]);

  // Fetch user details with stats
  const fetchUserDetails = async (userId: string, isMobile: boolean = false) => {
  try {
    const res = await api.get(`/users/${userId}`);
    setSelectedUser({ ...res.data.user, conversationsCount: res.data.conversationsCount });
    if (isMobile) {
      setIsMobileMenuOpen(true);
    }
  } catch (err) {
    console.error("Failed to fetch user details", err);
  }
};

  // Update user
  const updateUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await api.put(`/users/${selectedUser._id}`, {
        role: selectedUser.role,
        isActive: selectedUser.isActive
      });
      showToast("User updated successfully!");
      fetchUsers();
    } catch (err) {
      setError("Failed to update user");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete single user
  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/users/${id}`);
      showToast("User deleted successfully!");
      if (selectedUser?._id === id) setSelectedUser(null);
      setUserToDelete(null);
      setShowDeleteConfirm(false);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError("Failed to delete user");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete users
  const bulkDeleteUsers = async () => {
    setLoading(true);
    try {
      await Promise.all(selectedUsers.map(id => api.delete(`/users/${id}`)));
      showToast(`${selectedUsers.length} users deleted successfully!`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setError("Failed to delete some users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bulk update status
  const bulkUpdateStatus = async (status: boolean) => {
    setLoading(true);
    try {
      await Promise.all(
        selectedUsers.map(id =>
          api.put(`/users/${id}`, { isActive: status })
        )
      );
      showToast(`${selectedUsers.length} users ${status ? 'activated' : 'deactivated'}!`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setError("Failed to update users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export users data
  const exportUsers = () => {
    const exportData = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.isActive ? "Active" : "Inactive",
      "Created At": new Date(user.createdAt).toLocaleDateString(),
      "Conversations": user.conversationsCount || 0
    }));

    const csv = [
      Object.keys(exportData[0]).join(","),
      ...exportData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Show toast notification
  const showToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Toggle user selection for bulk actions
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Toggle all users selection
  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setDateRange({ start: "", end: "" });
    setPage(1);
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  // User Card Component for Mobile
  const UserCard = ({ user, onClick }: { user: User; onClick: () => void }) => (
    <div
      onClick={onClick}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold">
            {user.name?.charAt(0) || "U"}
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">{user.name}</h4>
            <p className="text-xs text-slate-400 truncate max-w-[180px]">{user.email}</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={selectedUsers.includes(user._id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleUserSelection(user._id);
          }}
          className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
          ? 'bg-purple-500/20 text-purple-300'
          : 'bg-blue-500/20 text-blue-300'
          }`}>
          {user.role}
        </span>
        <span className={`flex items-center gap-1 text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'
          }`}>
          {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>📅 {new Date(user.createdAt).toLocaleDateString()}</span>
        <span>💬 {user.conversationsCount || 0} chats</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 md:p-6">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 left-4 md:left-auto z-50 animate-slide-in">
          <div className="bg-emerald-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm md:text-base">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
            <p className="text-sm text-slate-400 mt-1">Manage users, roles, and permissions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportUsers}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm md:text-base"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => fetchUsers()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm md:text-base"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards - Grid System */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 md:p-4 border border-slate-700">
            <p className="text-emerald-200 text-xs md:text-sm">Total Users</p>
            <p className="text-xl md:text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 md:p-4 border border-slate-700">
            <p className="text-green-200 text-xs md:text-sm">Active</p>
            <p className="text-xl md:text-2xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 md:p-4 border border-slate-700">
            <p className="text-red-200 text-xs md:text-sm">Inactive</p>
            <p className="text-xl md:text-2xl font-bold text-red-400">{stats.inactive}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 md:p-4 border border-slate-700">
            <p className="text-purple-200 text-xs md:text-sm">Admins</p>
            <p className="text-xl md:text-2xl font-bold text-purple-400">{stats.admins}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 md:p-4 border border-slate-700 col-span-2 sm:col-span-1">
            <p className="text-yellow-200 text-xs md:text-sm">Regular Users</p>
            <p className="text-xl md:text-2xl font-bold text-yellow-400">{stats.users}</p>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-3 md:p-4 border border-slate-700">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 md:px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2 text-white transition text-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {(role !== "all" || status !== "all" || dateRange.start || dateRange.end) && (
                  <span className="bg-emerald-500 text-xs px-1.5 py-0.5 rounded-full">!</span>
                )}
              </button>

              {(role !== "all" || status !== "all" || search || dateRange.start || dateRange.end) && (
                <button
                  onClick={resetFilters}
                  className="px-3 md:px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg flex items-center gap-2 transition text-sm"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="flex gap-2">
                <input
                  type="date"
                  placeholder="From"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                />
                <input
                  type="date"
                  placeholder="To"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-emerald-600/20 backdrop-blur-lg rounded-xl p-3 md:p-4 border border-emerald-500/50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-white text-sm">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => bulkUpdateStatus(true)}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
              >
                Activate All
              </button>
              <button
                onClick={() => bulkUpdateStatus(false)}
                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition"
              >
                Deactivate All
              </button>
              <button
                onClick={bulkDeleteUsers}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
              >
                Delete All
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Content - Desktop Table View */}
        {/* Main Content - Two Column Grid for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Users Table (takes 2 columns on desktop) */}
          <div className="lg:col-span-2">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="p-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="p-4 text-left text-sm font-medium text-slate-300">User</th>
                      <th className="p-4 text-left text-sm font-medium text-slate-300">Role</th>
                      <th className="p-4 text-left text-sm font-medium text-slate-300">Status</th>
                      <th className="p-4 text-left text-sm font-medium text-slate-300">Joined</th>
                      <th className="p-4 text-left text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-red-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          {error}
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user._id}
                          className={`border-b border-slate-700/50 hover:bg-slate-700/50 transition cursor-pointer ${selectedUser?._id === user._id ? 'bg-emerald-600/20' : ''
                            }`}
                          onClick={() => {
                            setSelectedUser(user);
                          
                          }}
                        >
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={() => toggleUserSelection(user._id)}
                              className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-blue-500/20 text-blue-300'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`flex items-center gap-1 text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'
                              }`}>
                              {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setUserToDelete(user._id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-400 hover:text-red-300 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="p-4 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-sm text-slate-400">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalUsers)} of {totalUsers} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                    >
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                        let pageNum;
                        if (pages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= pages - 2) pageNum = pages - 4 + i;
                        else pageNum = page - 2 + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-1 rounded-lg transition ${page === pageNum
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="p-2 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                    >
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>

           
          </div>

          {/* Right Column - User Details Panel (takes 1 column on desktop) */}
          <div className="hidden lg:block">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-6 sticky top-6">
              {selectedUser ? (
                <div className="space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-white">User Details</h2>
                      <p className="text-xs text-slate-400 mt-0.5">View and manage user information</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-slate-400 hover:text-white transition p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* User Avatar & Basic Info */}
                  <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">
                        {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{selectedUser.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="break-all">{selectedUser.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* User Details Form */}
                  <div className="space-y-3">
                    {/* Role Selection */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Role</p>
                        <p className="text-xs text-slate-500">User permissions level</p>
                      </div>
                      <select
                        value={selectedUser.role}
                        onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                        className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">👑 Admin</option>
                      </select>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Status</p>
                        <p className="text-xs text-slate-500">Account access level</p>
                      </div>
                      <button
                        onClick={() => setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${selectedUser.isActive
                            ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                            : 'bg-red-600/20 text-red-400 border border-red-500/30'
                          }`}
                      >
                        {selectedUser.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </div>

                    {/* Conversations Count */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Conversations</p>
                        <p className="text-xs text-slate-500">Total chat interactions</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-emerald-400">
                          {selectedUser.conversationsCount || 0}
                        </span>
                        <span className="text-xs text-slate-500">chats</span>
                      </div>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Member Since</p>
                        <p className="text-xs text-slate-500">Account creation date</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-white">
                          {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Last Login (if available) */}
                    {selectedUser.lastLogin && (
                      <div className="flex items-center justify-between py-3 border-b border-slate-700">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Last Login</p>
                          <p className="text-xs text-slate-500">Recent activity</p>
                        </div>
                        <span className="text-sm text-white">
                          {new Date(selectedUser.lastLogin).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={updateUser}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 font-semibold shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(selectedUser._id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition border border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-slate-400 py-12">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <User className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="font-medium text-white">No User Selected</p>
                  <p className="text-sm mt-2">Click on any user from the list<br />to view and edit details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Grid View */}
        <div className="lg:hidden">
          {loading && users.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 bg-slate-800/50 rounded-xl p-6">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-800/50 rounded-xl p-6">
              No users found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {users.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onClick={() => fetchUserDetails(user._id, true)}
                />
              ))}
            </div>
          )}

          {/* Mobile Pagination */}
          {pages > 1 && (
            <div className="mt-4 p-3 flex justify-between items-center bg-slate-800/50 rounded-lg">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <span className="text-sm text-slate-400">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile User Detail Modal */}
        {isMobileMenuOpen && selectedUser && (
          <>
            <div
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div
              ref={modalRef}
              className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl p-4 border-b border-slate-700 rounded-t-2xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-lg">User Details</h3>
                  <p className="text-xs text-slate-400">View and manage user information</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-5">
                {/* User Avatar & Basic Info */}
                <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{selectedUser.name}</h2>
                    <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="break-all">{selectedUser.email}</span>
                    </div>
                  </div>
                </div>

                {/* User Details Form */}
                <div className="space-y-4">
                  {/* Role Selection */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Role</p>
                      <p className="text-xs text-slate-500">User permissions level</p>
                    </div>
                    <select
                      value={selectedUser.role}
                      onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Status</p>
                      <p className="text-xs text-slate-500">Account access level</p>
                    </div>
                    <button
                      onClick={() => setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${selectedUser.isActive
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                        : 'bg-red-600/20 text-red-400 border border-red-500/30'
                        }`}
                    >
                      {selectedUser.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>

                  {/* Conversations Count */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Conversations</p>
                      <p className="text-xs text-slate-500">Total chat interactions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-400">
                        {selectedUser.conversationsCount || 0}
                      </span>
                      <span className="text-xs text-slate-500">chats</span>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-between py-3 border-b border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Member Since</p>
                      <p className="text-xs text-slate-500">Account creation date</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-white">
                        {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Last Login (if available) */}
                  {selectedUser.lastLogin && (
                    <div className="flex items-center justify-between py-3 border-b border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-400">Last Login</p>
                        <p className="text-xs text-slate-500">Recent activity</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">
                          {new Date(selectedUser.lastLogin).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={updateUser}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 font-semibold shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setUserToDelete(selectedUser._id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </button>
                </div>

                {/* Close Button at Bottom */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition text-sm font-medium mt-2"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete User</h3>
              <p className="text-sm text-slate-400">Are you sure you want to delete this user? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => userToDelete && deleteUser(userToDelete)}
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