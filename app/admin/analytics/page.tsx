"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

interface AnalyticsData {
  totalConversations?: number;
  activeConversations?: number;
  escalated?: number;
  trainingResponses?: number;
  aiResponses?: number;
  satisfaction?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  dailyMessages?: Array<{
    date: string;
    count: number;
  }>;
  keywords?: Array<{
    keyword: string;
    count: number;
  }>;
  topQuestions?: Array<{
    question: string;
    count: number;
  }>;
  responseTime?: {
    avg: number;
    min: number;
    max: number;
  };
  popularCategories?: Array<{
    category: string;
    count: number;
  }>;
  usageByHour?: Array<{
    hour: number;
    count: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "all">("7days");
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "pdf">("json");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (showExportModal || isDetailModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showExportModal, isDetailModalOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowExportModal(false);
        setIsDetailModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/analytics", {
        params: { range: timeRange }
      });

      const safeData = {
        totalConversations: res.data?.totalConversations || 0,
        activeConversations: res.data?.activeConversations || 0,
        escalated: res.data?.escalated || 0,
        trainingResponses: res.data?.trainingResponses || 0,
        aiResponses: res.data?.aiResponses || 0,
        satisfaction: res.data?.satisfaction || { positive: 0, neutral: 0, negative: 0 },
        dailyMessages: res.data?.dailyMessages || [],
        keywords: res.data?.keywords || [],
        topQuestions: res.data?.topQuestions || [],
        responseTime: res.data?.responseTime || { avg: 0, min: 0, max: 0 },
        popularCategories: res.data?.popularCategories || [],
        usageByHour: res.data?.usageByHour || []
      };

      setData(safeData);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      if (err.code === "ERR_NETWORK") {
        setError("Cannot connect to backend server. Please make sure the backend is running.");
      } else if (err.response?.status === 401) {
        setError("Authentication required. Please login again.");
      } else {
        setError(err.response?.data?.error || "Failed to fetch analytics data");
      }

