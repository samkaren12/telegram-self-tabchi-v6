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
  Legend,
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
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { ActivityDashboardData } from "../types";

interface DashboardAnalyticsModuleProps {
  lang: Language;
}

export const DashboardAnalyticsModule: React.FC<DashboardAnalyticsModuleProps> = ({
  lang,
}) => {
  const [data, setData] = useState<ActivityDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/dashboard/analytics");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
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
    const interval = setInterval(fetchData, 10000); // 10s live polling
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="glass-panel rounded-3xl p-16 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
        <h3 className="text-sm font-bold text-slate-200">درحال دریافت تحلیل‌ها و آمار زنده...</h3>
      </div>
    );
  }

  const overview = data?.overview || {
    totalAccounts: 0,
    onlineAccounts: 0,
    totalMessagesSentToday: 0,
    totalMessagesReceivedToday: 0,
    avgInteractionRate: 0,
    totalMediaSaved: 0,
    totalBlocked: 0,
  };

  return (
    <div className="space-y-6" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
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
                <h2 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  داشبورد تحلیلی و مانیتورینگ فعالیت اکانت‌ها
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-mono">
                  LIVE ANALYTICS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                نمودارهای تعاملی ۲۴ ساعته ارسال پیام‌ها، نرخ پاسخگویی و تبادل، رسانه‌های ذخیره شده، بلاک کاربران مزاحم و تفکیک ماژول‌ها با کتابخانه Recharts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-2 shadow-inner transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span>{refreshing ? "درحال تازه‌سازی..." : "بروزرسانی داده‌ها"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards (6 cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Sent */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">پیام‌های ارسالی امروز</span>
            <Send className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {overview.totalMessagesSentToday.toLocaleString()}
          </div>
          <span className="text-[10px] text-cyan-400/90 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +18% نسبت به دیروز
          </span>
        </div>

        {/* 2. Total Received */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">پیام‌های دریافتی</span>
            <Inbox className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {overview.totalMessagesReceivedToday.toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-400/90 font-mono flex items-center gap-1">
            <Users className="w-3 h-3" />
            پوشش کامل پیوی و گروه‌ها
          </span>
        </div>

        {/* 3. Interaction Rate */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">نرخ تعامل (Rate)</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {overview.avgInteractionRate}%
          </div>
          <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
            <Zap className="w-3 h-3" />
            وضعیت بهینه و فعال
          </span>
        </div>

        {/* 4. Saved Media */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">رسانه‌های ذخیره شده</span>
            <Camera className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {overview.totalMediaSaved}
          </div>
          <span className="text-[10px] text-teal-400/90 font-mono">
            عکس، ویدیو و تایم‌دار 🔥
          </span>
        </div>

        {/* 5. Blocked Users */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">مزاحمین مسدود شده</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 font-mono">
            {overview.totalBlocked}
          </div>
          <span className="text-[10px] text-rose-400/90 font-mono">
            ضد اسپم قفل پیوی 🔒
          </span>
        </div>

        {/* 6. Active Accounts */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">اکانت‌های متصل</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {overview.onlineAccounts} / {overview.totalAccounts}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            تمام حساب‌های آنلاین
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
                روند ۲۴ ساعته تبادل پیام‌ها و پاسخ‌های خودکار
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Tehran Timezone (IRST)</span>
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
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              جدول مقایسه‌ای عملکرد و آمار لحظه‌ای اکانت‌ها
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data?.accountStats?.length || 0} حساب تلگرام
          </span>
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
              {!data?.accountStats || data.accountStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    هیچ اکانتی متصل نیست.
                  </td>
                </tr>
              ) : (
                data.accountStats.map((acc) => (
                  <tr key={acc.phone} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="font-bold text-white">{acc.firstName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{acc.phone}</div>
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
    </div>
  );
};
