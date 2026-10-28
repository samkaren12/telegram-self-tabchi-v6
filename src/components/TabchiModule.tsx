import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Send,
  Square,
  AlertTriangle,
  CheckCircle2,
  Users,
  Repeat,
  ShieldAlert,
  Loader2,
  Settings,
  Sparkles,
  Save,
  ShieldCheck,
  Target,
  ListFilter,
  Lightbulb,
  Clock,
  Timer,
  Zap,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount } from "../types";

interface TabchiModuleProps {
  account: TelegramAccount | null;
  lang: Language;
  onUpdateAccount: (account: TelegramAccount) => void;
  onOpenHelp?: (section?: any) => void;
}

export const TabchiModule: React.FC<TabchiModuleProps> = ({
  account,
  lang,
  onUpdateAccount,
  onOpenHelp,
}) => {
  const t = translations[lang];

  // Tabchi form state
  const [message, setMessage] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(4);
  const [intervalUnit, setIntervalUnit] = useState<"seconds" | "minutes">("seconds");
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(5);
  const [repeatRounds, setRepeatRounds] = useState(3);
  const [repeatInfinite, setRepeatInfinite] = useState(false);
  const [targetMode, setTargetMode] = useState<"all" | "selected">("all");
  const [sendMode, setSendMode] = useState<"sequential" | "simultaneous">("sequential");
  const [customTargetsText, setCustomTargetsText] = useState("");

  // SpamBot & Account Health Checker state
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthReport, setHealthReport] = useState<any | null>(null);

  // Dialog counts
  const [dialogStats, setDialogStats] = useState({
    total: 0,
    groups: 0,
    users: 0,
    channels: 0,
  });
  const [loadingDialogs, setLoadingDialogs] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadedPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (!account?.features?.tabchi) return;
    if (loadedPhoneRef.current === account.phone) return;
    loadedPhoneRef.current = account.phone;

    setMessage(account.features.tabchi.message || "");
    const initialSec = account.features.tabchi.interval_seconds || 4;
    setIntervalSeconds(initialSec);
    if (initialSec >= 60 && initialSec % 60 === 0) {
      setIntervalUnit("minutes");
      setCustomMinutesInput(Math.floor(initialSec / 60));
    } else {
      setIntervalUnit(initialSec >= 60 ? "minutes" : "seconds");
      setCustomMinutesInput(Math.max(1, Math.round(initialSec / 60)) || 5);
    }
    setRepeatRounds(account.features.tabchi.repeat_rounds || 3);
    setRepeatInfinite(Boolean(account.features.tabchi.repeat_infinite));
    setTargetMode(account.features.tabchi.target_mode === "selected" ? "selected" : "all");
    setSendMode(account.features.tabchi.send_mode === "simultaneous" ? "simultaneous" : "sequential");
    setCustomTargetsText((account.features.tabchi.targets || []).join("\n"));
    setHealthReport(null);

    if (account?.phone) {
      fetchDialogs();
    }
  }, [account?.phone]);

  const fetchDialogs = async () => {
    if (!account) return;
    setLoadingDialogs(true);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/dialogs`);
      const data = await res.json();
      setDialogStats(data);
    } catch (_) {}
    finally {
      setLoadingDialogs(false);
    }
  };

  if (!account) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <Users className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">
          {t.noAccounts}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          {t.noAccountsDesc}
        </p>
      </div>
    );
  }

  const isBroadcasting = account.features?.tabchi?.status === "broadcasting";

  const parseTargets = () => {
    return customTargetsText
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  };

  const formatIntervalText = (sec: number, isFa: boolean) => {
    if (sec >= 60) {
      const mins = Math.floor(sec / 60);
      const remSec = sec % 60;
      if (remSec === 0) {
        return isFa ? `${mins} دقیقه` : `${mins} min`;
      }
      return isFa ? `${mins} دقیقه و ${remSec} ثانیه` : `${mins} min ${remSec}s`;
    }
    return isFa ? `${sec} ثانیه` : `${sec}s`;
  };

  const handleSelectPresetMinutes = (minutes: number) => {
    const sec = minutes * 60;
    setIntervalSeconds(sec);
    setIntervalUnit("minutes");
    setCustomMinutesInput(minutes);
  };

  const handleSelectPresetSeconds = (sec: number) => {
    setIntervalSeconds(sec);
    setIntervalUnit("seconds");
  };

  const handleMinuteChange = (minutesVal: number) => {
    const clamped = Math.max(1, Math.min(minutesVal, 1440));
    setCustomMinutesInput(clamped);
    setIntervalSeconds(clamped * 60);
  };

  const handleSecondChange = (secVal: number) => {
    const clamped = Math.max(2, Math.min(secVal, 3600));
    setIntervalSeconds(clamped);
  };

  const currentMinutes = Math.max(1, Math.round(intervalSeconds / 60));

  const handleRunHealthCheck = async () => {
    if (!account) return;
    setCheckingHealth(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/check-health`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در اجرای چکر سلامت شماره");
      }
      setHealthReport(data.report);
      setFeedback({
        type: "success",
        text: "تست سلامت شماره و استعلام از ربات رسمی @SpamBot با موفقیت انجام شد.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const targets = parseTargets();
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/tabchi/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          intervalSeconds,
          repeatRounds,
          repeatInfinite,
          targetMode,
          targets,
          sendMode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save Tabchi settings.");
      }
      account.features.tabchi = data.tabchi;
      onUpdateAccount({ ...account });
      setFeedback({
        type: "success",
        text: lang === "fa" ? "تنظیمات تبچی و حالت ارسال بنر با موفقیت ذخیره شد." : "Settings saved successfully.",
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Start Broadcasting
  const handleStartBroadcast = async () => {
    if (!message.trim()) {
      setFeedback({
        type: "error",
        text: lang === "fa" ? "لطفاً متن پیام ارسالی را وارد کنید." : "Please enter broadcast message.",
      });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      // First ensure settings are saved
      const targets = parseTargets();
      await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/tabchi/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          intervalSeconds,
          repeatRounds,
          repeatInfinite,
          targetMode,
          targets,
          sendMode,
        }),
      });

      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/tabchi/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در شروع ارسال.");
      }
      account.features.tabchi = data.tabchi;
      onUpdateAccount({ ...account });
      setFeedback({
        type: "success",
        text: lang === "fa" ? "ارسال تبچی با موفقیت آغاز شد!" : "Broadcasting started!",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Stop Broadcasting
  const handleStopBroadcast = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/tabchi/stop`, {
        method: "POST",
      });
      const data = await res.json();
      account.features.tabchi = data.tabchi;
      onUpdateAccount({ ...account });
      setFeedback({
        type: "success",
        text: lang === "fa" ? "ارسال با موفقیت متوقف شد." : "Broadcasting stopped.",
      });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto shadow-2xl border border-slate-800" dir={lang === "fa" ? "rtl" : "ltr"}>
        <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
          <Radio className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {lang === "fa" ? "هیچ اکانت تلگرامی برای ارسال تبچی انتخاب نشده است" : "No Account Selected for Tabchi"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {lang === "fa"
              ? "برای ارسال پیام‌های تبلیغاتی گروهی، لطفاً ابتدا از تب مدیریت حساب‌ها یک اکانت تلگرام متصل کرده و آن را انتخاب کنید."
              : "To broadcast messages, please connect a Telegram account and select it from Accounts tab."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* HEADER BANNER: PERMANENT LICENSE ACTIVE */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 text-sm sm:text-base">
                {t.tabchi.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40 font-mono">
                HACKER v6
              </span>
            </div>
            <p className="text-xs text-cyan-300/80">
              {t.tabchi.permanentAccess}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenHelp && (
            <button
              type="button"
              onClick={() => onOpenHelp("tabchi")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all active:scale-95 cursor-pointer"
              title="آموزش تصویری تبچی و تبلیغات گروهی"
            >
              <Lightbulb className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>راهنمای تبچی 💡</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-mono bg-black/80 px-3.5 py-2 rounded-2xl border border-rose-500/30 text-rose-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <span>{account.phone}</span>
          </div>
        </div>
      </div>

      {/* METRICS & CONTROLS CONTAINER */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  {lang === "fa" ? "ارسال هوشمند و انبوه پیام" : "Smart Automated Broadcaster"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    isBroadcasting
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {isBroadcasting
                    ? t.status.broadcasting
                    : account.features?.tabchi?.status === "stopped"
                    ? t.status.stopped
                    : t.status.idle}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl mt-0.5">
                {t.tabchi.desc}
              </p>
            </div>
          </div>

          {/* Quick Targets Stats */}
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">{t.tabchi.targetCount}</span>
            <span className="font-bold font-mono text-cyan-300">
              {loadingDialogs ? "..." : `${dialogStats.groups} ${lang === "fa" ? "گروه عضو" : "groups"}`}
            </span>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">{t.tabchi.sent}</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {account.features?.tabchi?.total_sent || 0}
            </span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">{t.tabchi.failed}</span>
            <span className="text-xl font-bold font-mono text-rose-400">
              {account.features?.tabchi?.total_failed || 0}
            </span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">{t.tabchi.roundsLabel}</span>
            <span className="text-xl font-bold font-mono text-cyan-400">
              {repeatInfinite ? "∞ 24/7" : `${repeatRounds}x`}
            </span>
          </div>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">
              {lang === "fa" ? "زمان‌بندی ارسال بنر" : t.tabchi.intervalLabel}
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
                {formatIntervalText(intervalSeconds, lang === "fa")}
              </span>
              {intervalSeconds >= 60 && (
                <span className="text-[10px] font-mono text-slate-500">
                  ({intervalSeconds}s)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MESSAGE COMPOSER */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t.tabchi.messageLabel}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.tabchi.messagePlaceholder}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all leading-relaxed"
            />
          </div>

          {/* TARGET MODE SELECTOR */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>{t.tabchi.targetModeTitle}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetMode("all")}
                className={`p-3 rounded-xl border text-xs text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                  targetMode === "all"
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full mt-0.5 border flex-shrink-0 ${targetMode === "all" ? "bg-cyan-400 border-cyan-400" : "border-slate-600"}`}></div>
                <div>
                  <div>{t.tabchi.targetAll}</div>
                  <div className="text-[10px] opacity-75 font-normal">ارسال خودکار به تمام گروه‌هایی که این اکانت در آنها حضور دارد.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetMode("selected")}
                className={`p-3 rounded-xl border text-xs text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                  targetMode === "selected"
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full mt-0.5 border flex-shrink-0 ${targetMode === "selected" ? "bg-cyan-400 border-cyan-400" : "border-slate-600"}`}></div>
                <div>
                  <div>{t.tabchi.targetSelected}</div>
                  <div className="text-[10px] opacity-75 font-normal">ارسال فقط به لیست اختصاصی از گروه‌ها و سوپرگروه‌ها.</div>
                </div>
              </button>
            </div>

            {targetMode === "selected" && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.tabchi.customTargetsLabel}
                </label>
                <textarea
                  rows={3}
                  value={customTargetsText}
                  onChange={(e) => setCustomTargetsText(e.target.value)}
                  placeholder={t.tabchi.customTargetsPlaceholder}
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          {/* BROADCAST DISPATCH MODE: SEQUENTIAL (ONE BY ONE) VS SIMULTANEOUS (ALL AT ONCE) */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>شیوه ارسال بنر به گروه‌ها (تک‌به‌تک یا همزمان)</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                {sendMode === "simultaneous" ? "⚡ ارسال همزمان فعال" : "🔄 ارسال تک‌به‌تک نوبتی فعال"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSendMode("sequential")}
                className={`p-3.5 rounded-xl border text-xs text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                  sendMode === "sequential"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full mt-0.5 border flex-shrink-0 ${sendMode === "sequential" ? "bg-emerald-400 border-emerald-400" : "border-slate-600"}`}></div>
                <div>
                  <div className="text-xs sm:text-sm">🔄 ارسال تک‌به‌تک به گروه‌ها (نوبتی و ضد اسپم)</div>
                  <div className="text-[10px] opacity-80 font-normal mt-0.5 leading-relaxed">
                    بنر به صورت یکی‌یکی و با رعایت فاصله زمانی تعیین‌شده بین هر گروه ارسال می‌شود تا امنیت اکانت در بالاترین سطح بماند.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSendMode("simultaneous")}
                className={`p-3.5 rounded-xl border text-xs text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                  sendMode === "simultaneous"
                    ? "bg-amber-500/15 border-amber-500 text-amber-200 font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full mt-0.5 border flex-shrink-0 ${sendMode === "simultaneous" ? "bg-amber-400 border-amber-400" : "border-slate-600"}`}></div>
                <div>
                  <div className="text-xs sm:text-sm">⚡ ارسال همزمان به تمامی گروه‌ها (پخش آنی)</div>
                  <div className="text-[10px] opacity-80 font-normal mt-0.5 leading-relaxed">
                    بنر در یک لحظه به صورت موازی به تمام گروه‌های هدف ارسال می‌شود و سپس تا دور بعدی (مثلاً ۵ یا ۱۰ دقیقه بعد) صبر می‌کند.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ACCOUNT HEALTH & @SPAMBOT CHECKER */}
          <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    🩺 چکر سلامت شماره و تست رسمی @SpamBot تلگرام
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    بررسی زنده سالم بودن نشست شماره، پینگ اتصال و استعلام مستقیم محدودیت یا ریپورت از ربات رسمی SpamBot تلگرام
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunHealthCheck}
                disabled={checkingHealth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {checkingHealth ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>
                  {checkingHealth ? "در حال استعلام از @SpamBot..." : "🩺 اجرای تست سلامت و SpamBot"}
                </span>
              </button>
            </div>

            {healthReport && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">وضعیت سلامت اکانت:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        healthReport.spamBotStatus === "clean"
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                          : healthReport.spamBotStatus === "temp_restricted"
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {healthReport.spamBotStatusLabel}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-cyan-400">
                    ⚡ پینگ سرور: {healthReport.latencyMs}ms
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold">
                    🤖 پاسخ مستقیم ربات رسمی @SpamBot تلگرام:
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {healthReport.spamBotRawResponse}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BANNER TIMING & INTERVAL CONTROLS */}
          <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      {lang === "fa" ? "زمان‌بندی و فاصله ارسال بنر تبلیغاتی" : "Banner Sending Timing & Interval"}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold">
                      {formatIntervalText(intervalSeconds, lang === "fa")}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === "fa"
                      ? "تعیین فاصله زمانی بین ارسال بنرها به گروه‌ها (بر حسب دقیقه یا ثانیه)"
                      : "Configure delay between banner broadcasts to groups (minutes or seconds)"}
                  </p>
                </div>
              </div>

              {/* Unit Toggle Tabs (Seconds vs Minutes) */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIntervalUnit("minutes");
                    if (intervalSeconds < 60) {
                      setIntervalSeconds(5 * 60);
                      setCustomMinutesInput(5);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    intervalUnit === "minutes"
                      ? "bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "fa" ? "بر حسب دقیقه" : "Minutes"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIntervalUnit("seconds");
                    if (intervalSeconds > 120) {
                      setIntervalSeconds(30);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    intervalUnit === "seconds"
                      ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === "fa" ? "بر حسب ثانیه" : "Seconds"}</span>
                </button>
              </div>
            </div>

            {/* Quick Presets for Minutes (User requested: 5, 10, 15, 30 min) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "fa" ? "دکمه‌های انتخاب سریع ارسال بنر (دقیقه):" : "Quick Minute Presets:"}</span>
                </span>
                <span className="text-[11px] text-amber-400/90 font-mono">
                  {intervalSeconds >= 60
                    ? `${lang === "fa" ? "تنظیم فعلی:" : "Current:"} هر ${Math.floor(intervalSeconds / 60)} دقیقه`
                    : `${lang === "fa" ? "تنظیم فعلی:" : "Current:"} ${intervalSeconds} ثانیه`}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[
                  { m: 5, labelFa: "۵ دقیقه", sub: "۳۰۰ ثانیه", popular: true },
                  { m: 10, labelFa: "۱۰ دقیقه", sub: "۶۰۰ ثانیه" },
                  { m: 15, labelFa: "۱۵ دقیقه", sub: "۹۰۰ ثانیه" },
                  { m: 30, labelFa: "۳۰ دقیقه", sub: "۱۸۰۰ ثانیه" },
                  { m: 45, labelFa: "۴۵ دقیقه", sub: "۲۷۰۰ ثانیه" },
                  { m: 60, labelFa: "۶۰ دقیقه (۱ ساعت)", sub: "۳۶۰۰ ثانیه" },
                ].map((preset) => {
                  const isSelected = intervalSeconds === preset.m * 60;
                  return (
                    <button
                      key={preset.m}
                      type="button"
                      onClick={() => handleSelectPresetMinutes(preset.m)}
                      className={`relative p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50"
                          : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      {preset.popular && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-bold">
                          {lang === "fa" ? "پیشنهادی" : "Best"}
                        </span>
                      )}
                      <div className="font-bold text-xs sm:text-sm">
                        {lang === "fa" ? preset.labelFa : `${preset.m} min`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {preset.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Presets for Seconds (Fast broadcast) */}
            <div className="space-y-2 pt-1 border-t border-slate-900">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>{lang === "fa" ? "انتخاب سریع بر حسب ثانیه (ارسال سریع):" : "Quick Second Presets:"}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { s: 4, labelFa: "۴ ثانیه (ضداسپم)", labelEn: "4s (AntiSpam)" },
                  { s: 10, labelFa: "۱۰ ثانیه", labelEn: "10s" },
                  { s: 20, labelFa: "۲۰ ثانیه", labelEn: "20s" },
                  { s: 30, labelFa: "۳۰ ثانیه", labelEn: "30s" },
                  { s: 45, labelFa: "۴۵ ثانیه", labelEn: "45s" },
                  { s: 60, labelFa: "۶۰ ثانیه (۱ دقیقه)", labelEn: "60s (1m)" },
                ].map((p) => {
                  const isSelected = intervalSeconds === p.s;
                  return (
                    <button
                      key={p.s}
                      type="button"
                      onClick={() => handleSelectPresetSeconds(p.s)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-sm"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {lang === "fa" ? p.labelFa : p.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SLIDER & NUMERIC INPUT DUAL CONTROLS */}
            <div className="pt-2 border-t border-slate-850">
              {intervalUnit === "minutes" ? (
                <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-medium">
                      {lang === "fa" ? "اسلایدر یا تایپ دستی بر حسب دقیقه:" : "Custom Minute Interval:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={1440}
                        value={currentMinutes}
                        onChange={(e) => handleMinuteChange(Number(e.target.value) || 1)}
                        className="w-16 px-2 py-1 bg-slate-950 border border-amber-500/40 rounded-lg text-amber-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-amber-400"
                      />
                      <span className="font-bold text-amber-400 text-xs">
                        {lang === "fa" ? "دقیقه" : "min"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    step={1}
                    value={Math.min(60, currentMinutes)}
                    onChange={(e) => handleMinuteChange(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{lang === "fa" ? "۱ دقیقه" : "1 min"}</span>
                    <span className="text-amber-300/80 font-mono">
                      {lang === "fa"
                        ? `معادل ${currentMinutes * 60} ثانیه تأخیر بین ارسال بنرها`
                        : `Equals ${currentMinutes * 60} seconds delay`}
                    </span>
                    <span>{lang === "fa" ? "۶۰ دقیقه" : "60 min"}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-medium">
                      {lang === "fa" ? "اسلایدر یا تایپ دستی بر حسب ثانیه:" : "Custom Seconds Interval:"}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={2}
                        max={3600}
                        value={intervalSeconds}
                        onChange={(e) => handleSecondChange(Number(e.target.value) || 2)}
                        className="w-16 px-2 py-1 bg-slate-950 border border-cyan-500/40 rounded-lg text-cyan-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-cyan-400"
                      />
                      <span className="font-bold text-cyan-400 text-xs">
                        {lang === "fa" ? "ثانیه" : "sec"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={120}
                    value={Math.min(120, intervalSeconds)}
                    onChange={(e) => handleSecondChange(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{lang === "fa" ? "۲ ثانیه" : "2s"}</span>
                    <span className="text-cyan-300/80 font-mono">
                      {intervalSeconds >= 60
                        ? `معادل ${(intervalSeconds / 60).toFixed(1)} دقیقه`
                        : (lang === "fa" ? "توصیه: حداقل ۴ ثانیه جهت امنیت اکانت" : "Min 4s recommended")}
                    </span>
                    <span>{lang === "fa" ? "۱۲۰ ثانیه" : "120s"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Informational tips banner */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                {lang === "fa"
                  ? "💡 زمان‌بندی هوشمند بنر: برای ارسال‌های مداوم و تبلیغات گسترده در طول روز، تنظیم روی ۵ تا ۳۰ دقیقه بهترین بازدهی را دارد؛ چون بدون بن شدن اکانت تلگرام یا محدودیت فلود، بنر تبلیغاتی شما مرتباً در گروه‌ها تازه و در معرض دید قرار می‌گیرد."
                  : "💡 Pro Tip: For 24/7 continuous promotion without Telegram spam restrictions, setting intervals between 5 to 30 minutes gives maximum visibility and keeps your account completely safe."}
              </div>
            </div>
          </div>

          {/* REPEAT ROUNDS & INFINITE LOOP */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-200 font-bold flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-cyan-400" />
                <span>{t.tabchi.roundsLabel}</span>
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {repeatInfinite ? "24/7 بدون توقف (Infinite)" : `${repeatRounds} دور (Rounds)`}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              disabled={repeatInfinite}
              value={repeatRounds}
              onChange={(e) => setRepeatRounds(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-30"
            />
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={repeatInfinite}
                onChange={(e) => setRepeatInfinite(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs text-slate-300 font-medium">
                {t.tabchi.infiniteLoop}
              </span>
            </label>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleSaveSettings}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === "fa" ? "ذخیره متن و تنظیمات" : "Save Settings"}</span>
          </button>

          <div className="flex items-center gap-2">
            {isBroadcasting ? (
              <button
                onClick={handleStopBroadcast}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all transform active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{t.tabchi.stopBtn}</span>
              </button>
            ) : (
              <button
                onClick={handleStartBroadcast}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{t.tabchi.startBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
