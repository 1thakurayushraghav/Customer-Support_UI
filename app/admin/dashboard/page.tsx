"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    conversations: 0,
    messages: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/admin/stats");
        setStats(res.data);
        
        // Fetch recent conversations for activity feed
        const conversationsRes = await api.get("/admin/conversations?limit=5");
        setRecentActivity(conversationsRes.data?.conversations || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.users,
      icon: "👥",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      onClick: () => router.push("/admin/users"),
      change: "+12%",
      trend: "up"
    },
    {
      title: "Conversations",
      value: stats.conversations,
      icon: "💬",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      onClick: () => router.push("/admin/conversations"),
      change: "+8%",
      trend: "up"
    },
    {
      title: "Total Messages",
      value: stats.messages,
      icon: "📝",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      onClick: () => router.push("/admin/conversations"),
      change: "+23%",
      trend: "up"
    }
  ];

  const quickActions = [
    { title: "View All Conversations", icon: "💬", path: "/admin/conversations", color: "bg-emerald-500" },
    { title: "Manage Users", icon: "👥", path: "/admin/users", color: "bg-blue-500" },
    { title: "AI Training", icon: "🤖", path: "/admin/training", color: "bg-purple-500" },
    { title: "Analytics Report", icon: "📊", path: "/admin/analytics", color: "bg-orange-500" }
  ];

  const formatDate = (date?: string) => {
    if (!date) return "Unknown";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`relative overflow-hidden bg-slate-900/50 backdrop-blur-sm border ${stat.borderColor} rounded-xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 group`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span>{stat.change}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              
              <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
              <h2 className="text-3xl font-bold text-white">
                {loading ? "..." : stat.value.toLocaleString()}
              </h2>
              
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-slate-500">Click to view details →</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row - Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Quick Actions */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>⚡</span> Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.path)}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-all group"
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center text-sm`}>
                  {action.icon}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  {action.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔄</span> Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  onClick={() => router.push("/admin/conversations")}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {activity.userId?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {activity.userId?.name || "Anonymous User"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {activity.messages?.[activity.messages.length - 1]?.content?.substring(0, 50) || "No message"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(activity.updatedAt)}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">
                    {activity.messages?.length || 0} msgs
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400">No recent activity</p>
              </div>
            )}
          </div>
          
          {recentActivity.length > 0 && (
            <button
              onClick={() => router.push("/admin/conversations")}
              className="mt-4 w-full text-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View all conversations →
            </button>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🖥️</span> System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">API Status</span>
            </div>
            <span className="text-xs text-green-400">Operational</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Database</span>
            </div>
            <span className="text-xs text-green-400">Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">AI Service</span>
            </div>
            <span className="text-xs text-yellow-400">Active</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-slate-300">Loading dashboard data...</p>
          </div>
        </div>
      )}
    </div>
  );
}