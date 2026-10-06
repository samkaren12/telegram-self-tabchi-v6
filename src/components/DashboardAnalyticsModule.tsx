import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Send,
  Inbox,
  Sparkles,
  ShieldAlert,
  Camera,
  Users,
  Zap,
  RefreshCw,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Radio,
  Lightbulb,
  Download,
  Filter,
  Search,
  ChevronDown,
  Terminal,
  Shield,
  Layers,
  Flame,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { ActivityDashboardData, AuditLogEntry } from "../types";
import { CryptoTechnicalAnalysisCard } from "./CryptoTechnicalAnalysisCard";

interface DashboardAnalyticsModuleProps {
  lang: Language;
  onOpenHelp?: (section?: any) => void;
}

export const DashboardAnalyticsModule: React.FC<DashboardAnalyticsModuleProps> = ({
  lang,
  onOpenHelp,
}) => {
  const isRtl = lang === "fa";

  const [data, setData] = useState<ActivityDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");
  const [searchTableQuery, setSearchTableQuery] = useState<string>("");
  const [recentEvents, setRecentEvents] = useState<AuditLogEntry[]>([]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [analyticsRes, logsRes] = await Promise.all([
        fetch("/api/dashboard/analytics"),
        fetch("/api/audit-logs?limit=8"),
      ]);

      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }

      if (logsRes.ok) {
        const jsonLogs = await logsRes.json();
        if (jsonLogs.success && Array.isArray(jsonLogs.logs)) {
          setRecentEvents(jsonLogs.logs);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // 8s live polling
    return () => clearInterval(interval);
  }, []);

  const handleExportReport = () => {
    if (!data) return;
    const report = {
      title: "Real-time Telegram Accounts Activity Report",
      exportedAt: new Date().toISOString(),
      accountFilter: selectedAccountFilter,
      overview: data.overview,
      accountStats: data.accountStats,
      moduleDistribution: data.moduleDistribution,
      timeline: data.hourlyTimeline,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts-activity-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="glass-panel rounded-3xl p-16 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
        <h3 className="text-sm font-bold text-slate-200">
          {isRtl ? "درحال دریافت تحلیل‌ها و آمار زنده سشن‌ها..." : "Loading live session analytics..."}
        </h3>
      </div>
    );
  }

  // Filter stats if a specific account is chosen
  const filteredAccounts = (data?.accountStats || []).filter((acc) => {
    if (selectedAccountFilter !== "all" && acc.phone !== selectedAccountFilter) {
      return false;
    }
    if (searchTableQuery.trim()) {
      const q = searchTableQuery.toLowerCase();
      return (
        acc.phone.toLowerCase().includes(q) ||
        (acc.firstName && acc.firstName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const selectedAccStat = selectedAccountFilter !== "all"
    ? (data?.accountStats || []).find((a) => a.phone === selectedAccountFilter)
    : null;

  const currentOverview = selectedAccStat
    ? {
        totalAccounts: 1,
        onlineAccounts: selectedAccStat.status === "online" ? 1 : 0,
        totalMessagesSentToday: selectedAccStat.totalSent,
        totalMessagesReceivedToday: selectedAccStat.totalReceived,
        avgInteractionRate: selectedAccStat.interactionRate,
        totalMediaSaved: selectedAccStat.savedMediaCount,
        totalBlocked: selectedAccStat.blockedCount,
      }
    : (data?.overview || {
        totalAccounts: 0,
        onlineAccounts: 0,
        totalMessagesSentToday: 0,
        totalMessagesReceivedToday: 0,
        avgInteractionRate: 0,
        totalMediaSaved: 0,
        totalBlocked: 0,
      });

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 shadow-xl shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Activity className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {isRtl ? "داشبورد تحلیلی و مانیتورینگ فعالیت اکانت‌ها" : "Live Account Activity & Monitoring Dashboard"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-mono">
                  LIVE REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isRtl
                  ? "پایش زنده و واقعی عملکرد تمامی حساب‌های تلگرام: تبادل پیام‌ها، نرخ پاسخگویی، ذخیره رسانه‌ها، مسدودسازی مزاحمین و توزیع ماژول‌های فعال."
                  : "Live monitoring of connected Telegram accounts: sent/received interactions, response rate, saved media, and module distribution."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Account Selector Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAccountFilter}
                onChange={(e) => setSelectedAccountFilter(e.target.value)}
                className="bg-transparent text-xs text-white font-medium outline-none cursor-pointer"
              >
                <option value="all">همه حساب‌ها ({data?.accountStats.length || 0})</option>
                {(data?.accountStats || []).map((acc) => (
                  <option key={acc.phone} value={acc.phone}>
                    {acc.phone} {acc.firstName ? `(${acc.firstName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {onOpenHelp && (
              <button
                type="button"
                onClick={() => onOpenHelp("analytics")}
                className="px-3.5 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="راهنمای تحلیل‌ها"
              >
                <Lightbulb className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>راهنما 💡</span>
              </button>
            )}

            <button
              onClick={handleExportReport}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="خروجی فایل JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>خروجی گزارش</span>
            </button>

            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-2 shadow-inner transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span>{refreshing ? "بروزرسانی..." : "تازه‌سازی"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards (6 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Sent */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">پیام‌های ارسالی</span>
            <Send className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {currentOverview.totalMessagesSentToday.toLocaleString()}
          </div>
          <span className="text-[10px] text-cyan-400/90 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            تبچی و برودکست
          </span>
        </div>

        {/* 2. Total Received */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">مخاطبین و تعاملات</span>
            <Inbox className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {currentOverview.totalMessagesReceivedToday.toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-400/90 font-mono flex items-center gap-1">
            <Users className="w-3 h-3" />
            پیوی و گروه‌ها
          </span>
        </div>

        {/* 3. Interaction Rate */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">نرخ تعامل (Rate)</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {currentOverview.avgInteractionRate}%
          </div>
          <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
            <Zap className="w-3 h-3" />
            وضعیت بهینه
          </span>
        </div>

        {/* 4. Saved Media */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">رسانه‌های ذخیره‌شده</span>
            <Camera className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {currentOverview.totalMediaSaved}
          </div>
          <span className="text-[10px] text-teal-400/90 font-mono">
            عکس، فیلم و تایم‌دار
          </span>
        </div>

        {/* 5. Blocked Users */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">مزاحمین مسدود</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 font-mono">
            {currentOverview.totalBlocked}
          </div>
          <span className="text-[10px] text-rose-400/90 font-mono">
            ضد اسپم قفل پیوی
          </span>
        </div>

        {/* 6. Active Accounts */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">اکانت‌های متصل</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {currentOverview.onlineAccounts} / {currentOverview.totalAccounts}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            سشن‌های آنلاین
          </span>
        </div>
      </div>

      {/* Main Charts: 24h Area Timeline & Module Distribution Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 24-Hour Activity Area Chart (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                روند ۲۴ ساعته تبادل پیام‌ها و فعالیت سشن‌ها
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">ساعت رسمی ایران (IRST)</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.hourlyTimeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRecv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#334155",
                    borderRadius: "16px",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sentMessages"
                  name="پیام‌های ارسالی"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSent)"
                />
                <Area
                  type="monotone"
                  dataKey="receivedMessages"
                  name="پیام‌های دریافتی"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRecv)"
                />
                <Area
                  type="monotone"
                  dataKey="autoReplies"
                  name="پاسخ‌های منشی"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAuto)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module Distribution Pie Chart (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">توزیع ماژول‌های فعال</h3>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.moduleDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="activeCount"
                >
                  {(data?.moduleDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {(data?.moduleDistribution || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </span>
                <span className="font-mono text-white font-bold">{item.activeCount} اکانت</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Activity Table with Interaction Rates */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              جدول مقایسه‌ای عملکرد و آمار لحظه‌ای اکانت‌ها
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
              <input
                type="text"
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                placeholder="جستجوی شماره یا نام..."
                className="bg-slate-900 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
              {filteredAccounts.length} حساب
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 font-bold">
                <th className="py-3 px-3">اکانت</th>
                <th className="py-3 px-3">وضعیت</th>
                <th className="py-3 px-3">پیام ارسالی</th>
                <th className="py-3 px-3">پیام دریافتی</th>
                <th className="py-3 px-3">منشی خودکار</th>
                <th className="py-3 px-3">تبچی</th>
                <th className="py-3 px-3">رسانه ذخیره شده</th>
                <th className="py-3 px-3">بلاک مزاحم</th>
                <th className="py-3 px-3">نرخ تعامل (Rate)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    هیچ اکانتی متصل نیست یا موردی با این فیلتر یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.phone} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-white">{acc.firstName}</div>
                      <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{acc.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.status === "online" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                      }`}>
                        {acc.status === "online" ? "آنلاین 🟢" : "آفلاین"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">{acc.totalSent.toLocaleString()}</td>
                    <td className="py-3 px-3 text-indigo-300">{acc.totalReceived.toLocaleString()}</td>
                    <td className="py-3 px-3 text-emerald-300">{acc.autoReplies}</td>
                    <td className="py-3 px-3 text-sky-300">{acc.tabchiSent}</td>
                    <td className="py-3 px-3 text-teal-300">{acc.savedMediaCount}</td>
                    <td className="py-3 px-3 text-rose-400">{acc.blockedCount}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                            style={{ width: `${acc.interactionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-emerald-400 text-xs">{acc.interactionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Activity Stream (آخرین فعالیت‌های ثبت‌شده سشن‌ها) */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              جریان زنده فعالیت‌های اخیر سشن‌ها (Live Activity Stream)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time Feed</span>
        </div>

        {recentEvents.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            در حال حاضر فعالیت جدیدی ثبت نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      evt.status === "success"
                        ? "bg-emerald-400"
                        : evt.status === "warning"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  ></div>
                  <div className="truncate">
                    <div className="font-bold text-white truncate">{evt.actionLabel}</div>
                    <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                      {evt.accountPhone} • {evt.action}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 font-mono text-[10px] text-slate-400">
                  <div>{evt.tehranTime || evt.timestamp.substring(11, 19)}</div>
                  {evt.durationMs && <div className="text-cyan-400">{evt.durationMs}ms</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cryptocurrency Technical Analysis & Telegram Bot Share Engine */}
      <CryptoTechnicalAnalysisCard lang={lang} />
    </div>
  );
};
