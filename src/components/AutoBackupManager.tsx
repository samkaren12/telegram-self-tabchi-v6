import React, { useState, useEffect } from "react";
import {
  Shield,
  Download,
  Upload,
  Calendar,
  Lock,
  Key,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  RefreshCw,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Sliders,
  Database,
  ArrowDownCircle,
  FileCheck,
} from "lucide-react";
import { Language } from "../utils/i18n";

interface AutoBackupConfig {
  enabled: boolean;
  schedule: "hourly" | "every_6_hours" | "daily" | "weekly";
  passphrase?: string;
  retentionCount: number;
  includeSessions: boolean;
  includeFilterRules: boolean;
  lastBackupAt?: string;
  nextBackupAt?: string;
  lastBackupFilename?: string;
  lastBackupStatus?: "success" | "error";
  lastBackupError?: string;
}

interface StoredBackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  accountsCount: number;
  rulesCount: number;
  encrypted: boolean;
  algorithm: string;
}

interface AutoBackupManagerProps {
  lang: Language;
}

export const AutoBackupManager: React.FC<AutoBackupManagerProps> = ({ lang }) => {
  const [config, setConfig] = useState<AutoBackupConfig>({
    enabled: true,
    schedule: "daily",
    passphrase: "",
    retentionCount: 10,
    includeSessions: true,
    includeFilterRules: true,
  });

  const [backups, setBackups] = useState<StoredBackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [customExportPass, setCustomExportPass] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Restore Modal / Upload state
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restorePassphrase, setRestorePassphrase] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    fetchBackupConfig();
    fetchBackupList();
  }, []);

  const fetchBackupConfig = async () => {
    try {
      const res = await fetch("/api/backup/config");
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (_) {}
  };

  const fetchBackupList = async () => {
    try {
      const res = await fetch("/api/backup/list");
      const data = await res.json();
      if (data.success && Array.isArray(data.backups)) {
        setBackups(data.backups);
      }
    } catch (_) {}
  };

  const handleSaveConfig = async (override?: Partial<AutoBackupConfig>) => {
    setLoading(true);
    setFeedback(null);
    try {
      const payload: Partial<AutoBackupConfig> = {
        ...config,
        ...override,
      };

      if (passphraseInput.trim()) {
        payload.passphrase = passphraseInput.trim();
      }

      const res = await fetch("/api/backup/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ذخیره تنظیمات");
      }

      setConfig(data.config);
      setPassphraseInput("");
      setFeedback({
        type: "success",
        message: lang === "fa" ? "تنظیمات زمان‌بندی بکاپ خودکار با موفقیت ذخیره شد ✅" : "Backup schedule settings saved ✅",
      });
      setTimeout(() => setFeedback(null), 3500);
      fetchBackupList();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "خطا در برقراری ارتباط با سرور",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportNow = async () => {
    setExporting(true);
    setFeedback(null);
    try {
      const pass = customExportPass.trim() || undefined;
      const res = await fetch("/api/backup/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: pass, download: false }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ایجاد فایل پشتیبان");
      }

      // Trigger browser download of generated JSON
      const blob = new Blob([data.fileContent], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({
        type: "success",
        message:
          lang === "fa"
            ? `فایل بکاپ ${data.info.encrypted ? "رمزنگاری‌شده (AES-256-GCM)" : "عادی"} با موفقیت دانلود شد ✅`
            : "Encrypted backup downloaded successfully ✅",
      });
      setTimeout(() => setFeedback(null), 4000);
      fetchBackupList();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "خطا در ایجاد بکاپ",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(lang === "fa" ? `آیا از حذف فایل بکاپ ${filename} مطمئن هستید؟` : `Delete backup ${filename}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/backup/${encodeURIComponent(filename)}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBackups(backups.filter((b) => b.filename !== filename));
      }
    } catch (_) {}
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!selectedFileContent) {
      alert("لطفاً ابتدا فایل بکاپ (.json) را انتخاب کنید.");
      return;
    }

    setRestoring(true);
    try {
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupData: selectedFileContent,
          passphrase: restorePassphrase.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در بازیابی فایل پشتیبان");
      }

      setFeedback({
        type: "success",
        message: data.message,
      });
      setIsRestoreOpen(false);
      setSelectedFileContent(null);
      setSelectedFileName(null);
      setRestorePassphrase("");

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "خطا در بازیابی بکاپ");
    } finally {
      setRestoring(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/25 border border-indigo-500/35 rounded-2xl p-6 shadow-xl space-y-6">
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] flex-shrink-0">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-base">
                {lang === "fa"
                  ? "پشتیبان‌گیری خودکار و گاوصندوق رمزنگاری‌شده (Auto-Backup & Vault 🛡️)"
                  : "Auto-Backup & Encrypted Vault Engine"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "fa"
                ? "خروجی خودکار سشن‌های اکانت‌ها و قوانین فیلترهای هوشمند به صورت فایل JSON رمزنگاری‌شده بر اساس زمان‌بندی منظم"
                : "Scheduled export of Telegram sessions and regex filter rules as encrypted JSON files"}
            </p>
          </div>
        </div>

        {/* Master Auto-Backup Switch */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => {
              const next = !config.enabled;
              setConfig({ ...config, enabled: next });
              handleSaveConfig({ enabled: next });
            }}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all active:scale-95 shadow-md ${
              config.enabled
                ? "bg-gradient-to-r from-indigo-500 to-emerald-400 text-slate-950 border-indigo-400 font-black shadow-indigo-500/20"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                config.enabled ? "bg-slate-950 animate-ping" : "bg-slate-600"
              }`}
            />
            <span>
              {config.enabled
                ? lang === "fa"
                  ? "بکاپ زمان‌بندی‌شده: روشن 🟢"
                  : "Auto-Backup: Active 🟢"
                : lang === "fa"
                ? "بکاپ زمان‌بندی‌شده: خاموش ⛔"
                : "Auto-Backup: Disabled ⛔"}
            </span>
          </button>
        </div>
      </div>

      {/* QUICK STATUS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            {lang === "fa" ? "وضعیت زمان‌بندی" : "Schedule Interval"}
          </span>
          <span className="font-bold text-indigo-300 font-mono">
            {config.schedule === "hourly"
              ? "هر ۱ ساعت (Hourly)"
              : config.schedule === "every_6_hours"
              ? "هر ۶ ساعت (6h)"
              : config.schedule === "weekly"
              ? "هفتگی (Weekly)"
              : "روزانه (Daily)"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            {lang === "fa" ? "آخرین بکاپ گرفته‌شده" : "Last Backup"}
          </span>
          <span className="font-bold text-emerald-400 font-mono text-[11px]">
            {formatTimeAgo(config.lastBackupAt)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            {lang === "fa" ? "زمان اجرای بعدی" : "Next Scheduled Run"}
          </span>
          <span className="font-bold text-amber-300 font-mono text-[11px]">
            {config.enabled ? formatTimeAgo(config.nextBackupAt) : "غیرفعال"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            {lang === "fa" ? "فایل‌های ذخیره‌شده" : "Stored Backups"}
          </span>
          <span className="font-bold text-white font-mono text-sm">
            {backups.length} <span className="text-[10px] text-slate-500 font-normal">/ سقف {config.retentionCount}</span>
          </span>
        </div>
      </div>

      {/* SCHEDULE SETTINGS & ENCRYPTION CONFIG */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-slate-800 space-y-4">
        <h4 className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>{lang === "fa" ? "تنظیمات فرکانس، نگهداری و کلید رمزنگاری" : "Schedule, Retention & Encryption Passphrase"}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Schedule Frequency */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">
              {lang === "fa" ? "دوره تناوب پشتیبان‌گیری:" : "Backup Frequency:"}
            </label>
            <select
              value={config.schedule}
              onChange={(e) => setConfig({ ...config, schedule: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="hourly">{lang === "fa" ? "هر ۱ ساعت (Hourly)" : "Every 1 Hour"}</option>
              <option value="every_6_hours">{lang === "fa" ? "هر ۶ ساعت (Every 6h)" : "Every 6 Hours"}</option>
              <option value="daily">{lang === "fa" ? "روزانه (Daily - ساعت ۰۰:۰۰)" : "Daily"}</option>
              <option value="weekly">{lang === "fa" ? "هفتگی (Weekly)" : "Weekly"}</option>
            </select>
          </div>

          {/* Retention Count */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">
              {lang === "fa" ? "حداکثر آرشیو نگهداری (Retention):" : "Retention Limit:"}
            </label>
            <select
              value={config.retentionCount}
              onChange={(e) => setConfig({ ...config, retentionCount: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="5">{lang === "fa" ? "۵ بکاپ اخیر" : "Keep 5 files"}</option>
              <option value="10">{lang === "fa" ? "۱۰ بکاپ اخیر (پیش‌فرض)" : "Keep 10 files (Default)"}</option>
              <option value="20">{lang === "fa" ? "۲۰ بکاپ اخیر" : "Keep 20 files"}</option>
              <option value="50">{lang === "fa" ? "۵۰ بکاپ اخیر" : "Keep 50 files"}</option>
            </select>
          </div>

          {/* Encryption Passphrase */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block flex justify-between">
              <span>{lang === "fa" ? "رمز عبور رمزنگاری (AES-256):" : "Encryption Passphrase:"}</span>
              <span className="text-[10px] text-slate-500">اختیاری / امنیتی</span>
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? "text" : "password"}
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                placeholder={config.passphrase ? "•••••••• (تنظیم شده)" : "رمز عبور جدید..."}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 pr-9 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-white"
              >
                {showPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Content Scope Checkboxes */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800/80 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeSessions}
              onChange={(e) => setConfig({ ...config, includeSessions: e.target.checked })}
              className="rounded accent-indigo-500 w-4 h-4"
            />
            <span className="text-slate-300">
              {lang === "fa"
                ? "شامل سشن‌های ورود تلگرام (Session Strings)"
                : "Include Telegram Session Strings"}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeFilterRules}
              onChange={(e) => setConfig({ ...config, includeFilterRules: e.target.checked })}
              className="rounded accent-indigo-500 w-4 h-4"
            />
            <span className="text-slate-300">
              {lang === "fa"
                ? "شامل قوانین فیلترهای هوشمند رِجکس (Smart Filter Rules)"
                : "Include Smart Filter Regex Rules"}
            </span>
          </label>

          <button
            type="button"
            onClick={() => handleSaveConfig()}
            disabled={loading}
            className="mr-auto px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {loading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{lang === "fa" ? "ذخیره تنظیمات زمان‌بندی 💾" : "Save Schedule Settings 💾"}</span>
          </button>
        </div>
      </div>

      {/* INSTANT MANUAL ACTIONS (EXPORT & RESTORE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <h5 className="font-bold text-white text-xs sm:text-sm">
                {lang === "fa" ? "ایجاد و دانلود فوری فایل پشتیبان" : "Instant Export & Download"}
              </h5>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === "fa"
                ? "یک نسخه پشتیبان رمزنگاری‌شده با استاندارد AES-256 از تمام سشن‌های تلگرام و قوانین فیلتر هوشمند بسازید و مستقیماً روی سیستم خود دانلود کنید."
                : "Generate and download a full AES-256 encrypted JSON backup archive directly to your device."}
            </p>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] text-slate-400 block">
                {lang === "fa" ? "رمز عبور اختصاصی برای این دانلود (اختیاری):" : "Custom Passphrase for Export (Optional):"}
              </label>
              <input
                type="password"
                value={customExportPass}
                onChange={(e) => setCustomExportPass(e.target.value)}
                placeholder="در صورت تمایل رمزی وارد کنید..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportNow}
            disabled={exporting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {exporting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{exporting ? (lang === "fa" ? "در حال ایجاد و دانلود..." : "Exporting...") : (lang === "fa" ? "دانلود بکاپ رمزنگاری‌شده (.json) 📥" : "Download Encrypted Backup 📥")}</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <h5 className="font-bold text-white text-xs sm:text-sm">
                {lang === "fa" ? "بازیابی اطلاعات از فایل پشتیبان" : "Restore from Backup File"}
              </h5>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === "fa"
                ? "فایل پشتیبان (.json) قبلی را بارگذاری کنید؛ اکانت‌ها، سشن‌های لاگین و قوانین فیلتر رِجکس فوراً بدون نیاز به راه‌اندازی مجدد بازیابی می‌شوند."
                : "Upload an existing encrypted backup JSON file to restore accounts, MTProto sessions, and smart filter rules seamlessly."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRestoreOpen(true)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{lang === "fa" ? "بارگذاری و بازیابی اطلاعات (.json) 📤" : "Upload & Restore Backup 📤"}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 shadow-sm animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
              : "bg-rose-950/80 border-rose-500/50 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* STORED BACKUP ARCHIVES LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-200">
              {lang === "fa" ? "آرشیو بکاپ‌های ذخیره‌شده در سرور:" : "Server Stored Backup Archives:"}
            </h4>
            <span className="text-xs text-slate-400 font-mono">({backups.length})</span>
          </div>

          <button
            type="button"
            onClick={fetchBackupList}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[11px]"
            title="بروزرسانی فهرست"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === "fa" ? "بروزرسانی" : "Refresh"}</span>
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="p-6 rounded-2xl bg-black/40 border border-dashed border-slate-800 text-center space-y-1.5">
            <Database className="w-7 h-7 text-indigo-500/40 mx-auto" />
            <p className="text-slate-400 text-xs font-semibold">
              {lang === "fa" ? "هنوز هیچ فایل پشتیبانی روی سرور ذخیره نشده است." : "No backup files stored on server yet."}
            </p>
            <p className="text-[11px] text-slate-500">
              {lang === "fa"
                ? "به محض رسیدن زمان‌بندی بعدی یا زدن دکمه «دانلود فوری»، فایل‌های جدید در این لیست قرار می‌گیرند."
                : "Backups will appear here once scheduled runs execute or manual exports are created."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div
                key={b.filename}
                className="p-3 sm:p-3.5 rounded-xl bg-black/60 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-white text-xs font-bold truncate select-all" dir="ltr">
                        {b.filename}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                          b.encrypted
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {b.algorithm}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap font-mono">
                      <span>🕒 {formatTimeAgo(b.createdAt)}</span>
                      <span>👥 {b.accountsCount} {lang === "fa" ? "اکانت" : "accounts"}</span>
                      <span>⚡ {b.rulesCount} {lang === "fa" ? "فیلتر" : "rules"}</span>
                      <span>💾 {formatFileSize(b.sizeBytes)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <a
                    href={`/api/backup/download/${encodeURIComponent(b.filename)}`}
                    download={b.filename}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === "fa" ? "دانلود" : "Download"}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDeleteBackup(b.filename)}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
                    title={lang === "fa" ? "حذف این فایل" : "Delete"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESTORE MODAL */}
      {isRestoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div
            className="w-full max-w-lg bg-[#060a08] border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-4"
            dir={lang === "fa" ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{lang === "fa" ? "بازیابی اطلاعات از فایل پشتیبان" : "Restore From Backup File"}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsRestoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* File Input Box */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">
                  {lang === "fa" ? "انتخاب فایل پشتیبان (.json):" : "Select Backup JSON File:"}
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="w-full bg-black border border-slate-800 rounded-xl p-2.5 text-slate-300 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-black cursor-pointer"
                />
                {selectedFileName && (
                  <span className="text-[11px] text-emerald-400 block font-mono">
                    ✓ فایل آماده: {selectedFileName}
                  </span>
                )}
              </div>

              {/* Passphrase Input Box */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block flex justify-between">
                  <span>{lang === "fa" ? "رمز عبور بازگشایی (در صورت رمزنگاری):" : "Decryption Passphrase (if encrypted):"}</span>
                  <span className="text-slate-500 text-[10px]">AES-256-GCM</span>
                </label>
                <input
                  type="password"
                  value={restorePassphrase}
                  onChange={(e) => setRestorePassphrase(e.target.value)}
                  placeholder="کلید امنیتی یا خالی در صورت فایل بدون رمز..."
                  className="w-full bg-black border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1 leading-relaxed">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "fa" ? "نکته بسیار مهم:" : "Important Note:"}</span>
                </span>
                <p>
                  {lang === "fa"
                    ? "با اجرای بازیابی، اطلاعات سشن‌های لاگین اکانت‌ها و تمام قوانین فیلتر هوشمند رِجکس درون فایل با اطلاعات کنونی سرور ادغام و ذخیره خواهند شد."
                    : "Restoring will import and merge all account sessions and smart filter rules into the live system state."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRestoreOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
              >
                {lang === "fa" ? "انصراف" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoring || !selectedFileContent}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {restoring ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                <span>{restoring ? (lang === "fa" ? "در حال رمزگشایی و بازیابی..." : "Restoring...") : (lang === "fa" ? "شروع بازیابی اطلاعات ✅" : "Execute Restore ✅")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