      setData({
        totalConversations: 0,
        activeConversations: 0,
        escalated: 0,
        trainingResponses: 0,
        aiResponses: 0,
        satisfaction: { positive: 0, neutral: 0, negative: 0 },
        dailyMessages: [],
        keywords: [],
        topQuestions: [],
        responseTime: { avg: 0, min: 0, max: 0 },
        popularCategories: [],
        usageByHour: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Export Functions
  const exportToJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const csvRows: string[] = [];

    // Headers
    csvRows.push(['Metric', 'Value'].join(','));

    // Add data
    if (data) {
      csvRows.push([`Total Conversations`, data.totalConversations || 0].join(','));
      csvRows.push([`Active Conversations`, data.activeConversations || 0].join(','));
      csvRows.push([`Escalated to Human`, data.escalated || 0].join(','));
      csvRows.push([`AI Responses`, data.aiResponses || 0].join(','));
      csvRows.push([`Training Responses`, data.trainingResponses || 0].join(','));

      if (data.satisfaction) {
        csvRows.push([`Positive Satisfaction`, data.satisfaction.positive || 0].join(','));
        csvRows.push([`Neutral Satisfaction`, data.satisfaction.neutral || 0].join(','));
        csvRows.push([`Negative Satisfaction`, data.satisfaction.negative || 0].join(','));
      }

      if (data.responseTime) {
        csvRows.push([`Avg Response Time (s)`, data.responseTime.avg || 0].join(','));
        csvRows.push([`Min Response Time (s)`, data.responseTime.min || 0].join(','));
        csvRows.push([`Max Response Time (s)`, data.responseTime.max || 0].join(','));
      }
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Simple print-based PDF export
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Analytics Report - ${new Date().toLocaleString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .metric { font-weight: bold; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Analytics Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Time Range: ${timeRange === '7days' ? 'Last 7 Days' : timeRange === '30days' ? 'Last 30 Days' : 'All Time'}</p>
            <h2>Key Metrics</h2>
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Total Conversations</td><td>${data?.totalConversations || 0}</td></tr>
              <tr><td>Active Conversations</td><td>${data?.activeConversations || 0}</td></tr>
              <tr><td>Escalated to Human</td><td>${data?.escalated || 0}</td></tr>
              <tr><td>AI Responses</td><td>${data?.aiResponses || 0}</td></tr>
              <tr><td>Training Responses</td><td>${data?.trainingResponses || 0}</td></tr>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExport = () => {
    if (exportFormat === 'json') exportToJSON();
    else if (exportFormat === 'csv') exportToCSV();
    else if (exportFormat === 'pdf') exportToPDF();
    setShowExportModal(false);
  };

  // Card Components
  const StatCard = ({ title, value, icon, color, subtitle, onClick, metricData }: any) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      red: "from-red-500 to-red-600",
      purple: "from-purple-500 to-purple-600",
      emerald: "from-emerald-500 to-emerald-600",
      orange: "from-orange-500 to-orange-600",
      cyan: "from-cyan-500 to-cyan-600"
    };

    return (
      <div
        onClick={onClick}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition cursor-pointer hover:scale-105 transform transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">{title}</p>
          <span className="text-2xl">{icon}</span>
        </div>
        <h2 className="text-2xl font-bold mt-2 bg-gradient-to-r bg-clip-text text-transparent from-white to-slate-300">
          {value}
        </h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    );
  };

  const Bar = ({ label, value, total, color }: any) => {
    const percent = total ? (value / total) * 100 : 0;
    const colorClasses = {
      blue: "bg-blue-500",
      emerald: "bg-emerald-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500"
    } as const; // Add 'as const' to make the type more specific

    // Type assertion to ensure color is a valid key
    const colorClass = colorClasses[color as keyof typeof colorClasses];

    return (
      <div>
        <p className="text-sm mb-1">{label}</p>
        <div className="w-full bg-slate-800 h-8 rounded overflow-hidden">
          <div
            className={`${colorClass} h-8 rounded transition-all flex items-center justify-end px-2 text-xs font-semibold`}
            style={{ width: `${percent}%` }}
          >
            {percent > 15 && `${Math.round(percent)}%`}
          </div>
        </div>
        <p className="text-xs mt-1 text-slate-400">
          {value.toLocaleString()} ({Math.round(percent)}%)
        </p>
      </div>
    );
  };

  const MetricCard = ({ title, value, icon, color, onClick }: any) => {
    return (
      <div
        onClick={onClick}
        className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center hover:border-slate-700 transition cursor-pointer hover:scale-105 transform transition-all duration-200"
      >
        <div className="text-2xl mb-2">{icon}</div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
    );
  };

  const showMetricDetails = (metric: any, title: string) => {
    setSelectedMetric({ data: metric, title });
    setIsDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 text-white">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-48 md:w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 text-white">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm md:text-base">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition text-sm md:text-base"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6 text-white text-center">
        <p className="text-slate-400">No analytics data available</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition"
        >
          Refresh
        </button>
      </div>
    );
  }

  const totalResponses = (data.trainingResponses || 0) + (data.aiResponses || 0);
  const trainingPercent = totalResponses
    ? Math.round(((data.trainingResponses || 0) / totalResponses) * 100)
    : 0;

  const satisfactionScore = (data.satisfaction?.positive || 0) +
    (data.satisfaction?.neutral || 0) +
    (data.satisfaction?.negative || 0);
  const positivePercent = satisfactionScore
    ? Math.round(((data.satisfaction?.positive || 0) / satisfactionScore) * 100)
    : 0;

  const maxDailyMessages = data.dailyMessages && data.dailyMessages.length > 0
    ? Math.max(...data.dailyMessages.map(d => d.count), 1)
    : 1;

  const maxHourlyUsage = data.usageByHour && data.usageByHour.length > 0
    ? Math.max(...data.usageByHour.map(h => h.count), 1)
    : 1;

  return (
    <div className="p-3 md:p-6 text-white space-y-4 md:space-y-6">

      {/* HEADER WITH TIME RANGE FILTER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">📊 Analytics Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Track your AI performance metrics</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => setTimeRange("7days")}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition text-sm ${timeRange === "7days"
                ? "bg-emerald-500 text-white"
                : "text-slate-400 hover:text-white"
                }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange("30days")}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition text-sm ${timeRange === "30days"
                ? "bg-emerald-500 text-white"
                : "text-slate-400 hover:text-white"
                }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition text-sm ${timeRange === "all"
                ? "bg-emerald-500 text-white"
                : "text-slate-400 hover:text-white"
                }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition flex items-center gap-2 text-sm"
          >
            📥 Export
          </button>
        </div>
      </div>

      {/* STATS CARDS - Grid System */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Conversations"
          value={(data.totalConversations || 0).toLocaleString()}
          icon="💬"
          color="blue"
          onClick={() => showMetricDetails({ total: data.totalConversations }, "Total Conversations")}
        />
        <StatCard
          title="Active Conversations"
          value={(data.activeConversations || 0).toLocaleString()}
          icon="🟢"
          color="green"
          onClick={() => showMetricDetails({ active: data.activeConversations }, "Active Conversations")}
        />
        <StatCard
          title="Escalated to Human"
          value={(data.escalated || 0).toLocaleString()}
          icon="⚠️"
          color="red"
          onClick={() => showMetricDetails({ escalated: data.escalated }, "Escalated Conversations")}
        />
        <StatCard
          title="Training Usage"
          value={`${trainingPercent}%`}
          icon="📚"
          color="purple"
          subtitle={`${(data.trainingResponses || 0).toLocaleString()} of ${totalResponses.toLocaleString()} responses`}
          onClick={() => showMetricDetails({ trainingResponses: data.trainingResponses, aiResponses: data.aiResponses, total: totalResponses, percent: trainingPercent }, "Response Distribution")}
        />
      </div>

      {/* SATISFACTION SCORE */}
      {satisfactionScore > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
            <h2 className="text-base md:text-lg font-semibold">Customer Satisfaction</h2>
            <span className="text-xs md:text-sm text-slate-400">
              {(data.satisfaction?.positive || 0)} positive responses
            </span>
          </div>
          <div className="flex gap-1 h-8 rounded overflow-hidden">
            <div
              className="bg-green-500 transition-all cursor-pointer hover:opacity-80"
              style={{ width: `${positivePercent}%` }}
              title={`Positive: ${data.satisfaction?.positive || 0}`}
              onClick={() => showMetricDetails({ type: 'positive', count: data.satisfaction?.positive, percent: positivePercent }, "Positive Feedback")}
            />
            <div
              className="bg-yellow-500 transition-all cursor-pointer hover:opacity-80"
              style={{ width: `${Math.round(((data.satisfaction?.neutral || 0) / satisfactionScore) * 100)}%` }}
              title={`Neutral: ${data.satisfaction?.neutral || 0}`}
              onClick={() => showMetricDetails({ type: 'neutral', count: data.satisfaction?.neutral }, "Neutral Feedback")}
            />
            <div
              className="bg-red-500 transition-all cursor-pointer hover:opacity-80"
              style={{ width: `${Math.round(((data.satisfaction?.negative || 0) / satisfactionScore) * 100)}%` }}
              title={`Negative: ${data.satisfaction?.negative || 0}`}
              onClick={() => showMetricDetails({ type: 'negative', count: data.satisfaction?.negative }, "Negative Feedback")}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">👍 Positive ({data.satisfaction?.positive || 0})</span>
            <span className="flex items-center gap-1">😐 Neutral ({data.satisfaction?.neutral || 0})</span>
            <span className="flex items-center gap-1">👎 Negative ({data.satisfaction?.negative || 0})</span>
          </div>
        </div>
      )}

      {/* AI vs TRAINING USAGE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="text-base md:text-lg font-semibold mb-3">AI vs Training Knowledge Base</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Bar
            label="AI Responses"
            value={data.aiResponses || 0}
            total={totalResponses}
            color="blue"
          />
          <Bar
            label="Training Data"
            value={data.trainingResponses || 0}
            total={totalResponses}
            color="emerald"
          />
        </div>
      </div>

      {/* DAILY MESSAGES CHART */}
      {data.dailyMessages && data.dailyMessages.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-base md:text-lg font-semibold mb-3">Messages (Last {data.dailyMessages.length} Days)</h2>
          <div className="relative overflow-x-auto">
            <div className="flex items-end gap-1 h-40 min-w-[300px]">
              {data.dailyMessages.map((d, i) => (
                <div key={i} className="flex flex-col items-center text-xs flex-1">
                  <div
                    className="bg-emerald-500 w-full rounded-t transition-all hover:bg-emerald-400 cursor-pointer"
                    style={{ height: `${(d.count / maxDailyMessages) * 100}%` }}
                    title={`${d.date}: ${d.count} messages`}
                    onClick={() => showMetricDetails({ date: d.date, count: d.count }, `Messages on ${d.date}`)}
                  />
                  <span className="mt-1 text-slate-400 text-[10px] truncate max-w-full">
                    {d.date?.slice(5) || d.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HOURLY USAGE HEATMAP */}
      {data.usageByHour && data.usageByHour.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-base md:text-lg font-semibold mb-3">Usage by Hour of Day</h2>
          <div className="relative overflow-x-auto">
            <div className="flex gap-1 h-32 min-w-[300px]">
              {data.usageByHour.map((h, i) => (
                <div key={i} className="flex flex-col items-center text-xs flex-1">
                  <div
                    className="bg-blue-500 w-full rounded-t transition-all hover:bg-blue-400 cursor-pointer"
                    style={{ height: `${(h.count / maxHourlyUsage) * 100}%` }}
                    title={`${h.hour}:00 - ${h.count} messages`}
                    onClick={() => showMetricDetails({ hour: h.hour, count: h.count }, `Usage at ${h.hour}:00`)}
                  />
                  <span className="mt-1 text-slate-400 text-[10px]">
                    {h.hour}h
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Hour of day (24h format)</p>
        </div>
      )}

      {/* RESPONSE TIME METRICS */}
      {(data.responseTime && (data.responseTime.avg > 0 || data.responseTime.min > 0 || data.responseTime.max > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <MetricCard
            title="Avg Response Time"
            value={`${data.responseTime?.avg || 0}s`}
            icon="⏱️"
            color="blue"
            onClick={() => showMetricDetails({ avg: data.responseTime?.avg }, "Average Response Time")}
          />
          <MetricCard
            title="Fastest Response"
            value={`${data.responseTime?.min || 0}s`}
            icon="⚡"
            color="green"
            onClick={() => showMetricDetails({ min: data.responseTime?.min }, "Fastest Response Time")}
          />
          <MetricCard
            title="Slowest Response"
            value={`${data.responseTime?.max || 0}s`}
            icon="🐢"
            color="red"
            onClick={() => showMetricDetails({ max: data.responseTime?.max }, "Slowest Response Time")}
          />
        </div>
      )}

      {/* POPULAR CATEGORIES */}
      {data.popularCategories && data.popularCategories.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-base md:text-lg font-semibold mb-3">Popular Categories</h2>
          <div className="space-y-3">
            {data.popularCategories.map((cat, i) => {
              const maxCount = Math.max(...data.popularCategories!.map(c => c.count), 1);
              const percent = (cat.count / maxCount) * 100;
              return (
                <div key={i} className="cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition" onClick={() => showMetricDetails(cat, `Category: ${cat.category}`)}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-slate-300">{cat.category}</span>
                    <span className="text-slate-400">{cat.count} queries</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                    <div
                      className="bg-purple-500 h-2 rounded transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOP QUESTIONS & KEYWORDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Questions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-base md:text-lg font-semibold mb-3">Most Asked Questions</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.topQuestions && data.topQuestions.length > 0 ? (
              data.topQuestions.slice(0, 10).map((q, i) => (
                <div
                  key={i}
                  className="border-b border-slate-800 pb-2 last:border-0 cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition"
                  onClick={() => showMetricDetails(q, `Question: ${q.question}`)}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 truncate flex-1">{q.question}</span>
                    <span className="text-emerald-400 ml-2 font-semibold">{q.count}x</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No questions recorded yet</p>
            )}
          </div>
        </div>

        {/* Keywords Cloud */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-base md:text-lg font-semibold mb-3">Trending Keywords</h2>
          <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
            {data.keywords && data.keywords.length > 0 ? (
              data.keywords.map((k, i) => {
                const maxCount = Math.max(...data.keywords!.map(k => k.count), 1);
                const size = 12 + Math.min(20, (k.count / maxCount) * 20);
                return (
                  <span
                    key={i}
                    className="px-2 md:px-3 py-1 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition cursor-pointer"
                    style={{ fontSize: `${size}px` }}
                    title={`${k.count} occurrences`}
                    onClick={() => showMetricDetails(k, `Keyword: ${k.keyword}`)}
                  >
                    {k.keyword} ({k.count})
                  </span>
                );
              })
            ) : (
              <p className="text-slate-400 text-sm">No keywords recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setShowExportModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-900 rounded-2xl w-[90%] max-w-[400px] p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">📥</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Export Analytics Data</h3>
              <p className="text-sm text-slate-400">Choose your preferred export format</p>
            </div>

            <div className="space-y-3 mb-5">
              <button
                onClick={() => setExportFormat("json")}
                className={`w-full p-3 rounded-lg border transition flex items-center justify-between ${exportFormat === "json"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-800"
                  }`}
              >
                <span>JSON Format</span>
                <span className="text-xs text-slate-400">.json</span>
              </button>
              <button
                onClick={() => setExportFormat("csv")}
                className={`w-full p-3 rounded-lg border transition flex items-center justify-between ${exportFormat === "csv"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-800"
                  }`}
              >
                <span>CSV Format</span>
                <span className="text-xs text-slate-400">.csv</span>
              </button>
              <button
                onClick={() => setExportFormat("pdf")}
                className={`w-full p-3 rounded-lg border transition flex items-center justify-between ${exportFormat === "pdf"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-800"
                  }`}
              >
                <span>PDF Format</span>
                <span className="text-xs text-slate-400">Print/Save as PDF</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600"
              >
                Export
              </button>
            </div>
          </div>
        </>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedMetric && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40"
            onClick={() => setIsDetailModalOpen(false)}
          />
          <div
            ref={modalRef}
            className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-slate-900 rounded-t-2xl md:rounded-2xl max-h-[85vh] md:max-h-[90vh] md:w-[500px] overflow-y-auto"
          >
            <div className="sticky top-0 bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-white text-base md:text-lg">{selectedMetric.title}</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <pre className="bg-slate-800 p-4 rounded-lg text-sm text-slate-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedMetric.data, null, 2)}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}