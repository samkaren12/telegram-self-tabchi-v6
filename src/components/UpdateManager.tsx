import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  RefreshCw,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Terminal,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Zap,
  Layers,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  RotateCw,
} from "lucide-react";
import { Language } from "../utils/i18n";

interface ChangelogItem {
  hash: string;
  message: string;
  date?: string;
}

interface UpdateCheckData {
  success: boolean;
  gitAvailable: boolean;
  isGitRepo: boolean;
  version: string;
  currentCommit: string;
  currentBranch?: string;
  remoteUrl?: string;
  remoteCommit?: string;
  commitsBehind?: number;
  remoteUpdates: boolean;
  changelog: ChangelogItem[];
  serverIp: string;
  uptimeSeconds: number;
  nodeVersion?: string;
  pm2Detected?: boolean;
}

interface LiveUpdateStatus {
  success: boolean;
  isUpdating: boolean;
  mode: "fast" | "full" | "rebuild";
  step: "idle" | "git" | "deps" | "build" | "restart" | "completed" | "failed";
  stepText: string;
  progressPercent: number;
  logs: string[];
  elapsedSeconds?: number;
  message?: string;
  error?: string;
}

interface UpdateManagerProps {
  lang: Language;
}

export const UpdateManager: React.FC<UpdateManagerProps> = ({ lang }) => {
  const [data, setData] = useState<UpdateCheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"fast" | "full" | "rebuild">("fast");

  // Live update state
  const [updateStatus, setUpdateStatus] = useState<LiveUpdateStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(true);
  const [copiedCli, setCopiedCli] = useState(false);
  const [reloadCountdown, setReloadCountdown] = useState<number | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<any>(null);

  const isRtl = lang === "fa";

  const fetchUpdateCheck = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/system/update-check");
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.activeUpdateState && json.activeUpdateState.isUpdating) {
          setIsUpdating(true);
          setUpdateStatus(json.activeUpdateState);
        }
      }
    } catch (err: any) {
      setFeedback(isRtl ? `خطا در بررسی بروزرسانی: ${err.message}` : `Error checking updates: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdateCheck();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll update progress when updating
  useEffect(() => {
    if (isUpdating) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/system/update-status");
          const json: LiveUpdateStatus = await res.json();
          setUpdateStatus(json);

          if (json.logs && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
          }

          if (!json.isUpdating && json.step === "completed") {
            setIsUpdating(false);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setFeedback(json.message || (isRtl ? "بروزرسانی با موفقیت انجام شد!" : "Update succeeded!"));
            fetchUpdateCheck();

            // Start countdown to reload
            setReloadCountdown(5);
          } else if (!json.isUpdating && json.step === "failed") {
            setIsUpdating(false);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setFeedback(json.error || (isRtl ? "بروزرسانی با خطا متوقف شد." : "Update failed."));
          }
        } catch (_) {}
      }, 1500);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isUpdating]);

  // Countdown timer effect
  useEffect(() => {
    if (reloadCountdown !== null && reloadCountdown > 0) {
      const timer = setTimeout(() => {
        setReloadCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (reloadCountdown === 0) {
      window.location.reload();
    }
  }, [reloadCountdown]);

  const handleStartUpdate = async () => {
    setShowConfirmModal(false);
    setIsUpdating(true);
    setFeedback(null);
    setReloadCountdown(null);

    try {
      const res = await fetch("/api/system/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      });
      const json = await res.json();
      if (!json.success && !json.isUpdating) {
        setIsUpdating(false);
        setFeedback(json.message || "خطا در شروع بروزرسانی");
      }
    } catch (err: any) {
      setIsUpdating(false);
      setFeedback(isRtl ? `خطا در ارتباط با سرور: ${err.message}` : `Connection error: ${err.message}`);
    }
  };

  const copyCliCommand = () => {
    navigator.clipboard.writeText("sudo selfandtabchi 10");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-slate-100 text-base sm:text-lg">
                {isRtl ? "مرکز مدیریت بروزرسانی نسخه اسکریپت" : "Script Version & Remote Update Center"}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono shadow-sm">
                {data?.version || "v6.0.0 Pro"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isRtl
                ? "همگام‌سازی بلادرنگ با مخزن گیت، کامپایل مجدد باندل کلاینت و سرور و ری‌استارت امن پروسه با ۱ کلیک"
                : "Real-time git synchronization, bundle recompilation, and graceful daemon restart with 1-click."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchUpdateCheck}
            disabled={loading || isUpdating}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>{isRtl ? "بررسی نسخه جدید" : "Check for Updates"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isUpdating}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <Zap className={`w-4 h-4 ${isUpdating ? "animate-pulse text-amber-300" : ""}`} />
            <span>
              {isUpdating
                ? isRtl
                  ? "در حال بروزرسانی..."
                  : "Upgrading..."
                : isRtl
                ? "اجرای بروزرسانی فوری"
                : "1-Click Remote Update"}
            </span>
          </button>
        </div>
      </div>

      {/* Live Reload Banner when countdown is active */}
      {reloadCountdown !== null && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              {isRtl
                ? `بروزرسانی با موفقیت انجام شد! صفحه در ${reloadCountdown} ثانیه دیگر تازه‌سازی می‌شود...`
                : `Update complete! Reloading page in ${reloadCountdown}s...`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
          >
            {isRtl ? "تازه‌سازی فوری اکنون" : "Reload Now"}
          </button>
        </div>
      )}

      {/* Progress & Live Terminal Stepper if Updating */}
      {isUpdating && updateStatus && (
        <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></span>
              <h4 className="text-sm font-bold text-slate-100">{updateStatus.stepText}</h4>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800">
              {updateStatus.progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${updateStatus.progressPercent}%` }}
            />
          </div>

          {/* Steps Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                updateStatus.progressPercent >= 25
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{isRtl ? "۱. دریافت گیت" : "1. Git Sync"}</span>
            </div>
            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                updateStatus.progressPercent >= 50
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isRtl ? "۲. پکیج‌ها" : "2. Dependencies"}</span>
            </div>
            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                updateStatus.progressPercent >= 75
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isRtl ? "۳. کامپایل بیلد" : "3. Build Assets"}</span>
            </div>
            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                updateStatus.progressPercent >= 100
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isRtl ? "۴. راه‌اندازی سرور" : "4. Reload"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[11px] text-slate-400 font-medium">
              {isRtl ? "نسخه و کامیت فعال" : "Active Commit & Branch"}
            </div>
            <div className="text-xs font-mono font-bold text-slate-200 truncate flex items-center gap-1.5">
              <span>{data?.currentCommit || "v6.0.0-production"}</span>
              {data?.currentBranch && (
                <span className="text-[10px] text-cyan-400 bg-cyan-950/70 px-1.5 py-0.2 rounded border border-cyan-800/60 font-mono">
                  {data.currentBranch}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          {data?.remoteUpdates ? (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <div className="overflow-hidden">
            <div className="text-[11px] text-slate-400 font-medium">
              {isRtl ? "وضعیت سورس مخزن" : "Repo Status"}
            </div>
            <div className="text-xs font-bold truncate">
              {data?.remoteUpdates ? (
                <span className="text-amber-400">
                  {isRtl
                    ? `نسخه جدید موجود است (${data.commitsBehind || 1} کامیت جدید)`
                    : `${data.commitsBehind || 1} new commits available`}
                </span>
              ) : (
                <span className="text-emerald-400">
                  {isRtl ? "اسکریپت کاملاً بروز است ✅" : "Fully Up to Date ✅"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
          <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[11px] text-slate-400 font-medium">
              {isRtl ? "وضعیت مدیر پروسه سرور" : "Process Manager"}
            </div>
            <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{data?.pm2Detected ? "PM2 Service (Port 3000)" : "Node.js Daemon (Port 3000)"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Assistant Banner (sudo selfandtabchi 10) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {isRtl ? "بروزرسانی مستقیم از طریق ترمینال لینوکس (CLI Updater)" : "Direct Linux Terminal CLI Updater"}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40">
                  Option 10
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isRtl
                  ? "اگر به هر دلیلی تمایل به بروزرسانی از SSH دارید، کافیست دستور زیر را در ترمینال سرور اجرا کنید:"
                  : "Alternatively, execute this 1-click command inside your VPS SSH terminal anytime:"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/90 border border-slate-700/80 rounded-xl px-3 py-2 font-mono text-xs">
            <span className="text-emerald-400 select-all font-bold">sudo selfandtabchi 10</span>
            <button
              type="button"
              onClick={copyCliCommand}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-300 transition-colors"
              title="Copy"
            >
              {copiedCli ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex-wrap">
          <span className="text-slate-500">{isRtl ? "دستورات جایگزین:" : "Alternative:"}</span>
          <code className="text-cyan-300 bg-slate-900 px-2 py-0.5 rounded font-mono border border-slate-800">
            bash update.sh
          </code>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.includes("خطا") || feedback.includes("Error") || feedback.includes("failed")
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        </div>
      )}

      {/* Terminal Live Output Console */}
      {updateStatus && updateStatus.logs && updateStatus.logs.length > 0 && (
        <div className="bg-black/90 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 font-mono">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-bold">{isRtl ? "کنسول خروجی فرآیند بروزرسانی" : "Live Execution Console"}</span>
              <span className="text-[10px] text-slate-500">({updateStatus.logs.length} lines)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLogDrawer(!showLogDrawer)}
              className="flex items-center gap-1 hover:text-white transition-colors text-[11px]"
            >
              <span>{showLogDrawer ? (isRtl ? "کوچک‌سازی" : "Collapse") : (isRtl ? "گسترش" : "Expand")}</span>
              {showLogDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showLogDrawer && (
            <div className="p-4 font-mono text-[11px] text-emerald-400 max-h-60 overflow-y-auto space-y-1 leading-relaxed selection:bg-emerald-500/30">
              {updateStatus.logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${
                    log.includes("[Error]")
                      ? "text-rose-400 font-bold"
                      : log.includes("[Warning]")
                      ? "text-amber-400"
                      : log.includes("[Git]")
                      ? "text-cyan-300"
                      : log.includes("[Build]")
                      ? "text-purple-300"
                      : "text-emerald-400"
                  }`}
                >
                  <span className="text-slate-600 select-none">{index + 1}.</span>
                  <span className="break-all whitespace-pre-wrap">{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Changelog Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-200">
              {isRtl ? "تاریخچه تغییرات و یادداشت‌های انتشار (Changelog)" : "Release Notes & Commit History"}
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            {data?.changelog?.length || 0} {isRtl ? "مورد ثبت‌شده" : "entries"}
          </span>
        </div>

        <div className="space-y-2">
          {data?.changelog && data.changelog.length > 0 ? (
            data.changelog.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-cyan-300 border border-slate-700">
                    {item.hash}
                  </span>
                  <span className="text-slate-200 font-medium leading-relaxed">
                    {item.message}
                  </span>
                </div>
                {item.date && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{item.date}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 rounded-xl bg-slate-950 border border-slate-800">
              {isRtl ? "اطلاعات لاگ در دسترس نیست." : "No changelog entries available."}
            </div>
          )}
        </div>
      </div>

      {/* IN-APP CONFIRMATION MODAL (No window.confirm!) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {isRtl ? "تأیید اجرای بروزرسانی اسکریپت" : "Confirm Script Upgrade"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRtl ? "انتخاب حالت و همگام‌سازی کامل با آخرین نسخه" : "Select update strategy"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                {isRtl ? "نوع عملیات بروزرسانی را انتخاب کنید:" : "Select Update Mode:"}
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedMode("fast")}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 ${
                    selectedMode === "fast"
                      ? "bg-cyan-500/15 border-cyan-500 text-white"
                      : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <Zap className={`w-4 h-4 mt-0.5 ${selectedMode === "fast" ? "text-cyan-400" : "text-slate-500"}`} />
                  <div>
                    <div className="text-xs font-bold">{isRtl ? "بروزرسانی سریع (Fast Update - پیشنهادی)" : "Fast Update (Recommended)"}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {isRtl
                        ? "دریافت تغییرات گیت، کامپایل سریع باندل و بارگذاری مجدد (زیر ۱۰ ثانیه)"
                        : "Pull git commits, compile bundles, and reload daemon rapidly."}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode("full")}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 ${
                    selectedMode === "full"
                      ? "bg-blue-500/15 border-blue-500 text-white"
                      : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <Layers className={`w-4 h-4 mt-0.5 ${selectedMode === "full" ? "text-blue-400" : "text-slate-500"}`} />
                  <div>
                    <div className="text-xs font-bold">{isRtl ? "بروزرسانی کامل و جامع (Full Sync)" : "Full Sync & Dependencies"}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {isRtl
                        ? "نصب و همگام‌سازی تمامی پکیج‌های npm، بروزرسانی yt-dlp و بیلد دوباره کامل"
                        : "Reinstall dependencies, update yt-dlp binary, and full recompile."}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode("rebuild")}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-3 ${
                    selectedMode === "rebuild"
                      ? "bg-purple-500/15 border-purple-500 text-white"
                      : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <RotateCw className={`w-4 h-4 mt-0.5 ${selectedMode === "rebuild" ? "text-purple-400" : "text-slate-500"}`} />
                  <div>
                    <div className="text-xs font-bold">{isRtl ? "کامپایل و بیلد مجدد (Force Rebuild Only)" : "Force Rebuild Only"}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {isRtl
                        ? "فقط بیلد و بازسازی فایل‌های فرانت‌اند و سرور بدون دریافت از گیت"
                        : "Rebuild client and server assets without pulling remote changes."}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-300 leading-relaxed">
              ⚠️{" "}
              {isRtl
                ? "پس از تکمیل بروزرسانی، پروسه سرور به صورت روان ری‌لود شده و صفحه وب پنل به طور خودکار تازه‌سازی خواهد شد."
                : "The server process will be reloaded smoothly and the dashboard will refresh automatically upon completion."}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                {isRtl ? "انصراف" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleStartUpdate}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRtl ? "تأیید و شروع بروزرسانی" : "Confirm & Start"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
