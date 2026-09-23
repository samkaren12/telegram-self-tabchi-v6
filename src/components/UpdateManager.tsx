import React, { useState, useEffect } from "react";
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
  remoteCommit?: string;
  commitsBehind?: number;
  remoteUpdates: boolean;
  changelog: ChangelogItem[];
  serverIp: string;
  uptimeSeconds: number;
}

interface UpdateManagerProps {
  lang: Language;
}

export const UpdateManager: React.FC<UpdateManagerProps> = ({ lang }) => {
  const [data, setData] = useState<UpdateCheckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [outputLog, setOutputLog] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchUpdateCheck = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/system/update-check");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err: any) {
      setFeedback(`خطا در بررسی بروزرسانی: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdateCheck();
  }, []);

  const handleTriggerRemoteUpdate = async () => {
    const confirmPrompt =
      lang === "fa"
        ? "آیا از اجرای بروزرسانی فوری و اعمال آخرین تغییرات مخزن روی سرور اطمینان دارید؟ پروسس برنامه با PM2 به صورت خودکار ری‌استارت خواهد شد."
        : "Are you sure you want to pull latest changes, re-build, and restart the server daemon?";

    if (!window.confirm(confirmPrompt)) return;

    setUpdating(true);
    setFeedback(null);
    setOutputLog(null);

    try {
      const res = await fetch("/api/system/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      setFeedback(json.message);
      if (json.output) {
        setOutputLog(json.output);
      }
      fetchUpdateCheck();
    } catch (err: any) {
      setFeedback(`خطا در ارتباط با سرور: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {lang === "fa" ? "مرکز مدیریت بروزرسانی نسخه اسکریپت (Update Manager)" : "Script Version & Remote Update Manager"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {data?.version || "v6.0.0 Pro"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "fa"
                ? "بررسی مستقیم آخرین نسخه از مخزن گیت، نمایش تغییرات جدید (Changelog) و بروزرسانی بلادرنگ با ۱ کلیک"
                : "Check repo for new commits, inspect release notes, and deploy remote updates with 1-click."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUpdateCheck}
            disabled={loading || updating}
            className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            <span>{lang === "fa" ? "بررسی نسخه جدید" : "Check for Updates"}</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerRemoteUpdate}
            disabled={updating}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${updating ? "animate-bounce" : ""}`} />
            <span>
              {updating
                ? lang === "fa"
                  ? "درحال ارتقا..."
                  : "Upgrading..."
                : lang === "fa"
                ? "بروزرسانی فوری سرور"
                : "1-Click Remote Update"}
            </span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === "fa" ? "نسخه / کامیت فعال" : "Active Commit"}
            </div>
            <div className="text-xs font-mono font-bold text-slate-200 truncate">
              {data?.currentCommit || "v6.0.0-production"}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
          {data?.remoteUpdates ? (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <div className="overflow-hidden">
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === "fa" ? "وضعیت نسخه مخزن" : "Repo Status"}
            </div>
            <div className="text-xs font-bold truncate">
              {data?.remoteUpdates ? (
                <span className="text-amber-400">
                  {lang === "fa"
                    ? `نسخه جدید موجود است (${data.commitsBehind || 1} کامیت جدید)`
                    : `${data.commitsBehind || 1} new commits available`}
                </span>
              ) : (
                <span className="text-emerald-400">
                  {lang === "fa" ? "اسکریپت کاملاً بروز است ✅" : "Fully Up to Date ✅"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
          <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === "fa" ? "مدیر پروسس و سرور" : "Process Manager"}
            </div>
            <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PM2 Service (Port 3000)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback & Output Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.includes("خطا")
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          {outputLog && (
            <button
              type="button"
              onClick={() => setShowLogModal(!showLogModal)}
              className="text-[11px] underline hover:text-white transition-colors"
            >
              {lang === "fa" ? "مشاهده لاگ خروجی" : "View Output Log"}
            </button>
          )}
        </div>
      )}

      {/* Output Console Log if available */}
      {outputLog && showLogModal && (
        <div className="p-3 bg-black/90 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Execution Log:</span>
            </span>
            <button
              onClick={() => setShowLogModal(false)}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              ✕ بستن
            </button>
          </div>
          <pre className="text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
            {outputLog}
          </pre>
        </div>
      )}

      {/* Changelog Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-200">
              {lang === "fa" ? "تاریخچه تغییرات و یادداشت‌های انتشار (Changelog)" : "Release Notes & Commit History"}
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            {data?.changelog?.length || 0} {lang === "fa" ? "مورد ثبت‌شده" : "entries"}
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
              {lang === "fa" ? "اطلاعات لاگ در دسترس نیست." : "No changelog entries available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
