import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Users,
  Terminal,
  Download,
  Trash2,
  HelpCircle,
  Zap,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  Check,
  Eye,
  Flame,
  Radio,
  Sliders,
  RotateCcw,
  Bug,
  ShieldAlert,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { AuditLogEntry, AuditLogSummary, TelegramAccount } from "../types";

interface AuditLogDashboardProps {
  lang: Language;
  accounts: TelegramAccount[];
  onOpenHelp?: (section?: any) => void;
}

export const AuditLogDashboard: React.FC<AuditLogDashboardProps> = ({
  lang,
  accounts,
  onOpenHelp,
}) => {
  const isRtl = lang === "fa";

  // Data & Pagination
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Filters
  const [selectedPhone, setSelectedPhone] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Inspecting
  const [inspectingEntry, setInspectingEntry] = useState<AuditLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchAuditLogs = async (page = currentPage) => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");

      if (selectedPhone !== "all") params.set("phone", selectedPhone);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLogs(json.logs || []);
          setTotalCount(json.totalCount || 0);
          setTotalPages(json.totalPages || 1);
          setSummary(json.summary || null);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchAuditLogs(1);
  }, [selectedPhone, selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (autoRefresh) {
      pollIntervalRef.current = setInterval(() => {
        fetchAuditLogs(currentPage);
      }, 5000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [autoRefresh, currentPage, selectedPhone, selectedCategory, selectedStatus, searchQuery]);

  // Handle Clear Logs
  const handleClearLogs = async () => {
    if (!confirm(isRtl ? "آیا از پاکسازی تمامی لاگ‌های بازرسی اطمینان دارید؟" : "Are you sure you want to clear all audit logs?")) {
      return;
    }
    try {
      const res = await fetch("/api/audit-logs/clear", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast("success", isRtl ? "لاگ‌های بازرسی با موفقیت پاکسازی شدند." : "Audit logs cleared.");
        fetchAuditLogs(1);
      }
    } catch (_) {
      showToast("error", isRtl ? "خطا در پاکسازی لاگ‌ها." : "Error clearing logs.");
    }
  };

  // Simulate Diagnostic Event
  const handleSimulateDiagnostic = async (type: "error" | "success") => {
    try {
      const res = await fetch("/api/audit-logs/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, phone: selectedPhone !== "all" ? selectedPhone : undefined }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", isRtl ? "رویداد تستی بازرسی با موفقیت ثبت شد!" : "Diagnostic event logged!");
        fetchAuditLogs(1);
      }
    } catch (_) {
      showToast("error", isRtl ? "خطا در ایجاد رویداد تستی." : "Failed to simulate event.");
    }
  };

  // Export Logs to JSON
  const handleExportJson = () => {
    if (logs.length === 0) return;
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", isRtl ? "فایل JSON لاگ‌ها دانلود شد." : "JSON logs downloaded.");
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{isRtl ? "موفق" : "Success"}</span>
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>{isRtl ? "ناموفق" : "Failed"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        <span>{isRtl ? "هشدار" : "Warning"}</span>
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const map: Record<string, { labelFa: string; labelEn: string; color: string }> = {
      auth: { labelFa: "احراز هویت", labelEn: "Auth", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      features: { labelFa: "قابلیت‌ها", labelEn: "Features", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
      tabchi: { labelFa: "تبچی", labelEn: "Tabchi", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      subscription: { labelFa: "اشتراک", labelEn: "Subscription", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
      batch: { labelFa: "ساخت انبوه", labelEn: "Batch", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
      system: { labelFa: "سیستم", labelEn: "System", color: "bg-slate-700/40 text-slate-300 border-slate-600/40" },
      bot: { labelFa: "ربات تلگرام", labelEn: "Bot", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
      security: { labelFa: "امنیت", labelEn: "Security", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    };

    const c = map[category] || { labelFa: category, labelEn: category, color: "bg-slate-800 text-slate-400" };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${c.color}`}>
        {isRtl ? c.labelFa : c.labelEn}
      </span>
    );
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
              : "bg-rose-950/90 border-rose-500/50 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {isRtl ? "داشبورد ثبت وقایع و بازرسی دستورات (Audit Log)" : "Web Interface Audit Log"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-mono">
                  ENTERPRISE AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isRtl
                  ? "ردیابی بلادرنگ تمامی دستورات اجرا شده از طریق رابط وب در سراسر تمامی اکانت‌ها، شامل زمان دقیق، نام اکانت، وضعیت نتیجه و راهنمای رفع خطای هوشمند (Troubleshooting)."
                  : "Track and troubleshoot every web interface command executed across all accounts with timestamps, status, and automated diagnosis."}
              </p>
            </div>
          </div>

          {/* Action buttons on top */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                autoRefresh
                  ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="همگام‌سازی خودکار هر ۵ ثانیه"
            >
              <Activity className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse text-emerald-400" : ""}`} />
              <span>{isRtl ? "بروزرسانی زنده" : "Live Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchAuditLogs(currentPage)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
              title="بروزرسانی دستی"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              title="دانلود فایل لاگ‌ها"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? "خروجی JSON" : "Export"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateDiagnostic("error")}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="شبیه‌سازی خطای آزمایشی جهت بررسی مکانیزم عیب‌یابی"
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>{isRtl ? "تست شبیه‌ساز خطا" : "Test Diagnostic"}</span>
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800/40 transition-all text-xs"
              title="پاکسازی تاریخچه لاگ‌ها"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Commands */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>کل عملیات‌ها</span>
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {summary?.totalCount ?? totalCount}
          </div>
          <div className="text-[10px] text-slate-500">دستورات ثبت‌شده</div>
        </div>

        {/* 2. Success Count */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>عملیات موفق</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {summary?.successCount ?? 0}
          </div>
          <div className="text-[10px] text-emerald-500/80">بدون خطا ✅</div>
        </div>

        {/* 3. Failed Count */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>خطاها و شکست‌ها</span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-rose-400 font-mono">
            {summary?.failedCount ?? 0}
          </div>
          <div className="text-[10px] text-rose-500/80">نیازمند عیب‌یابی ⚠️</div>
        </div>

        {/* 4. Warning Count */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>هشدارهای سیستم</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono">
            {summary?.warningCount ?? 0}
          </div>
          <div className="text-[10px] text-amber-500/80">مانند FloodWait</div>
        </div>

        {/* 5. Success Rate */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>نرخ موفقیت</span>
            <Zap className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-extrabold text-teal-300 font-mono">
            {summary?.successRate ?? 100}%
          </div>
          <div className="text-[10px] text-teal-500/80">پایداری فرامین</div>
        </div>

        {/* 6. Last 24h Count */}
        <div className="glass-panel rounded-2xl p-4 shadow-lg border border-slate-800/80 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>۲۴ ساعت اخیر</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-indigo-300 font-mono">
            {summary?.last24hCount ?? 0}
          </div>
          <div className="text-[10px] text-indigo-500/80">فعالیت روزانه</div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRtl
                  ? "جستجو در شماره اکانت، شرح دستور، متن خطا، یا راهنمای رفع مشکل..."
                  : "Search account, command, error message, or hint..."
              }
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pr-10 pl-9 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/80 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Clear All Filters */}
          {(selectedPhone !== "all" || selectedCategory !== "all" || selectedStatus !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedPhone("all");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSearchQuery("");
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all self-end md:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRtl ? "حذف تمامی فیلترها" : "Clear Filters"}</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80">
          {/* Account Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isRtl ? "تفکیک اکانت (Account):" : "Account:"}</span>
            </label>
            <select
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all cursor-pointer font-medium"
            >
              <option value="all">🌐 {isRtl ? "تمامی حساب‌ها و سیستم" : "All Accounts & System"}</option>
              <option value="SYSTEM">⚙️ {isRtl ? "دستورات سیستمی (System)" : "System Commands"}</option>
              {accounts.map((acc) => (
                <option key={acc.phone} value={acc.phone}>
                  📱 {acc.phone} ({acc.firstName || "Telegram User"})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>{isRtl ? "دسته‌بندی فرآیند:" : "Category:"}</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all cursor-pointer font-medium"
            >
              <option value="all">📊 {isRtl ? "همه دسته‌بندی‌ها" : "All Categories"}</option>
              <option value="features">⚡ {isRtl ? "قابلیت‌های سلف (Features)" : "Features"}</option>
              <option value="tabchi">📡 {isRtl ? "تبچی و برودکست (Tabchi)" : "Tabchi"}</option>
              <option value="auth">🔑 {isRtl ? "احراز هویت و لاگین (Auth)" : "Auth"}</option>
              <option value="subscription">⏳ {isRtl ? "مدیریت اشتراک (Subscription)" : "Subscription"}</option>
              <option value="batch">📁 {isRtl ? "ساخت انبوه (Batch Creator)" : "Batch Creator"}</option>
              <option value="bot">🤖 {isRtl ? "ربات‌های تلگرام (Bot)" : "Bots"}</option>
              <option value="security">🛡️ {isRtl ? "امنیت و دسترسی (Security)" : "Security"}</option>
              <option value="system">⚙️ {isRtl ? "سرور و هسته (System)" : "System"}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isRtl ? "وضعیت نتیجه (Result Status):" : "Result Status:"}</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all cursor-pointer font-medium"
            >
              <option value="all">⚡ {isRtl ? "همه وضعیت‌ها" : "All Statuses"}</option>
              <option value="success">🟢 {isRtl ? "فقط عملیات‌های موفق" : "Success Only"}</option>
              <option value="failed">🔴 {isRtl ? "فقط شکست‌ها و خطاها (Troubleshooting)" : "Failed Only"}</option>
              <option value="warning">🟡 {isRtl ? "فقط هشدارها" : "Warnings Only"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base text-white">
              {isRtl ? "لیست جامع وقایع و فرمان‌های رابط وب" : "Command Audit History"}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isRtl
              ? `نمایش ${logs.length} از مجموع ${totalCount} لاگ`
              : `Showing ${logs.length} of ${totalCount}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 font-bold">
                <th className="py-3 px-3">زمان (Tehran Time)</th>
                <th className="py-3 px-3">اکانت هدف</th>
                <th className="py-3 px-3">دسته‌بندی</th>
                <th className="py-3 px-3">دستور و عملیات اجرا شده</th>
                <th className="py-3 px-3">وضعیت</th>
                <th className="py-3 px-3">زمان اجرا</th>
                <th className="py-3 px-3 text-center">جزئیات و عیب‌یابی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    <span>در حال بارگذاری وقایع بازرسی...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">هیچ رویدادی با فیلترهای انتخابی یافت نشد.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      می‌توانید فیلترهای اکانت یا دسته‌بندی را تغییر دهید.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const hasTroubleHint = Boolean(log.troubleshootingHint || log.errorMessage);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-900/60 transition-colors ${
                        log.status === "failed" ? "bg-rose-950/10" : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        <div>{log.tehranTime}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Account Phone */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-cyan-300">
                          <span dir="ltr">{log.accountPhone}</span>
                          {log.accountPhone !== "SYSTEM" && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(log.accountPhone, `phone-${log.id}`)}
                              className="text-slate-500 hover:text-white p-0.5"
                              title="کپی شماره"
                            >
                              {copiedId === `phone-${log.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        {log.accountName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {log.accountName}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getCategoryBadge(log.category)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white text-[12px] leading-snug">
                          {log.actionLabel}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>{log.action}</span>
                          {log.ip && (
                            <span className="text-slate-600">({log.ip})</span>
                          )}
                        </div>

                        {/* Automated Troubleshooting Diagnostic Hint Preview */}
                        {log.troubleshootingHint && (
                          <div className="mt-1.5 p-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span className="leading-relaxed">
                              <strong>راهنمای رفع مشکل:</strong> {log.troubleshootingHint}
                            </span>
                          </div>
                        )}

                        {log.errorMessage && !log.troubleshootingHint && (
                          <div className="mt-1 text-[11px] text-rose-400 font-mono">
                            {log.errorMessage}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.durationMs ? `${log.durationMs}ms` : "-"}
                      </td>

                      {/* Action button: Inspect */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectingEntry(log)}
                          className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 text-xs font-semibold border border-slate-800 transition-all flex items-center gap-1 mx-auto"
                          title="مشاهده جزئیات کامل لاگ"
                        >
                          <Eye className="w-3 h-3" />
                          <span>بازرسی</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                const nextP = Math.max(1, currentPage - 1);
                setCurrentPage(nextP);
                fetchAuditLogs(nextP);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>صفحه قبل</span>
            </button>

            <span className="font-mono text-slate-400">
              صفحه {currentPage} از {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const nextP = Math.min(totalPages, currentPage + 1);
                setCurrentPage(nextP);
                fetchAuditLogs(nextP);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>صفحه بعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* INSPECT DETAIL MODAL */}
      {inspectingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-emerald-500/30 bg-slate-950 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  بازرسی عمیق رویداد (Audit Event Inspector)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEntry(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Key Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">شناسه لاگ</div>
                <div className="font-mono text-cyan-300 font-bold truncate mt-0.5">{inspectingEntry.id}</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">شماره حساب</div>
                <div className="font-mono text-emerald-400 font-bold mt-0.5" dir="ltr">{inspectingEntry.accountPhone}</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">وضعیت</div>
                <div className="mt-0.5">{getStatusBadge(inspectingEntry.status)}</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">زمان تهران</div>
                <div className="font-mono text-white mt-0.5">{inspectingEntry.tehranTime}</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">مدت زمان اجرا</div>
                <div className="font-mono text-purple-300 mt-0.5">{inspectingEntry.durationMs} میلی‌ثانیه</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500">آدرس آی‌پی (IP)</div>
                <div className="font-mono text-slate-300 mt-0.5">{inspectingEntry.ip || "127.0.0.1"}</div>
              </div>
            </div>

            {/* Troubleshooting diagnostics banner if failed or warning */}
            {inspectingEntry.troubleshootingHint && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-xs space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>راهنمای تشخیصی و حل مشکل (Troubleshooting Guide)</span>
                </div>
                <p className="text-amber-100 leading-relaxed text-[11px]">
                  {inspectingEntry.troubleshootingHint}
                </p>
                {inspectingEntry.errorMessage && (
                  <div className="text-[10px] font-mono text-rose-300 bg-slate-950 p-2 rounded-lg border border-rose-900/40">
                    کد خام خطا: {inspectingEntry.errorMessage}
                  </div>
                )}
              </div>
            )}

            {/* JSON Payload viewer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span>اطلاعات فنی و پی‌لود ورودی/خروجی (Raw Details JSON):</span>
                <button
                  type="button"
                  onClick={() => handleCopyText(JSON.stringify(inspectingEntry, null, 2), "modal-json")}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                >
                  {copiedId === "modal-json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === "modal-json" ? "کپی شد" : "کپی JSON"}</span>
                </button>
              </div>
              <pre
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed"
                dir="ltr"
              >
                {JSON.stringify(inspectingEntry, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingEntry(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all"
              >
                بستن پنجره بازرسی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
