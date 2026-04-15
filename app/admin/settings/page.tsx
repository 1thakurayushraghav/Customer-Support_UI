"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import {
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Bell,
  Palette,
  Database,
  Key,
  Mail,
  Globe,
  Lock,
  Users,
  MessageSquare,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  X
} from "lucide-react";

interface Settings {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  contactEmail: string;
  supportEmail: string;
  
  // AI Settings
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  aiContextLength: number;
  aiResponseTimeout: number;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  twoFactorAuth: boolean;
  passwordExpiryDays: number;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;
  adminAlertEmail: string;
  
  // Chat Settings
  maxMessageLength: number;
  chatHistoryDays: number;
  autoEscalateAfter: number;
  requireHumanReview: boolean;
  
  // Rate Limits
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  
  // Integration Settings
  enableAnalytics: boolean;
  enableLogging: boolean;
  logRetentionDays: number;
}

interface ApiResponse {
  success: boolean;
  data?: Settings;
  message?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string }>({ title: "", message: "" });
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Fetch settings
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/settings");
      if (res.data.success) {
        setSettings(res.data.data);
      } else {
        setError(res.data.message || "Failed to fetch settings");
      }
    } catch (err: any) {
      console.error("Failed to fetch settings:", err);
      setError(err.response?.data?.message || "Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update settings
  const updateSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.put("/settings", settings);
      if (res.data.success) {
        setSuccessMessage("Settings saved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(res.data.message || "Failed to save settings");
      }
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    setModalContent({
      title: "Reset Settings",
      message: "Are you sure you want to reset all settings to default values? This action cannot be undone."
    });
    setIsModalOpen(true);
  };

  const confirmReset = async () => {
    setIsModalOpen(false);
    setSaving(true);
    try {
      const res = await api.post("/settings/reset");
      if (res.data.success) {
        setSettings(res.data.data);
        setSuccessMessage("Settings reset to defaults!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset settings");
    } finally {
      setSaving(false);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: "general", label: "General", icon: <Globe className="w-4 h-4" /> },
    { id: "ai", label: "AI Settings", icon: <Brain className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "integrations", label: "Integrations", icon: <Database className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-48"></div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
          <button
            onClick={fetchSettings}
            className="mt-3 px-4 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure your application preferences</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            disabled={saving}
            className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg flex items-center gap-2 transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button
            onClick={updateSettings}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg flex items-center gap-2 transition font-semibold"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 bg-emerald-500/20 border border-emerald-500 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-400 text-sm">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs - Desktop & Mobile */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700 p-4 md:p-6">
        {/* General Settings */}
        {activeTab === "general" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">General Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="QESPL Admin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="admin@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="AI-powered customer support platform"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="support@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Site Logo URL</label>
                <input
                  type="text"
                  value={settings.siteLogo}
                  onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="/logo.png"
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Settings */}
        {activeTab === "ai" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">AI Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">AI Model</label>
                <select
                  value={settings.aiModel}
                  onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude 3</option>
                  <option value="llama-2">Llama 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Temperature ({settings.aiTemperature})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.aiTemperature}
                  onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">Lower = more focused, Higher = more creative</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Max Tokens</label>
                <input
                  type="number"
                  value={settings.aiMaxTokens}
                  onChange={(e) => setSettings({ ...settings, aiMaxTokens: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Response Timeout (seconds)</label>
                <input
                  type="number"
                  value={settings.aiResponseTimeout}
                  onChange={(e) => setSettings({ ...settings, aiResponseTimeout: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Context Length (messages)</label>
                <input
                  type="number"
                  value={settings.aiContextLength}
                  onChange={(e) => setSettings({ ...settings, aiContextLength: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Security Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Password Expiry (days)</label>
                <input
                  type="number"
                  value={settings.passwordExpiryDays}
                  onChange={(e) => setSettings({ ...settings, passwordExpiryDays: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Two-Factor Authentication</label>
                  <p className="text-xs text-slate-500">Require 2FA for admin accounts</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.twoFactorAuth ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.twoFactorAuth ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === "notifications" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Notification Settings</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Email Notifications</label>
                  <p className="text-xs text-slate-500">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.emailNotifications ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Push Notifications</label>
                  <p className="text-xs text-slate-500">Receive browser push notifications</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.pushNotifications ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.pushNotifications ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Notification Sound</label>
                  <p className="text-xs text-slate-500">Play sound for new notifications</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, notificationSound: !settings.notificationSound })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.notificationSound ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.notificationSound ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Admin Alert Email</label>
                <input
                  type="email"
                  value={settings.adminAlertEmail}
                  onChange={(e) => setSettings({ ...settings, adminAlertEmail: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="alerts@example.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Settings */}
        {activeTab === "chat" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Chat Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Max Message Length (characters)</label>
                <input
                  type="number"
                  value={settings.maxMessageLength}
                  onChange={(e) => setSettings({ ...settings, maxMessageLength: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Chat History (days)</label>
                <input
                  type="number"
                  value={settings.chatHistoryDays}
                  onChange={(e) => setSettings({ ...settings, chatHistoryDays: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Auto Escalate After (minutes)</label>
                <input
                  type="number"
                  value={settings.autoEscalateAfter}
                  onChange={(e) => setSettings({ ...settings, autoEscalateAfter: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Require Human Review</label>
                  <p className="text-xs text-slate-500">Review AI responses before sending</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, requireHumanReview: !settings.requireHumanReview })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.requireHumanReview ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.requireHumanReview ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Settings */}
        {activeTab === "integrations" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Integrations</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Enable Analytics</label>
                  <p className="text-xs text-slate-500">Track user behavior and metrics</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableAnalytics: !settings.enableAnalytics })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.enableAnalytics ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.enableAnalytics ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Enable Logging</label>
                  <p className="text-xs text-slate-500">Store system logs for debugging</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableLogging: !settings.enableLogging })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.enableLogging ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.enableLogging ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Log Retention (days)</label>
                <input
                  type="number"
                  value={settings.logRetentionDays}
                  onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Rate Limit (per minute)</label>
                  <input
                    type="number"
                    value={settings.rateLimitPerMinute}
                    onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: parseInt(e.target.value) })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Rate Limit (per hour)</label>
                  <input
                    type="number"
                    value={settings.rateLimitPerHour}
                    onChange={(e) => setSettings({ ...settings, rateLimitPerHour: parseInt(e.target.value) })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Rate Limit (per day)</label>
                  <input
                    type="number"
                    value={settings.rateLimitPerDay}
                    onChange={(e) => setSettings({ ...settings, rateLimitPerDay: parseInt(e.target.value) })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-900 rounded-2xl w-[90%] max-w-[400px] p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{modalContent.title}</h3>
              <p className="text-sm text-slate-400">{modalContent.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 px-4 py-2 bg-yellow-500 rounded-lg text-white hover:bg-yellow-600"
              >
                Reset
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Brain Icon Component (since it's not in lucide-react by default)
function Brain({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 4a4 4 0 0 1 3.5 6A4 4 0 0 1 12 18a4 4 0 0 1-3.5-6A4 4 0 0 1 12 4z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}