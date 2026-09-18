import React, { useState, useEffect } from "react";
import {
  Server,
  Activity,
  Cpu,
  Shield,
  Key,
  Globe,
  Radio,
  Clock,
  Terminal,
  Layers,
  Bot,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { SystemHealth } from "../types";

interface SystemStatusProps {
  health: SystemHealth | null;
  lang: Language;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ health, lang }) => {
  const t = translations[lang];

  // BotFather Controller & MTProto API State
  const [botEnabled, setBotEnabled] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [savingBot, setSavingBot] = useState(false);
  const [botFeedback, setBotFeedback] = useState<string | null>(null);
  const [isFeedbackError, setIsFeedbackError] = useState(false);

  useEffect(() => {
    fetchBotSettings();
  }, []);

  const fetchBotSettings = async () => {
    try {
      const res = await fetch("/api/bot-settings");
      const data = await res.json();
      const b = data.settings || data.bot;
      if (b) {
        setBotEnabled(Boolean(b.enabled));
        setBotToken(b.bot_token || "");
        setOwnerId(b.owner_id ? String(b.owner_id) : "");
        setBotUsername(b.bot_username || "");
        if (b.api_id) setApiId(String(b.api_id));
        if (b.api_hash) setApiHash(String(b.api_hash));
      }
    } catch (_) {}
  };

  const handleSaveBotSettings = async () => {
    setSavingBot(true);
    setBotFeedback(null);
    setIsFeedbackError(false);
    try {
      const res = await fetch("/api/bot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: botEnabled,
          botToken,
          ownerId,
          apiId: apiId ? Number(apiId) : undefined,
          apiHash: apiHash ? apiHash.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save bot settings.");
      }
      const b = data.settings || data.bot;
      if (b?.bot_username) {
        setBotUsername(b.bot_username);
      }
      setBotFeedback(
        lang === "fa"
          ? `تنظیمات با موفقیت ذخیره شد ${b?.bot_username ? `(متصل به @${b.bot_username})` : ""}`
          : `Settings saved successfully ${b?.bot_username ? `(@${b.bot_username})` : ""}`
      );
      setTimeout(() => setBotFeedback(null), 5000);
    } catch (err: any) {
      setIsFeedbackError(true);
      setBotFeedback(err.message || "Error saving bot config");
    } finally {
      setSavingBot(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-medium text-slate-400">
              {t.system.gateway}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <span>{t.system.gatewayStatus}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            DC IP Protocol: MTProto v2.0
          </p>
        </div>

        {/* Uptime */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-medium text-slate-400">
              {t.system.uptime}
            </span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {health ? formatUptime(health.uptimeSeconds) : "..."}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            24/7 Permanent Background Loop
          </p>
        </div>

        {/* RAM Usage */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-medium text-slate-400">
              {t.system.memory}
            </span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold font-mono text-purple-300">
            {health ? `${health.memoryUsageMb} MB` : "..."}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Node.js V8 Heap & Native Buffer
          </p>
        </div>

        {/* Active Accounts */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-medium text-slate-400">
              {t.system.activeAccounts}
            </span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-300">
            {health ? `${health.connectedAccountsCount} Accounts` : "..."}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Telethon / GramJS Multi-Client
          </p>
        </div>
      </div>

      {/* BotFather Remote Controller Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-100 text-sm sm:text-base">
                  {t.system.botTitle}
                </h4>
                {botUsername ? (
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 hover:underline"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    @{botUsername}
                  </a>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                    @BotFather
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                {t.system.botDesc}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              checked={botEnabled}
              onChange={(e) => setBotEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t.system.botTokenLabel}
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {t.system.botOwnerIdLabel}
            </label>
            <input
              type="text"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder="e.g. 589412345"
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {lang === "fa" ? "Telegram API ID (اختیاری)" : "Telegram API ID (Optional)"}
            </label>
            <input
              type="text"
              value={apiId}
              onChange={(e) => setApiId(e.target.value)}
              placeholder="پیش‌فرض: 2496"
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {lang === "fa" ? "Telegram API HASH (اختیاری)" : "Telegram API HASH (Optional)"}
            </label>
            <input
              type="text"
              value={apiHash}
              onChange={(e) => setApiHash(e.target.value)}
              placeholder="پیش‌فرض: my.telegram.org"
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {botFeedback && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${isFeedbackError ? "bg-rose-950/80 border-rose-500/50 text-rose-300" : "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"}`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{botFeedback}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveBotSettings}
            disabled={savingBot}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{savingBot ? (lang === "fa" ? "درحال اتصال و ذخیره..." : "Connecting & Saving...") : t.self.saveChanges}</span>
          </button>
        </div>
      </div>

      {/* Saved Messages Commands Guide & Remote Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Messages Command Cheat Sheet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <h4 className="font-bold text-slate-100 text-sm">
              {t.system.commandsGuide}
            </h4>
          </div>

          <p className="text-xs text-slate-400">
            {lang === "fa"
              ? "با ارسال هر یک از دستورات زیر در بخش «پیام‌های ذخیره شده» (Saved Messages) اکانت تلگرام، ربات به صورت آنی پاسخ خواهد داد:"
              : "Send these commands directly into your Telegram account's 'Saved Messages':"}
          </p>

          <div className="space-y-2 text-xs font-mono">
            {[
              { cmd: "/self", desc: lang === "fa" ? "مشاهده وضعیت کامل سلف و دکمه‌های کنترل" : "View self status & interactive menu" },
              { cmd: "/self time on", desc: lang === "fa" ? "روشن کردن ساعت روی پروفایل" : "Turn profile clock on" },
              { cmd: "/self time off", desc: lang === "fa" ? "خاموش کردن ساعت روی پروفایل" : "Turn profile clock off" },
              { cmd: "/tabchi", desc: lang === "fa" ? "مشاهده وضعیت ارسال و آمار پیام‌ها" : "View Tabchi broadcast status & metrics" },
              { cmd: "/tabchi start", desc: lang === "fa" ? "شروع فوری ارسال خودکار تبچی" : "Start Tabchi broadcast immediately" },
              { cmd: "/tabchi stop", desc: lang === "fa" ? "توقف فوری ارسال تبچی" : "Stop Tabchi broadcast" },
              { cmd: "=1250 * 18 - 450", desc: lang === "fa" ? "محاسبه خودکار ریاضی در هر چت" : "Instant math in any chat" },
              { cmd: "قیمت دلار / btc", desc: lang === "fa" ? "استعلام لحظه‌ای طلا، ارز و کریپتو" : "Live currency & crypto quote" },
            ].map((c, i) => (
              <div key={i} className="p-2 bg-slate-950 rounded-xl flex items-center justify-between gap-2">
                <span className="text-cyan-400 font-bold" dir="ltr">{c.cmd}</span>
                <span className="text-slate-400 text-[11px]">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & License Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-slate-100 text-sm">
              {lang === "fa" ? "امنیت و لایسنس دائمی (Permanent License)" : "Security & Permanent License"}
            </h4>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{lang === "fa" ? "وضعیت لایسنس:" : "License Status:"}</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {t.system.licenseActive}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{lang === "fa" ? "نسخه پکیج:" : "Package Version:"}</span>
              <span className="text-slate-200 font-mono">Hacker Edition v6.0.0 Pro</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{lang === "fa" ? "رمز ورود پیش‌فرض:" : "Default Startup Password:"}</span>
              <span className="text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20" dir="ltr">
                selfsamkaren12
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{lang === "fa" ? "پروتکل اتصال:" : "Connection Protocol:"}</span>
              <span className="text-slate-200 font-mono">GramJS MTProto v2.0 Native</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {lang === "fa"
              ? "🔒 سشن‌های تلگرام و کلیدهای ارتباطی به صورت کاملاً ایزوله در سرور اختصاصی ذخیره شده و بدون ذخیره هیچ‌گونه دیتایی روی سرورهای متفرقه اجرا می‌شوند."
              : "🔒 Telegram sessions and authentication keys are stored in an isolated, encrypted local state directory without 3rd-party relays."}
          </p>
        </div>
      </div>
    </div>
  );
};
