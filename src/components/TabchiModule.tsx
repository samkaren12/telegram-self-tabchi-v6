import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount } from "../types";

interface TabchiModuleProps {
  account: TelegramAccount | null;
  lang: Language;
  onUpdateAccount: (account: TelegramAccount) => void;
}

export const TabchiModule: React.FC<TabchiModuleProps> = ({
  account,
  lang,
  onUpdateAccount,
}) => {
  const t = translations[lang];

  // Tabchi form state
  const [message, setMessage] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(4);
  const [repeatRounds, setRepeatRounds] = useState(3);
  const [repeatInfinite, setRepeatInfinite] = useState(false);
  const [targetMode, setTargetMode] = useState<"all" | "selected">("all");
  const [customTargetsText, setCustomTargetsText] = useState("");

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

  useEffect(() => {
    if (account?.features?.tabchi) {
      setMessage(account.features.tabchi.message || "");
      setIntervalSeconds(account.features.tabchi.interval_seconds || 4);
      setRepeatRounds(account.features.tabchi.repeat_rounds || 3);
      setRepeatInfinite(Boolean(account.features.tabchi.repeat_infinite));
      setTargetMode(account.features.tabchi.target_mode === "selected" ? "selected" : "all");
      setCustomTargetsText((account.features.tabchi.targets || []).join("\n"));
    }
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
        text: lang === "fa" ? "تنظیمات تبچی با موفقیت ذخیره شد." : "Settings saved successfully.",
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

  return (
    <div className="space-y-6" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* HEADER BANNER: PERMANENT LICENSE ACTIVE */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-100 text-sm sm:text-base">
                {t.tabchi.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                HACKER v6
              </span>
            </div>
            <p className="text-xs text-cyan-300/80">
              {t.tabchi.permanentAccess}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{account.phone}</span>
        </div>
      </div>

      {/* METRICS & CONTROLS CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
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
            <span className="text-[11px] text-slate-400 block mb-1">{t.tabchi.intervalLabel}</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {intervalSeconds}s
            </span>
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
                className={`p-3 rounded-xl border text-xs text-right transition-all flex items-start gap-2.5 ${
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
                className={`p-3 rounded-xl border text-xs text-right transition-all flex items-start gap-2.5 ${
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

          {/* Configuration sliders & repeat options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
            {/* Interval slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300">{t.tabchi.intervalLabel}</span>
                <span className="font-mono font-bold text-cyan-400">{intervalSeconds}s</span>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {lang === "fa"
                  ? "توصیه: حداقل ۴ ثانیه جهت جلوگیری از حساسیت آنتی‌اسپم تلگرام"
                  : "Recommended: minimum 4s to prevent FloodWait limits"}
              </p>
            </div>

            {/* Repeat rounds / infinite */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300">{t.tabchi.roundsLabel}</span>
                <span className="font-mono font-bold text-cyan-400">
                  {repeatInfinite ? "24/7" : `${repeatRounds} rounds`}
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
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatInfinite}
                  onChange={(e) => setRepeatInfinite(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-400 font-medium">
                  {t.tabchi.infiniteLoop}
                </span>
              </label>
            </div>
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
