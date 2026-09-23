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
  ExternalLink,
  Zap,
  Power,
  RefreshCw,
  Send,
  Sliders,
  Check,
  Download,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { SystemHealth } from "../types";
import { UpdateManager } from "./UpdateManager";
import { SslBackgroundServiceManager } from "./SslBackgroundServiceManager";

interface SystemStatusProps {
  health: SystemHealth | null;
  lang: Language;
  onOpenOwnerPasswordModal?: () => void;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ health, lang, onOpenOwnerPasswordModal }) => {
  const t = translations[lang];

  // BotFather Controller & MTProto API State
  const [botEnabled, setBotEnabled] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [botFirstName, setBotFirstName] = useState("");
  const [botStatus, setBotStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [savingBot, setSavingBot] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
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
        setBotFirstName(b.bot_first_name || "");
        setBotStatus(b.status || (b.enabled && b.bot_token ? "connected" : "disconnected"));
        if (b.api_id) setApiId(String(b.api_id));
        if (b.api_hash) setApiHash(String(b.api_hash));
      }
    } catch (_) {}
  };

  const handleTestAndConnect = async () => {
    if (!botToken.trim()) {
      setIsFeedbackError(true);
      setBotFeedback(lang === "fa" ? "لطفاً ابتدا توکن ربات تلگرام را وارد کنید." : "Please enter the bot token first.");
      return;
    }

    setTestingBot(true);
    setBotFeedback(null);
    setIsFeedbackError(false);

    try {
      // 1. Live test token via API
      const testRes = await fetch("/api/bot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });
      const testData = await testRes.json();
      if (!testRes.ok || !testData.success) {
        throw new Error(testData.message || (lang === "fa" ? "توکن واردشده معتبر نیست یا دسترسی تلگرام مسدود است." : "Invalid bot token."));
      }

      // 2. Save settings and activate bot
      const saveRes = await fetch("/api/bot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: true,
          botToken: botToken.trim(),
          ownerId: ownerId.trim(),
          apiId: apiId ? Number(apiId) : undefined,
          apiHash: apiHash ? apiHash.trim() : undefined,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.message || "Failed to save bot settings.");
      }

      setBotEnabled(true);
      setBotUsername(testData.username || "");
      setBotFirstName(testData.firstName || "Bot");
      setBotStatus("connected");

      setBotFeedback(
        lang === "fa"
          ? `ربات با موفقیت تایید و متصل شد: @${testData.username} (${testData.firstName}). اکنون دکمه‌های شیشه‌ای در تلگرام فعال هستند!`
          : `Bot verified & connected: @${testData.username}. Telegram inline glass keys are now active!`
      );
    } catch (err: any) {
      setIsFeedbackError(true);
      setBotStatus("error");
      setBotFeedback(err.message || (lang === "fa" ? "خطا در اتصال به ربات تلگرام" : "Bot connection error"));
    } finally {
      setTestingBot(false);
    }
  };

  const handleDisconnectBot = async () => {
    setSavingBot(true);
    try {
      await fetch("/api/bot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: false,
          botToken: botToken.trim(),
          ownerId: ownerId.trim(),
          apiId: apiId ? Number(apiId) : undefined,
          apiHash: apiHash ? apiHash.trim() : undefined,
        }),
      });
      setBotEnabled(false);
      setBotStatus("disconnected");
      setBotFeedback(lang === "fa" ? "ارتباط ربات تلگرام متوقف شد." : "Bot controller disconnected.");
      setTimeout(() => setBotFeedback(null), 4000);
    } catch (_) {
    } finally {
      setSavingBot(false);
    }
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
          botToken: botToken.trim(),
          ownerId: ownerId.trim(),
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
      if (b?.bot_first_name) {
        setBotFirstName(b.bot_first_name);
      }
      setBotStatus(b.enabled ? "connected" : "disconnected");
      setBotFeedback(
        lang === "fa"
          ? `تنظیمات ذخیره شد ${b?.bot_username ? `(متصل به @${b.bot_username})` : ""}`
          : `Settings saved successfully ${b?.bot_username ? `(@${b.bot_username})` : ""}`
      );
      setTimeout(() => setBotFeedback(null), 5000);
    } catch (err: any) {
      setIsFeedbackError(true);
      setBotStatus("error");
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-lg shadow-cyan-950/40">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 className="font-bold text-slate-100 text-sm sm:text-base">
                  {t.system.botTitle}
                </h4>
                {botStatus === "connected" && botUsername ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {lang === "fa" ? "آنلاین و متصل" : "Connected"}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-medium border border-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    {lang === "fa" ? "غیرفعال" : "Disconnected"}
                  </span>
                )}
                {botUsername && (
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px] font-mono font-bold border border-cyan-500/30 flex items-center gap-1 hover:bg-cyan-500/25 transition-all"
                  >
                    <span>@{botUsername}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                {lang === "fa"
                  ? "با اتصال ربات، می‌توانید بدون نیاز به ورود به این پنل، از طریق کلیدهای شیشه‌ای لمسی و رنگی در تلگرام، سلف تایم، تبچی و اکانت‌های خود را کنترل کنید."
                  : "Connect your Telegram bot to manage Self-Time, Tabchi, and accounts remotely using native inline glass keyboards."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            {botUsername && botStatus === "connected" && (
              <a
                href={`https://t.me/${botUsername}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === "fa" ? "باز کردن در تلگرام" : "Open in Telegram"}</span>
              </a>
            )}
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" title={lang === "fa" ? "روشن / خاموش کردن ربات" : "Toggle Bot"}>
              <input
                type="checkbox"
                checked={botEnabled}
                onChange={(e) => setBotEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                {t.system.botTokenLabel}
              </label>
              <span className="text-[11px] text-slate-400">
                {lang === "fa" ? "ساخت در تلگرام با @BotFather" : "Create via @BotFather"}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                dir="ltr"
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              <button
                type="button"
                onClick={handleTestAndConnect}
                disabled={testingBot || !botToken.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-40 transition-all flex-shrink-0 active:scale-95"
              >
                {testingBot ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-slate-950" />
                )}
                <span>{testingBot ? (lang === "fa" ? "درحال بررسی..." : "Checking...") : (lang === "fa" ? "تست و اتصال سریع" : "Test & Connect")}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                {t.system.botOwnerIdLabel}
              </label>
              <span className="text-[10px] text-cyan-400 font-medium">
                {lang === "fa" ? "ثبت خودکار با استارت اول" : "Auto-claims on /start"}
              </span>
            </div>
            <input
              type="text"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder={lang === "fa" ? "مثال: 589412345 (یا خالی بگذارید)" : "e.g. 589412345 (or leave blank)"}
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {lang === "fa" ? "API ID (اختیاری)" : "API ID (Optional)"}
              </label>
              <input
                type="text"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                placeholder="2496"
                dir="ltr"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {lang === "fa" ? "API HASH (اختیاری)" : "API HASH (Optional)"}
              </label>
              <input
                type="text"
                value={apiHash}
                onChange={(e) => setApiHash(e.target.value)}
                placeholder="my.telegram.org"
                dir="ltr"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {botFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-sm transition-all ${
              isFeedbackError
                ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
                : "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
            }`}
          >
            {isFeedbackError ? (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            )}
            <span className="leading-relaxed">{botFeedback}</span>
          </div>
        )}

        {/* Telegram Inline Glass Buttons Preview (Interactive Simulator) */}
        <div className="bg-slate-950/80 border border-cyan-900/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                {lang === "fa" ? "پیش‌نمایش کلیدهای شیشه‌ای تلگرام (Inline Buttons)" : "Telegram Inline Glass Buttons Live Preview"}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
              v6 Telegram UI Pro
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {lang === "fa"
              ? "پس از لمس دکمه «تست و اتصال سریع»، کافیست وارد ربات خود شوید و /start را ارسال کنید. این کلیدهای شیشه‌ای زیبا و تعاملی نمایش داده می‌شوند و با لمس هر کدام، وضعیت سلف و تبچی فوراً تغییر می‌کند:"
              : "After connecting, open your bot and send /start. These interactive glass buttons will be displayed in real time:"}
          </p>

          <div className="space-y-2 max-w-lg mx-auto pt-1 font-sans">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm shadow-cyan-950/50 hover:border-cyan-400 cursor-default transition-all">
                <span>⏰ ساعت سلف: روشن 🟢</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm shadow-cyan-950/50 hover:border-cyan-400 cursor-default transition-all">
                <span>🚀 تبچی: فعال 🟢</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs font-medium hover:border-slate-600 cursor-default transition-all">
                <span>💬 منشی خودکار</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs font-medium hover:border-slate-600 cursor-default transition-all">
                <span>🔤 استایل و فونت</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs font-medium hover:border-slate-600 cursor-default transition-all">
                <span>👥 مدیریت اکانت‌ها</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs font-medium hover:border-slate-600 cursor-default transition-all">
                <span>📊 آمار و دایاگ‌ها 📈</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs font-medium hover:border-slate-600 cursor-default transition-all">
                <span>📋 آخرین لاگ‌ها 📑</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 text-xs font-medium hover:border-slate-600 cursor-default transition-all">
                <span>🏓 پینگ سرور ⚡️</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900/90 border border-cyan-800/40 text-cyan-400 text-xs font-bold hover:border-cyan-500 cursor-default transition-all">
              <span>🔄 بروزرسانی وضعیت پنل 🔁</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {botStatus === "connected" ? (
            <button
              type="button"
              onClick={handleDisconnectBot}
              disabled={savingBot}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{lang === "fa" ? "قطع ارتباط ربات" : "Disconnect Bot"}</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500">
              {lang === "fa" ? "ربات هم‌اکنون غیرفعال است" : "Bot is currently inactive"}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveBotSettings}
              disabled={savingBot}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>
                {savingBot
                  ? (lang === "fa" ? "درحال ذخیره..." : "Saving...")
                  : t.self.saveChanges}
              </span>
            </button>
          </div>
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
              <span className="text-slate-400">{lang === "fa" ? "رمز ورود اولیه سرور:" : "Initial Startup Password:"}</span>
              <span className="text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20" dir="ltr">
                samkaren12
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">{lang === "fa" ? "پروتکل اتصال:" : "Connection Protocol:"}</span>
              <span className="text-slate-200 font-mono">GramJS MTProto v2.0 Native</span>
            </div>
          </div>

          {onOpenOwnerPasswordModal && (
            <button
              type="button"
              onClick={onOpenOwnerPasswordModal}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>{lang === "fa" ? "تغییر نام‌کاربری و رمز عبور اختصاصی مالک" : "Change Owner Username & Password"}</span>
            </button>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {lang === "fa"
              ? "🔒 سشن‌های تلگرام و کلیدهای ارتباطی به صورت کاملاً ایزوله در سرور اختصاصی ذخیره شده و بدون ذخیره هیچ‌گونه دیتایی روی سرورهای متفرقه اجرا می‌شوند."
              : "🔒 Telegram sessions and authentication keys are stored in an isolated, encrypted local state directory without 3rd-party relays."}
          </p>
        </div>
      </div>

      {/* DEDICATED REPOSITORY UPDATE MANAGER & CHANGELOG */}
      <UpdateManager lang={lang} />

      {/* COMPREHENSIVE SSL BACKGROUND SERVICE MONITOR & AUTO-RENEWAL DAEMON */}
      <SslBackgroundServiceManager lang={lang} />
    </div>
  );
};
