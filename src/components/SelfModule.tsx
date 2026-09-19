import React, { useState, useEffect } from "react";
import {
  Clock,
  MessageSquare,
  Type,
  Check,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Sparkles,
  Calculator,
  TrendingUp,
  Send,
  Lock,
  Radio,
  ExternalLink,
  ShieldCheck,
  Layers,
  StopCircle,
  Play,
  Users,
  Bot,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import {
  TelegramAccount,
  TelegramAccountFeatures,
  MarketQuote,
} from "../types";
import { transformFont } from "../utils/fontStyler";
import { formatTehranTime } from "../utils/tehranTime";

interface SelfModuleProps {
  account: TelegramAccount | null;
  lang: Language;
  onUpdateAccount: (account: TelegramAccount) => void;
}

export const SelfModule: React.FC<SelfModuleProps> = ({
  account,
  lang,
  onUpdateAccount,
}) => {
  const t = translations[lang];

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<
    "clock" | "autoReply" | "mandatoryJoin" | "tools" | "pmBroadcast" | "fonts"
  >("clock");

  // 1. Self Time state
  const [timeActive, setTimeActive] = useState(false);
  const [timeFormat, setTimeFormat] = useState("HH:mm");
  const [timeStyle, setTimeStyle] = useState<
    TelegramAccountFeatures["self_time"]["font_style"]
  >("bold");
  const [previewTime, setPreviewTime] = useState("");
  const [savingTime, setSavingTime] = useState(false);
  const [timeFeedback, setTimeFeedback] = useState<string | null>(null);

  // 2. Auto Reply state
  const [autoReplyActive, setAutoReplyActive] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMsgText, setNewMsgText] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(1);
  const [savingReply, setSavingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<string | null>(null);

  // 2b. AI Secretary state (Optional)
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState("gemini-3.8-flash");
  const [testingAiKey, setTestingAiKey] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    message: string;
    sampleReply?: string;
  } | null>(null);

  // 3. Mandatory Join state
  const [mandatoryActive, setMandatoryActive] = useState(false);
  const [channels, setChannels] = useState<Array<{ name: string; ref: string }>>([]);
  const [newChName, setNewChName] = useState("");
  const [newChRef, setNewChRef] = useState("");
  const [savingMandatory, setSavingMandatory] = useState(false);
  const [mandatoryFeedback, setMandatoryFeedback] = useState<string | null>(null);

  // 4. Smart Chat Tools state
  const [calcActive, setCalcActive] = useState(true);
  const [marketActive, setMarketActive] = useState(true);
  const [testCalcExpr, setTestCalcExpr] = useState("1250 * 18 - 450");
  const [calcTestResult, setCalcTestResult] = useState<number | string | null>(null);
  const [testAssetQuery, setTestAssetQuery] = useState("usd");
  const [testAmount, setTestAmount] = useState(1);
  const [marketQuoteResult, setMarketQuoteResult] = useState<MarketQuote | null>(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [savingTools, setSavingTools] = useState(false);
  const [toolsFeedback, setToolsFeedback] = useState<string | null>(null);

  // 5. PM Broadcaster state
  const [pmMessage, setPmMessage] = useState("");
  const [pmInterval, setPmInterval] = useState(20);
  const [pmMaxRecipients, setPmMaxRecipients] = useState(50);
  const [pmStatus, setPmStatus] = useState<"idle" | "broadcasting" | "stopped">("idle");
  const [pmTotalSent, setPmTotalSent] = useState(0);
  const [pmLoading, setPmLoading] = useState(false);
  const [pmFeedback, setPmFeedback] = useState<string | null>(null);

  // 6. Font Styler & Scopes state
  const [fontActive, setFontActive] = useState(false);
  const [fontStyle, setFontStyle] = useState<TelegramAccountFeatures["font"]["style"]>("bold");
  const [fontScopes, setFontScopes] = useState({
    self_time: true,
    manual_messages: true,
    auto_reply: true,
    mandatory_join: true,
    tabchi: true,
    remote_ui: false,
  });
  const [sandboxText, setSandboxText] = useState("Telegram Hacker Edition v6 Active 24/7");
  const [copied, setCopied] = useState(false);
  const [savingFont, setSavingFont] = useState(false);
  const [fontFeedback, setFontFeedback] = useState<string | null>(null);

  // Sync state when account changes
  useEffect(() => {
    if (account?.features) {
      // Self Time
      setTimeActive(Boolean(account.features.self_time?.active));
      setTimeFormat(account.features.self_time?.format || "HH:mm");
      setTimeStyle(account.features.self_time?.font_style || "bold");

      // Auto Reply
      setAutoReplyActive(Boolean(account.features.auto_reply?.active));
      setMessages(account.features.auto_reply?.messages || []);
      setDelaySeconds(account.features.auto_reply?.delay_seconds ?? 1);
      setAiEnabled(Boolean(account.features.auto_reply?.ai_enabled));
      setAiApiKey(account.features.auto_reply?.ai_api_key || "");
      setAiPrompt(account.features.auto_reply?.ai_prompt || "");
      setAiModel(account.features.auto_reply?.ai_model || "gemini-3.8-flash");
      setAiTestResult(null);

      // Mandatory Join
      setMandatoryActive(Boolean(account.features.mandatory_join?.active));
      setChannels(account.features.mandatory_join?.channels || []);

      // Tools
      setCalcActive(account.features.tools?.calculator_active ?? true);
      setMarketActive(account.features.tools?.market_active ?? true);

      // Broadcast
      setPmMessage(account.features.broadcast?.message || "");
      setPmInterval(account.features.broadcast?.interval_seconds || 20);
      setPmMaxRecipients(account.features.broadcast?.max_recipients || 50);
      setPmStatus(account.features.broadcast?.status || "idle");
      setPmTotalSent(account.features.broadcast?.total_sent || 0);

      // Fonts
      setFontActive(Boolean(account.features.font?.active));
      setFontStyle(account.features.font?.style || "bold");
      if (account.features.font?.scopes) {
        setFontScopes({
          self_time: account.features.font.scopes.self_time ?? true,
          manual_messages: account.features.font.scopes.manual_messages ?? true,
          auto_reply: account.features.font.scopes.auto_reply ?? true,
          mandatory_join: account.features.font.scopes.mandatory_join ?? true,
          tabchi: account.features.font.scopes.tabchi ?? true,
          remote_ui: account.features.font.scopes.remote_ui ?? false,
        });
      }
    }
  }, [account]);

  // Live preview clock updater (Iran Standard Time - Asia/Tehran UTC+03:30)
  useEffect(() => {
    const updatePreview = () => {
      const raw = formatTehranTime(timeFormat);
      setPreviewTime(transformFont(raw, timeStyle));
    };
    updatePreview();
    const interval = setInterval(updatePreview, 1000);
    return () => clearInterval(interval);
  }, [timeFormat, timeStyle]);

  if (!account) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">
          {t.noAccounts}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          {t.noAccountsDesc}
        </p>
      </div>
    );
  }

  // 1. Save Self Time
  const handleSaveSelfTime = async () => {
    setSavingTime(true);
    setTimeFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/self-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: timeActive,
          format: timeFormat,
          fontStyle: timeStyle,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update Self-Time.");
      }
      account.features.self_time = data.self_time;
      onUpdateAccount({ ...account });
      setTimeFeedback(
        lang === "fa" ? "ساعت پروفایل تلگرام با موفقیت بروزرسانی شد." : "Profile clock updated successfully!"
      );
      setTimeout(() => setTimeFeedback(null), 3000);
    } catch (err: any) {
      setTimeFeedback(err.message || "Error updating self-time");
    } finally {
      setSavingTime(false);
    }
  };

  // 2. Save Auto Reply
  const handleSaveAutoReply = async () => {
    setSavingReply(true);
    setReplyFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/auto-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: autoReplyActive,
          messages,
          delaySeconds,
          aiEnabled,
          aiApiKey,
          aiPrompt,
          aiModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update auto-reply.");
      }
      account.features.auto_reply = data.auto_reply;
      onUpdateAccount({ ...account });
      setReplyFeedback(
        lang === "fa" ? "تنظیمات منشی خودکار و هوش مصنوعی با موفقیت ذخیره شد." : "Auto-reply and AI settings updated successfully!"
      );
      setTimeout(() => setReplyFeedback(null), 3000);
    } catch (err: any) {
      setReplyFeedback(err.message || "Error updating auto-reply");
    } finally {
      setSavingReply(false);
    }
  };

  // Test AI Key
  const handleTestAiKey = async () => {
    if (!aiApiKey.trim()) {
      setAiTestResult({
        success: false,
        message: lang === "fa" ? "لطفاً ابتدا کلید API هوش مصنوعی را وارد فرمایید." : "Please enter an AI API key first.",
      });
      return;
    }
    setTestingAiKey(true);
    setAiTestResult(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: aiApiKey.trim(),
          customPrompt: aiPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === "fa" ? "ارتباط با هوش مصنوعی ناموفق بود." : "AI test failed."));
      }
      setAiTestResult({
        success: true,
        message: lang === "fa" ? "کلید معتبر است و ارتباط با مدل Gemini برقرار شد ✅" : "AI key is valid! Model responded successfully ✅",
        sampleReply: data.reply,
      });
    } catch (err: any) {
      setAiTestResult({
        success: false,
        message: err.message || (lang === "fa" ? "خطا در تست کلید هوش مصنوعی" : "AI key test failed"),
      });
    } finally {
      setTestingAiKey(false);
    }
  };

  const handleAddTemplate = () => {
    if (!newMsgText.trim()) return;
    setMessages([...messages, newMsgText.trim()]);
    setNewMsgText("");
  };

  const handleRemoveTemplate = (idx: number) => {
    setMessages(messages.filter((_, i) => i !== idx));
  };

  // 3. Save Mandatory Join
  const handleSaveMandatoryJoin = async () => {
    setSavingMandatory(true);
    setMandatoryFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/mandatory-join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: mandatoryActive,
          channels,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update mandatory join.");
      }
      account.features.mandatory_join = data.mandatory_join;
      onUpdateAccount({ ...account });
      setMandatoryFeedback(
        lang === "fa" ? "تنظیمات عضویت اجباری کانال‌ها ذخیره شد." : "Mandatory join updated successfully!"
      );
      setTimeout(() => setMandatoryFeedback(null), 3000);
    } catch (err: any) {
      setMandatoryFeedback(err.message || "Error updating mandatory join");
    } finally {
      setSavingMandatory(false);
    }
  };

  const handleAddChannel = () => {
    if (!newChRef.trim()) return;
    setChannels([
      ...channels,
      {
        name: newChName.trim() || newChRef.trim(),
        ref: newChRef.trim().replace(/^@/, ""),
      },
    ]);
    setNewChName("");
    setNewChRef("");
  };

  const handleRemoveChannel = (idx: number) => {
    setChannels(channels.filter((_, i) => i !== idx));
  };

  // 4. Save Chat Tools
  const handleSaveChatTools = async () => {
    setSavingTools(true);
    setToolsFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/chat-tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculatorActive: calcActive,
          marketActive: marketActive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update chat tools.");
      }
      account.features.tools = data.tools;
      onUpdateAccount({ ...account });
      setToolsFeedback(
        lang === "fa" ? "ابزارهای چت با موفقیت فعال شدند." : "Chat tools updated successfully!"
      );
      setTimeout(() => setToolsFeedback(null), 3000);
    } catch (err: any) {
      setToolsFeedback(err.message || "Error updating chat tools");
    } finally {
      setSavingTools(false);
    }
  };

  const handleTestCalc = () => {
    try {
      const clean = testCalcExpr.replace(/[,٬]/g, "").replace(/×/g, "*").replace(/÷/g, "/");
      const fn = new Function(`"use strict"; return (${clean});`);
      const val = fn();
      setCalcTestResult(val);
    } catch (err: any) {
      setCalcTestResult(lang === "fa" ? "خطا در فرمول" : "Error in syntax");
    }
  };

  const handleFetchTestQuote = async () => {
    setFetchingQuote(true);
    setMarketQuoteResult(null);
    try {
      const res = await fetch(
        `/api/market/quote?asset=${encodeURIComponent(testAssetQuery)}&amount=${testAmount}`
      );
      const data = await res.json();
      if (data.success && data.quote) {
        setMarketQuoteResult(data.quote);
      }
    } catch (_) {}
    finally {
      setFetchingQuote(false);
    }
  };

  // 5. PM Broadcaster actions
  const handleSavePmBroadcastSettings = async () => {
    setPmLoading(true);
    setPmFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/pm-broadcast/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: pmMessage,
          intervalSeconds: pmInterval,
          maxRecipients: pmMaxRecipients,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save PM broadcast settings.");
      }
      account.features.broadcast = data.broadcast;
      onUpdateAccount({ ...account });
      setPmFeedback(
        lang === "fa" ? "تنظیمات پیام همگانی پی‌وی ذخیره شد." : "PM broadcast settings saved!"
      );
      setTimeout(() => setPmFeedback(null), 3000);
    } catch (err: any) {
      setPmFeedback(err.message);
    } finally {
      setPmLoading(false);
    }
  };

  const handleStartPmBroadcast = async () => {
    setPmLoading(true);
    setPmFeedback(null);
    try {
      // First save settings
      await handleSavePmBroadcastSettings();
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/pm-broadcast/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to start PM broadcast.");
      }
      setPmStatus("broadcasting");
      account.features.broadcast.status = "broadcasting";
      onUpdateAccount({ ...account });
      setPmFeedback(lang === "fa" ? "ارسال پیام همگانی پی‌وی آغاز شد." : "PM broadcast started!");
    } catch (err: any) {
      setPmFeedback(err.message);
    } finally {
      setPmLoading(false);
    }
  };

  const handleStopPmBroadcast = async () => {
    setPmLoading(true);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/pm-broadcast/stop`, {
        method: "POST",
      });
      const data = await res.json();
      setPmStatus("stopped");
      account.features.broadcast.status = "stopped";
      onUpdateAccount({ ...account });
      setPmFeedback(lang === "fa" ? "ارسال پیام همگانی متوقف شد." : "PM broadcast stopped.");
    } catch (err: any) {
      setPmFeedback(err.message);
    } finally {
      setPmLoading(false);
    }
  };

  // 6. Font Scopes Save
  const handleSaveFontScopes = async () => {
    setSavingFont(true);
    setFontFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/font-scopes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: fontActive,
          style: fontStyle,
          scopes: fontScopes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update font config.");
      }
      account.features.font = data.font;
      onUpdateAccount({ ...account });
      setFontFeedback(
        lang === "fa" ? "تنظیمات فونت و اسکوپ‌ها با موفقیت ذخیره گردید." : "Font & scopes saved successfully!"
      );
      setTimeout(() => setFontFeedback(null), 3000);
    } catch (err: any) {
      setFontFeedback(err.message);
    } finally {
      setSavingFont(false);
    }
  };

  const handleCopySandbox = () => {
    const styled = transformFont(sandboxText, fontStyle);
    navigator.clipboard.writeText(styled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recipientCount = Object.keys(account.features.broadcast?.recipients || {}).length;

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
                {t.self.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                HACKER v6
              </span>
            </div>
            <p className="text-xs text-cyan-300/80">
              {t.self.permanentAccess}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{account.phone}</span>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: "clock", label: t.self.tabs.clock, icon: Clock, color: "text-cyan-400" },
          { id: "autoReply", label: t.self.tabs.autoReply, icon: MessageSquare, color: "text-emerald-400" },
          { id: "mandatoryJoin", label: t.self.tabs.mandatoryJoin, icon: Lock, color: "text-amber-400" },
          { id: "tools", label: t.self.tabs.tools, icon: Calculator, color: "text-blue-400" },
          { id: "pmBroadcast", label: t.self.tabs.pmBroadcast, icon: Radio, color: "text-rose-400" },
          { id: "fonts", label: t.self.tabs.fonts, icon: Type, color: "text-purple-400" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? tab.color : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. SUB-TAB: PROFILE CLOCK */}
      {activeSubTab === "clock" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  {t.self.timeTitle}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  {t.self.timeDesc}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={timeActive}
                onChange={(e) => setTimeActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Profile Live Preview Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {account.firstName ? account.firstName[0].toUpperCase() : "U"}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-0.5">
                  <span>{t.self.previewLabel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono">
                    {lang === "fa" ? "ساعت رسمی ایران (IRST / +03:30)" : "Iran Time (IRST / +03:30)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-base font-bold text-slate-100">
                  <span>{account.firstName || "Telegram"}</span>
                  <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 font-mono">
                    {timeActive ? previewTime : account.lastName || "(بدون فامیلی)"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono" dir="ltr">
                  @{account.username || "username"} • {account.phone}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${timeActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
                {timeActive ? (lang === "fa" ? "ساعت زنده فعال است" : "Live clock active") : (lang === "fa" ? "ساعت خاموش است" : "Clock inactive")}
              </span>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                {t.self.timeFormat}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "14:45", fmt: "HH:mm" },
                  { label: "14:45 ⚡", fmt: "HH:mm ⚡" },
                  { label: "02:45 PM", fmt: "hh:mm A" },
                  { label: "14:45:30", fmt: "HH:mm:ss" },
                ].map((item) => (
                  <button
                    key={item.fmt}
                    type="button"
                    onClick={() => setTimeFormat(item.fmt)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                      timeFormat === item.fmt
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                {t.self.timeStyle}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Bold (𝟏𝟒:𝟒𝟓)", id: "bold" },
                  { label: "Mono (𝟷𝟺:𝟺𝟻)", id: "monospace" },
                  { label: "Italic (14:45)", id: "italic" },
                  { label: "Double (𝟙𝟜:𝟜𝟝)", id: "double" },
                  { label: "Sans (𝟣𝟦:𝟦𝟧)", id: "sans" },
                  { label: "Gothic (𝔊𝔬𝔱𝔥)", id: "gothic" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTimeStyle(item.id as any)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-mono transition-all truncate ${
                      timeStyle === item.id
                        ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {timeFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{timeFeedback}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSelfTime}
              disabled={savingTime}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{savingTime ? (lang === "fa" ? "درحال اعمال..." : "Applying...") : t.self.saveChanges}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. SUB-TAB: AUTO-REPLY */}
      {activeSubTab === "autoReply" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  {t.self.autoReplyTitle}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  {t.self.autoReplyDesc}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={autoReplyActive}
                onChange={(e) => setAutoReplyActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-slate-300">
              {t.self.delayLabel}
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={10}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="w-32 accent-emerald-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 w-8 text-center">
                {delaySeconds}s
              </span>
            </div>
          </div>

          {/* AI SMART SECRETARY (OPTIONAL) */}
          <div className="rounded-xl bg-gradient-to-b from-slate-950/90 to-slate-950/60 border border-violet-500/25 p-4 sm:p-5 space-y-4 shadow-inner">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-sm shadow-violet-500/10">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                      {lang === "fa" ? "منشی هوش مصنوعی (AI Smart Auto-Reply)" : "AI Smart Secretary"}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                      {lang === "fa" ? "اختیاری" : "Optional"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {lang === "fa"
                      ? "پاسخگویی زنده و هوشمند به پیام‌های پی‌وی با استفاده از مدل زبانی Gemini متناسب با متن دریافتی."
                      : "Generate dynamic, human-like contextual responses to incoming private messages via Gemini."}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>

            {aiEnabled && (
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                {/* API KEY INPUT */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-violet-400" />
                      <span>{lang === "fa" ? "کلید اختصاصی هوش مصنوعی (Gemini API Key):" : "Gemini API Key:"}</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Google AI Studio</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder={
                          lang === "fa"
                            ? "کلید API خود را وارد کنید (اختیاری)..."
                            : "Enter your Gemini API key (optional)..."
                        }
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-violet-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        title={showApiKey ? "مخفی کردن" : "نمایش کلید"}
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestAiKey}
                      disabled={testingAiKey}
                      className="px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {testingAiKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{lang === "fa" ? "تست..." : "Testing..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                          <span>{lang === "fa" ? "تست اتصال" : "Test Key"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal">
                    {lang === "fa"
                      ? "نکته: در صورت خالی گذاشتن، اگر کلید سیستمی در سرور ست شده باشد از آن استفاده خواهد شد."
                      : "Note: If left blank, the server's default GEMINI_API_KEY will be used if configured."}
                  </p>
                </div>

                {/* TEST RESULT FEEDBACK */}
                {aiTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      aiTestResult.success
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {aiTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                      <span>{aiTestResult.message}</span>
                    </div>
                    {aiTestResult.sampleReply && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg">
                        <span className="text-emerald-400 font-semibold block mb-1">
                          {lang === "fa" ? "نمونه پاسخ تولید شده:" : "Sample Generated Response:"}
                        </span>
                        <p className="italic font-sans leading-relaxed">«{aiTestResult.sampleReply}»</p>
                      </div>
                    )}
                  </div>
                )}

                {/* CUSTOM PROMPT & PERSONA */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                      {lang === "fa" ? "دستورالعمل و لحن منشی هوش مصنوعی (پرامپت اختیاری):" : "Custom Secretary Prompt & Tone:"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {lang === "fa" ? "پیش‌فرض خودکار فعال است" : "Default prompt active"}
                    </span>
                  </label>

                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={
                      lang === "fa"
                        ? "مثال: شما یک منشی بسیار رسمی و باادب هستید. به پیام‌ها کوتاه، به فارسی سلیس و محترمانه پاسخ دهید و بگویید در اولین فرصت پاسخ خواهم داد..."
                        : "Example: You are a friendly, concise assistant. Acknowledge the message and politely let them know I will reply soon..."
                    }
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 leading-relaxed resize-y"
                  />

                  {/* PRESET PROMPTS */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">
                      {lang === "fa" ? "الگوهای آماده لحن:" : "Quick tone presets:"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAiPrompt(
                          "شما منشی رسمی و کاری من هستید. بسیار محترمانه و به فارسی اداری به پیام‌ها پاسخ دهید و اعلام کنید پیام جهت بررسی ثبت گردید و به زودی پاسخ داده می‌شود."
                        )
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] transition-colors"
                    >
                      {lang === "fa" ? "👔 رسمی و اداری" : "Official"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiPrompt(
                          "شما دستیار صمیمی و دوستانه من هستید. خیلی گرم، کوتاه و خودمانی سلام کن و بگو فعلاً آنلاین نیستم ولی پیامتو دیدم و زود میام جوابتو میدم!"
                        )
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] transition-colors"
                    >
                      {lang === "fa" ? "☕ دوستانه و صمیمی" : "Casual & Warm"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiPrompt(
                          "شما کارشناس پشتیبانی و فروش هستید. با احترام فراوان سلام کنید، اعلام کنید پیام به بخش پشتیبانی ارجاع داده شده و کارشناسان در اسرع وقت پاسخ خواهند داد."
                        )
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] transition-colors"
                    >
                      {lang === "fa" ? "💼 پشتیبانی و فروش" : "Support"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAiPrompt(
                          "اعلام کنید صاحب اکانت در مرخصی و سفر کاری است و تا پایان هفته دسترسی محدودی به تلگرام دارد. در صورت فوریت پیام خود را ارسال نمایند."
                        )
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] transition-colors"
                    >
                      {lang === "fa" ? "✈️ در سفر و مرخصی" : "Away / Vacation"}
                    </button>
                    {aiPrompt && (
                      <button
                        type="button"
                        onClick={() => setAiPrompt("")}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] transition-colors"
                      >
                        {lang === "fa" ? "پاک کردن پرامپت" : "Clear"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                    {lang === "fa" ? "موتور پردازش: Gemini 3.8 Flash (سریع و بهینه)" : "Engine: Gemini 3.8 Flash"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {lang === "fa" ? "تضمین پاسخ با پیام‌های قالب در صورت قطعی" : "Auto fallback to templates"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              {lang === "fa" ? "لیست پیام‌های منشی:" : "Auto-Reply Messages List:"}
            </label>
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl">
                {lang === "fa" ? "هیچ پیامی ذخیره نشده است." : "No messages added yet."}
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <span className="flex-1 leading-relaxed">{msg}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTemplate(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newMsgText}
                onChange={(e) => setNewMsgText(e.target.value)}
                placeholder={lang === "fa" ? "متن جدید پیام خودکار..." : "New reply text..."}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddTemplate}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.self.addTemplate}</span>
              </button>
            </div>
          </div>

          {replyFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{replyFeedback}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAutoReply}
              disabled={savingReply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{savingReply ? (lang === "fa" ? "درحال ذخیره..." : "Saving...") : t.self.saveChanges}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SUB-TAB: MANDATORY JOIN */}
      {activeSubTab === "mandatoryJoin" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  {t.self.mandatoryJoinTitle}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  {t.self.mandatoryJoinDesc}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={mandatoryActive}
                onChange={(e) => setMandatoryActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              {lang === "fa" ? "کانال‌های الزامی جهت عضویت:" : "Required Channels List:"}
            </label>

            {channels.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl">
                {lang === "fa" ? "هیچ کانالی اضافه نشده است." : "No channels configured."}
              </p>
            ) : (
              channels.map((ch, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{ch.name}</span>
                    <span className="text-amber-400 font-mono" dir="ltr">@{ch.ref}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <input
                type="text"
                value={newChName}
                onChange={(e) => setNewChName(e.target.value)}
                placeholder={t.self.channelName}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChRef}
                  onChange={(e) => setNewChRef(e.target.value)}
                  placeholder={t.self.channelRef}
                  dir="ltr"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddChannel}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1 border border-slate-700 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.self.addChannel}</span>
                </button>
              </div>
            </div>
          </div>

          {mandatoryFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{mandatoryFeedback}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveMandatoryJoin}
              disabled={savingMandatory}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{savingMandatory ? (lang === "fa" ? "درحال ذخیره..." : "Saving...") : t.self.saveChanges}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB: SMART CHAT TOOLS */}
      {activeSubTab === "tools" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {t.self.toolsTitle}
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                {t.self.toolsDesc}
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {lang === "fa" ? "ماشین‌حساب هوشمند چت" : "Smart Calculator"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {lang === "fa" ? "پاسخ به =expr یا حساب" : "Answers =expr or calc"}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={calcActive}
                  onChange={(e) => setCalcActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {lang === "fa" ? "استعلام قیمت ارز و طلا" : "Market & Currency Quotes"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {lang === "fa" ? "پاسخ به دلار، طلا، btc، eth..." : "Answers usd, gold, btc, eth..."}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={marketActive}
                  onChange={(e) => setMarketActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>

          {/* Interactive Calculator Sandbox */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              <span>{lang === "fa" ? "آزمایش ماشین‌حساب:" : "Test Calculator Expression:"}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testCalcExpr}
                onChange={(e) => setTestCalcExpr(e.target.value)}
                placeholder={t.self.calcTestPlaceholder}
                dir="ltr"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleTestCalc}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex-shrink-0"
              >
                {lang === "fa" ? "محاسبه" : "Compute"}
              </button>
            </div>
            {calcTestResult !== null && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-mono" dir="ltr">
                🧮 Result: {testCalcExpr} = {calcTestResult}
              </div>
            )}
          </div>

          {/* Interactive Market Rates Sandbox */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>{lang === "fa" ? "آزمایش استعلام نرخ زنده:" : "Test Live Market Quote:"}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={testAssetQuery}
                  onChange={(e) => setTestAssetQuery(e.target.value)}
                  placeholder="usd, gold, bitcoin, eth, trx..."
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  placeholder="Amount"
                  dir="ltr"
                  className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs font-mono text-slate-100 text-center"
                />
                <button
                  type="button"
                  onClick={handleFetchTestQuote}
                  disabled={fetchingQuote}
                  className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {fetchingQuote ? "..." : (lang === "fa" ? "استعلام" : "Fetch")}
                </button>
              </div>
            </div>

            {marketQuoteResult && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 font-mono space-y-1">
                <div className="font-bold text-emerald-300">
                  💹 {marketQuoteResult.amount} {marketQuoteResult.asset}
                </div>
                <div>USD: ${marketQuoteResult.total_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                <div>تومان: {marketQuoteResult.total_toman.toLocaleString("fa-IR")} تومان</div>
                <div>ریال: {marketQuoteResult.total_irr.toLocaleString("fa-IR")} IRR</div>
              </div>
            )}
          </div>

          {toolsFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/40 text-blue-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{toolsFeedback}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveChatTools}
              disabled={savingTools}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{savingTools ? (lang === "fa" ? "درحال ذخیره..." : "Saving...") : t.self.saveChanges}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB: PM BROADCASTER */}
      {activeSubTab === "pmBroadcast" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  {t.self.pmBroadcastTitle}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  {t.self.pmBroadcastDesc}
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span>{recipientCount} {lang === "fa" ? "مخاطب PV" : "Contacts"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              {t.self.pmMessageLabel}
            </label>
            <textarea
              rows={4}
              value={pmMessage}
              onChange={(e) => setPmMessage(e.target.value)}
              placeholder={lang === "fa" ? "متن پیام همگانی خود را اینجا تایپ کنید..." : "Type broadcast message here..."}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t.self.pmIntervalLabel}
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={pmInterval}
                onChange={(e) => setPmInterval(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t.self.pmMaxRecipients}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={pmMaxRecipients}
                onChange={(e) => setPmMaxRecipients(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          {pmFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{pmFeedback}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleSavePmBroadcastSettings}
              disabled={pmLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{lang === "fa" ? "ذخیره متن و تنظیمات" : "Save Settings"}</span>
            </button>

            <div className="flex items-center gap-2">
              {pmStatus === "broadcasting" ? (
                <button
                  onClick={handleStopPmBroadcast}
                  disabled={pmLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>{t.self.pmStopBtn}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartPmBroadcast}
                  disabled={pmLoading || !pmMessage.trim() || recipientCount === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-md shadow-rose-500/30 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.self.pmStartBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB: FONT STYLER & SCOPES */}
      {activeSubTab === "fonts" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  {t.self.fontTitle}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  {t.self.fontDesc}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={fontActive}
                onChange={(e) => setFontActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              {lang === "fa" ? "انتخاب استایل فونت:" : "Select Font Style:"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "bold", label: "Bold (𝐁𝐨𝐥𝐝)" },
                { id: "italic", label: "Italic (𝐼𝑡𝑎𝑙𝑖𝑐)" },
                { id: "bold_italic", label: "Bold-Italic (𝑩𝒐𝒍𝒅)" },
                { id: "monospace", label: "Mono (𝙼𝚘𝚗𝚘)" },
                { id: "double", label: "Double (𝔻𝕠𝕦𝕓𝕝𝕖)" },
                { id: "sans", label: "Sans (𝖲𝖺𝗇𝗌)" },
                { id: "gothic", label: "Gothic (𝔊𝔬𝔱𝔥𝔦𝔠)" },
                { id: "normal", label: "Normal (ساده)" },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setFontStyle(style.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono transition-all border ${
                    fontStyle === style.id
                      ? "bg-purple-500/20 border-purple-500 text-purple-300 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Checkboxes */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-200">
              {t.self.scopesTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { id: "self_time", label: t.self.scopeSelfTime },
                { id: "manual_messages", label: t.self.scopeManual },
                { id: "auto_reply", label: t.self.scopeAutoReply },
                { id: "mandatory_join", label: t.self.scopeMandatoryJoin },
                { id: "tabchi", label: t.self.scopeTabchi },
              ].map((sc) => (
                <label
                  key={sc.id}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(fontScopes as any)[sc.id]}
                    onChange={(e) =>
                      setFontScopes({ ...fontScopes, [sc.id]: e.target.checked })
                    }
                    className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <span>{sc.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sandbox preview */}
          <div className="space-y-2">
            <input
              type="text"
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              placeholder={t.self.testInput}
              dir="ltr"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500"
            />
            <div className="p-3.5 bg-slate-950 border border-purple-500/30 rounded-xl flex items-center justify-between gap-2">
              <span className="font-mono text-sm text-purple-200 break-all select-all" dir="ltr">
                {transformFont(sandboxText, fontStyle)}
              </span>
              <button
                onClick={handleCopySandbox}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold flex-shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === "fa" ? "کپی شد" : "Copied") : (lang === "fa" ? "کپی" : "Copy")}</span>
              </button>
            </div>
          </div>

          {fontFeedback && (
            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40 text-purple-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{fontFeedback}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveFontScopes}
              disabled={savingFont}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{savingFont ? (lang === "fa" ? "درحال ذخیره..." : "Saving...") : t.self.saveChanges}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
