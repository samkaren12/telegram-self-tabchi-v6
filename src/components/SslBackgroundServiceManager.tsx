import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RefreshCw,
  Play,
  Square,
  AlertTriangle,
  History,
  Sliders,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
} from "lucide-react";
import { Language } from "../utils/i18n";

export interface SslRenewalLog {
  id: string;
  timestamp: string;
  action: "check" | "renew" | "generate" | "error";
  status: "success" | "warning" | "error" | "info";
  message: string;
  daysRemaining?: number;
}

export interface SslBackgroundStatus {
  enabled: boolean;
  type: string;
  serverIp: string;
  domain?: string;
  certPath?: string;
  keyPath?: string;
  expiresAt?: string;
  daysRemaining?: number;
  autoRenew: boolean;
  checkIntervalHours: number;
  thresholdDays: number;
  lastRenewCheck?: string;
  lastRenewResult?: string;
  nextScheduledCheck?: string;
  httpsPort: number;
  detectedIp?: string;
  isDaemonRunning: boolean;
  history: SslRenewalLog[];
}

interface SslBackgroundServiceManagerProps {
  lang: Language;
}

export const SslBackgroundServiceManager: React.FC<SslBackgroundServiceManagerProps> = ({ lang }) => {
  const [ssl, setSsl] = useState<SslBackgroundStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Settings edit state
  const [thresholdDays, setThresholdDays] = useState(30);
  const [intervalHours, setIntervalHours] = useState(6);
  const [autoRenew, setAutoRenew] = useState(true);
  const [customIp, setCustomIp] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ssl/status");
      const data = await res.json();
      if (data.success && data.ssl) {
        setSsl(data.ssl);
        setThresholdDays(data.ssl.thresholdDays || 30);
        setIntervalHours(data.ssl.checkIntervalHours || 6);
        setAutoRenew(data.ssl.autoRenew ?? true);
        if (data.ssl.detectedIp && !customIp) {
          setCustomIp(data.ssl.detectedIp);
        }
      }
    } catch (err: any) {
      setFeedback({ message: `خطا در دریافت وضعیت SSL: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateSsl = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ssl/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customIp: customIp.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ message: data.message || "گواهی SSL با موفقیت صادر و فعال شد.", type: "success" });
        fetchStatus();
      } else {
        throw new Error(data.message || "خطا در صدور گواهی");
      }
    } catch (err: any) {
      setFeedback({ message: `خطا: ${err.message}`, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerAutoRenewCheck = async (force: boolean = false) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ssl/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      setFeedback({
        message: data.message || (data.renewed ? "گواهی SSL با موفقیت تمدید شد." : "بررسی اعتبار گواهی انجام شد."),
        type: data.success ? "success" : "error",
      });
      fetchStatus();
    } catch (err: any) {
      setFeedback({ message: `خطا در اجرای مانیتورینگ تمدید: ${err.message}`, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ssl/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoRenew,
          thresholdDays: Number(thresholdDays),
          checkIntervalHours: Number(intervalHours),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ message: "تنظیمات سرویس پس‌زمینه با موفقیت ذخیره شد.", type: "success" });
        fetchStatus();
      }
    } catch (err: any) {
      setFeedback({ message: `خطا در ذخیره تنظیمات: ${err.message}`, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDaemon = async (action: "start" | "stop") => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/ssl/daemon-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setFeedback({ message: data.message, type: "info" });
      fetchStatus();
    } catch (err: any) {
      setFeedback({ message: `خطا در تغییر وضعیت سرویس: ${err.message}`, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const daysRemaining = ssl?.daysRemaining ?? 0;
  const isExpiringSoon = ssl?.enabled && daysRemaining <= (ssl.thresholdDays || 30);
  const isExpired = ssl?.enabled && daysRemaining <= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {lang === "fa" ? "سرویس پس‌زمینه مانیتورینگ و تمدید خودکار SSL" : "SSL Background Monitor & Auto-Renewal Daemon"}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  ssl?.isDaemonRunning
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }`}
              >
                {ssl?.isDaemonRunning
                  ? lang === "fa"
                    ? "دیمون فعال 24/7"
                    : "DAEMON RUNNING"
                  : lang === "fa"
                  ? "متوقف"
                  : "STOPPED"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === "fa"
                ? "پایش مداوم انقضای گواهی امنیتی آی‌پی سرور و اجرای خودکار دستور تمدید به منظور برقراری اتصال امن و پایدار"
                : "Continuous inspection of server IP SSL expiration with zero-touch automated renewal execution."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>{lang === "fa" ? "بروزرسانی وضعیت" : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === "fa" ? "تنظیمات آستانه" : "Configure"}</span>
          </button>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: SSL Status */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {lang === "fa" ? "وضعیت گواهی SSL" : "Certificate Status"}
            </span>
            {ssl?.enabled ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="text-sm font-bold flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                ssl?.enabled ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            ></span>
            <span className={ssl?.enabled ? "text-emerald-400" : "text-rose-400"}>
              {ssl?.enabled
                ? lang === "fa"
                  ? "فعال و ایمن (HTTPS)"
                  : "Active (HTTPS)"
                : lang === "fa"
                ? "غیرفعال (نیاز به صدور)"
                : "Disabled"}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {ssl?.type === "self_signed" ? "IP SAN Certificate" : ssl?.type || "None"}
          </div>
        </div>

        {/* Card 2: Validity Remaining */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {lang === "fa" ? "اعتبار باقی‌مانده" : "Days Remaining"}
            </span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold font-mono">
            {ssl?.enabled ? (
              <span
                className={
                  isExpired
                    ? "text-rose-400"
                    : isExpiringSoon
                    ? "text-amber-400"
                    : "text-cyan-400"
                }
              >
                {daysRemaining} {lang === "fa" ? "روز" : "Days"}
              </span>
            ) : (
              <span className="text-slate-500">-</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500">
            {lang === "fa"
              ? `آستانه تمدید: ${ssl?.thresholdDays || 30} روز`
              : `Renewal threshold: ${ssl?.thresholdDays || 30}d`}
          </div>
        </div>

        {/* Card 3: Server IP & Domain */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {lang === "fa" ? "آی‌پی سرور و پورت" : "Server IP & Port"}
            </span>
            <Globe className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xs font-mono font-bold text-slate-200 truncate">
            {ssl?.serverIp || "127.0.0.1"}
          </div>
          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>HTTPS: {ssl?.httpsPort || 3443}</span>
            <span className="text-indigo-400">{ssl?.domain || `${ssl?.serverIp}.nip.io`}</span>
          </div>
        </div>

        {/* Card 4: Background Daemon State */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {lang === "fa" ? "بررسی بعدی پایشگر" : "Next Check Time"}
            </span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-xs font-bold text-slate-200 truncate">
            {ssl?.nextScheduledCheck
              ? new Date(ssl.nextScheduledCheck).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : lang === "fa"
              ? "به زودی (پس‌زمینه)"
              : "Pending"}
          </div>
          <div className="text-[10px] text-slate-500">
            {lang === "fa"
              ? `دوره تناوب: هر ${ssl?.checkIntervalHours || 6} ساعت`
              : `Interval: every ${ssl?.checkIntervalHours || 6}h`}
          </div>
        </div>
      </div>

      {/* Expiration Warning Alert if below threshold */}
      {isExpiringSoon && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              {lang === "fa"
                ? `توجه: کمتر از ${daysRemaining} روز از اعتبار گواهی باقی مانده است. سرویس پس‌زمینه در نوبت بعدی به صورت خودکار تمدید را انجام خواهد داد.`
                : `Certificate expires in ${daysRemaining} days. Daemon will renew automatically.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleTriggerAutoRenewCheck(true)}
            disabled={actionLoading}
            className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold border border-amber-500/40 flex-shrink-0"
          >
            {lang === "fa" ? "تمدید فوری اکنون" : "Renew Now"}
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            feedback.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Config Drawer / Modal */}
      {showConfig && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200">
                {lang === "fa" ? "پیکربندی آستانه مانیتورینگ و دوره تناوب پایش" : "Monitoring Daemon Configuration"}
              </h4>
            </div>
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {lang === "fa" ? "آستانه اجرای تمدید خودکار (روز)" : "Renewal Threshold (Days)"}
              </label>
              <input
                type="number"
                min={5}
                max={90}
                value={thresholdDays}
                onChange={(e) => setThresholdDays(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                {lang === "fa" ? "مثلاً اگر کمتر از ۳۰ روز ماند تمدید شود" : "Trigger renew when <= X days remain"}
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {lang === "fa" ? "دوره تناوب بررسی دیمون (ساعت)" : "Check Frequency (Hours)"}
              </label>
              <input
                type="number"
                min={1}
                max={48}
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">
                {lang === "fa" ? "بررسی مداوم هر N ساعت یکبار" : "Inspect cert expiration every N hours"}
              </span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {lang === "fa" ? "تمدید کاملاً خودکار بدون تأیید" : "Auto-Renew Execution"}
              </label>
              <button
                type="button"
                onClick={() => setAutoRenew(!autoRenew)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  autoRenew
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                {autoRenew
                  ? lang === "fa"
                    ? "فعال (خودکار)"
                    : "Enabled (Automatic)"
                  : lang === "fa"
                  ? "فقط اعلام اخطار"
                  : "Alert Only"}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={actionLoading}
              className="py-1.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
            >
              {lang === "fa" ? "ذخیره تغییرات" : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => handleTriggerAutoRenewCheck(false)}
          disabled={actionLoading || !ssl?.enabled}
          className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
          <span>{lang === "fa" ? "اجرای فوری بازرسی انقضا (Health Check)" : "Run Health Check"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTriggerAutoRenewCheck(true)}
          disabled={actionLoading || !ssl?.enabled}
          className="py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{lang === "fa" ? "اجرای دستی دستور تمدید (Force Renew)" : "Execute Force Renew"}</span>
        </button>

        {!ssl?.enabled && (
          <button
            type="button"
            onClick={handleGenerateSsl}
            disabled={actionLoading}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{lang === "fa" ? "صدور و راه‌اندازی اولیه SSL روی آی‌پی" : "Issue IP SSL"}</span>
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {ssl?.isDaemonRunning ? (
            <button
              type="button"
              onClick={() => handleToggleDaemon("stop")}
              disabled={actionLoading}
              className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Square className="w-3 h-3" />
              <span>{lang === "fa" ? "توقف دیمون" : "Stop Daemon"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleDaemon("start")}
              disabled={actionLoading}
              className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>{lang === "fa" ? "فعال‌سازی دیمون" : "Start Daemon"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-Renewal Audit Trail / Log History */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200">
              {lang === "fa" ? "لاگ و تاریخچه عملیات مانیتورینگ خودکار SSL" : "Automated SSL Monitoring Audit Trail"}
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {ssl?.history?.length || 0} {lang === "fa" ? "رویداد ثبت‌شده" : "events"}
          </span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {ssl?.history && ssl.history.length > 0 ? (
            ssl.history.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      item.action === "renew"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : item.action === "generate"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : item.action === "error"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {item.action}
                  </span>
                  <span className="text-slate-300 truncate">{item.message}</span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-[11px] text-slate-500 font-mono">
                  {item.daysRemaining !== undefined && (
                    <span className="text-cyan-400 font-bold">{item.daysRemaining}d</span>
                  )}
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              {lang === "fa" ? "هنوز رویدادی ثبت نشده است." : "No monitoring events recorded yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
