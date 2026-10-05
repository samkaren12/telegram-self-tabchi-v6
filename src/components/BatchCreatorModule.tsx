import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  Sparkles,
  Play,
  Square,
  RefreshCw,
  Globe,
  Radio,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ListPlus,
  Sliders,
  ShieldAlert,
  Hash,
  Download,
  Terminal,
  FolderPlus,
  Compass,
  Megaphone,
  Send,
  Activity,
  Percent,
  Clock,
  Search,
  Key,
  Flame,
  CheckCheck,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import {
  TelegramAccount,
  BatchTargetType,
  BatchNamingLanguage,
  BatchThemeTopic,
  BatchCreationTask,
  BatchCreatedItem,
  BatchBroadcastTask,
} from "../types";

interface BatchCreatorModuleProps {
  account: TelegramAccount | null;
  lang: Language;
}

export const BatchCreatorModule: React.FC<BatchCreatorModuleProps> = ({
  account,
  lang,
}) => {
  const t = translations[lang];

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<"creator" | "broadcast" | "sessions">("creator");

  // Configuration form state for Batch Creation
  const [targetType, setTargetType] = useState<BatchTargetType>("channel");
  const [count, setCount] = useState<number>(10);
  const [namingLanguage, setNamingLanguage] = useState<BatchNamingLanguage>("fa");
  const [topic, setTopic] = useState<BatchThemeTopic>("crypto");
  const [delaySeconds, setDelaySeconds] = useState<number>(4);
  const [customPrefix, setCustomPrefix] = useState<string>("");
  const [customSuffix, setCustomSuffix] = useState<string>("");
  const [customAbout, setCustomAbout] = useState<string>("");
  const [customNamesText, setCustomNamesText] = useState<string>("");
  const [useCustomNamesList, setUseCustomNamesList] = useState<boolean>(false);
  const [autoBroadcastWelcome, setAutoBroadcastWelcome] = useState<boolean>(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    "🌟 به کانال رسمی ما خوش آمدید!\nآخرین اخبار، سیگنال‌ها و تحلیل‌های روز را در اینجا دنبال نمایید."
  );

  // Configuration form state for Group/Channel Broadcast
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    "📣 پیام همگانی ویژه به تمامی اعضای کانال‌ها و گروه‌ها!\nلطفاً پست‌های سنجاق‌شده را بررسی نمایید."
  );
  const [broadcastDelay, setBroadcastDelay] = useState<number>(4);

  // Task & Status state
  const [task, setTask] = useState<BatchCreationTask | null>(null);
  const [broadcastTask, setBroadcastTask] = useState<BatchBroadcastTask | null>(null);
  const [trackedSessionId, setTrackedSessionId] = useState<string>("");
  const [manualSessionInput, setManualSessionInput] = useState<string>("");
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Poll current account tasks & tracked session status
  const fetchTaskStatus = async () => {
    // 1. If tracking specific Session ID via API endpoint
    if (trackedSessionId) {
      try {
        const res = await fetch(`/api/batch-tasks/sessions/${encodeURIComponent(trackedSessionId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.task) {
            if (json.type === "creation") {
              setTask(json.task);
              if (json.task.broadcastTask) {
                setBroadcastTask(json.task.broadcastTask);
              }
            } else if (json.type === "broadcast") {
              setBroadcastTask(json.task);
            }
            return;
          }
        }
      } catch (_) {}
    }

    // 2. Fallback to active account's current tasks
    if (!account?.phone) return;

    try {
      // Creation task
      const resCreate = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/batch-create`);
      if (resCreate.ok) {
        const json = await resCreate.json();
        if (json.success && json.task) {
          setTask(json.task);
          if (json.task.sessionId && !trackedSessionId) {
            setTrackedSessionId(json.task.sessionId);
          }
          if (json.task.broadcastTask) {
            setBroadcastTask(json.task.broadcastTask);
          }
        }
      }

      // Broadcast task
      const resBroadcast = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/batch-broadcast`);
      if (resBroadcast.ok) {
        const json = await resBroadcast.json();
        if (json.success && json.task) {
          setBroadcastTask(json.task);
        }
      }
    } catch (_) {}
  };

  // Fetch recent session IDs list
  const fetchRecentSessions = async () => {
    setLoadingSessions(true);
    try {
      const url = account?.phone
        ? `/api/batch-tasks/sessions?phone=${encodeURIComponent(account.phone)}`
        : `/api/batch-tasks/sessions`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.sessions)) {
          setRecentSessions(json.sessions);
        }
      }
    } catch (_) {
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchTaskStatus();
    fetchRecentSessions();

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchTaskStatus, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [account?.phone, trackedSessionId]);

  // Track session by manual ID
  const handleTrackCustomSession = async (sIdToTrack?: string) => {
    const sId = (sIdToTrack || manualSessionInput).trim();
    if (!sId) {
      showToast("error", "لطفاً شناسه نشست (Session ID) را وارد نمایید.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/batch-tasks/sessions/${encodeURIComponent(sId)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "نشستی با این شناسه یافت نشد.");
      }

      setTrackedSessionId(sId);
      if (json.type === "creation") {
        setTask(json.task);
        setActiveTab("creator");
      } else if (json.type === "broadcast") {
        setBroadcastTask(json.task);
        setActiveTab("broadcast");
      }
      showToast("success", `نشست ${sId} با موفقیت بارگذاری شد.`);
    } catch (err: any) {
      showToast("error", err.message || "خطا در بازیابی نشست.");
    } finally {
      setActionLoading(false);
    }
  };

  // Start Batch Creation
  const handleStartCreation = async () => {
    if (!account?.phone) {
      showToast("error", "لطفاً ابتدا یک اکانت تلگرام را انتخاب کنید.");
      return;
    }

    if (count < 1 || count > 100) {
      showToast("error", "تعداد کانال یا گروه باید بین ۱ الی ۱۰۰ باشد.");
      return;
    }

    setActionLoading(true);
    try {
      const customNamesList =
        useCustomNamesList && customNamesText.trim()
          ? customNamesText
              .split("\n")
              .map((n) => n.trim())
              .filter(Boolean)
          : undefined;

      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/batch-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          count,
          language: namingLanguage,
          topic,
          delaySeconds,
          customPrefix: customPrefix.trim() || undefined,
          customSuffix: customSuffix.trim() || undefined,
          customAbout: customAbout.trim() || undefined,
          customNamesList,
          autoBroadcastWelcome,
          welcomeMessage: autoBroadcastWelcome ? welcomeMessage : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "خطا در شروع عملیات ساخت.");
      }

      setTask(json.task);
      if (json.sessionId) {
        setTrackedSessionId(json.sessionId);
      }
      fetchRecentSessions();
      showToast("success", `عملیات ساخت آغاز شد! شناسه نشست: ${json.sessionId}`);
    } catch (err: any) {
      showToast("error", err.message || "خطای ناشناخته در شروع ساخت.");
    } finally {
      setActionLoading(false);
    }
  };

  // Stop Batch Creation
  const handleStopCreation = async () => {
    if (!account?.phone) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/batch-create/stop`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.task) {
        setTask(json.task);
      }
      fetchRecentSessions();
      showToast("success", "فرآیند ساخت متوقف گردید.");
    } catch (err: any) {
      showToast("error", err.message || "خطا در متوقف‌سازی فرآیند.");
    } finally {
      setActionLoading(false);
    }
  };

  // Start Batch Broadcast
  const handleStartBroadcast = async () => {
    if (!account?.phone) {
      showToast("error", "ابتدا یک اکانت تلگرام را انتخاب فرمایید.");
      return;
    }
    if (!broadcastMessage.trim()) {
      showToast("error", "متن پیام برودکست نمی‌تواند خالی باشد.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/batch-broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: broadcastMessage,
          delaySeconds: broadcastDelay,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "خطا در شروع برودکست.");
      }

      setBroadcastTask(json.task);
      if (json.sessionId) {
        setTrackedSessionId(json.sessionId);
      }
      fetchRecentSessions();
      showToast("success", `برودکست به کانال‌ها و گروه‌ها آغاز شد! شناسه نشست: ${json.sessionId}`);
    } catch (err: any) {
      showToast("error", err.message || "خطا در ارسال پیام همگانی.");
    } finally {
      setActionLoading(false);
    }
  };

  // Stop Batch Broadcast
  const handleStopBroadcast = async () => {
    if (!account?.phone) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/batch-broadcast/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: broadcastTask?.sessionId }),
      });
      const json = await res.json();
      if (json.task) {
        setBroadcastTask(json.task);
      }
      fetchRecentSessions();
      showToast("success", "فرآیند برودکست متوقف گردید.");
    } catch (err: any) {
      showToast("error", err.message || "خطا در توقف برودکست.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportLinks = () => {
    if (!task || !task.items || task.items.length === 0) return;
    const lines = task.items
      .filter((i) => i.status === "success")
      .map((i, idx) => `${idx + 1}. ${i.title} -> ${i.inviteLink || `@${i.username}` || "لینک خصوصی"}`)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `created_channels_groups_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "فایل TXT لینک‌ها با موفقیت دانلود شد.");
  };

  const isCreationRunning = task?.status === "running";
  const isBroadcastRunning = broadcastTask?.status === "running";

  // Real-time calculated progress percentages
  const creationPercent = task
    ? task.progressPercent !== undefined
      ? task.progressPercent
      : Math.min(100, Math.round((task.completedCount / Math.max(1, task.count)) * 100))
    : 0;

  const broadcastPercent = broadcastTask
    ? broadcastTask.progressPercent !== undefined
      ? broadcastTask.progressPercent
      : Math.min(100, Math.round((broadcastTask.sentCount / Math.max(1, broadcastTask.targetCount)) * 100))
    : 0;

  return (
    <div className="space-y-6">
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

      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Layers className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  سیستم گروه‌ساز، کانال‌ساز و برودکست انبوه
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  v6.4 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                ایجاد خودکار ده‌ها کانال و سوپرگروه با موضوعات سفارشی، ارسال پیام همگانی (Broadcast)، و مانیتورینگ زنده نوار پیشرفت با رهگیری شناسه نشست (Session ID).
              </p>
            </div>
          </div>

          {/* Active Account Info */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-inner">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">اکانت فعال انتخابی:</div>
              <div className="text-xs font-mono font-bold text-cyan-400" dir="ltr">
                {account ? account.phone : "هیچ اکانتی انتخاب نشده"}
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${account ? "bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" : "bg-rose-500"}`}></div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab("creator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "creator"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>ساخت گروه و کانال انبوه</span>
            {isCreationRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "broadcast"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>ارسال همگانی به کانال‌ها و گروه‌ها (Broadcast)</span>
            {isBroadcastRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("sessions");
              fetchRecentSessions();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "sessions"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>رهگیری نشست‌ها (Session Tracker)</span>
            {trackedSessionId && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                فعال
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Global Live Session Banner (Always visible if a session is tracked) */}
      {trackedSessionId && (
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span>شناسه نشست فعال در حال پیگیری:</span>
                <span className="font-mono text-cyan-300 font-bold" dir="ltr">
                  {trackedSessionId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(trackedSessionId, "active-session")}
                  className="p-1 hover:text-white text-slate-400 transition-colors"
                  title="کپی شناسه نشست"
                >
                  {copiedId === "active-session" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                وضعیت زنده از طریق اندپوینت <code>/api/batch-tasks/sessions/:sessionId</code> همگام‌سازی می‌شود.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTaskStatus}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>همگام‌سازی دستی</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTrackedSessionId("");
                showToast("success", "رهگیری نشست به حالت پیش‌فرض بازگشت.");
              }}
              className="px-2.5 py-1.5 bg-slate-900/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-medium border border-slate-800 hover:border-rose-800/50 transition-all"
            >
              خروج از رهگیری
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: BATCH CREATOR */}
      {activeTab === "creator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Creation Configuration (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-5">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>تنظیمات ساخت گروه و کانال انبوه</span>
              </h3>

              {/* 1. Target Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">نوع هدف ساخت:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "channel", label: "کانال برودکست (Channel)", icon: Radio },
                    { id: "supergroup", label: "سوپرگروه (Supergroup)", icon: Layers },
                    { id: "group", label: "گروه عادی (Group)", icon: ListPlus },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isCreationRunning}
                      onClick={() => setTargetType(item.id as BatchTargetType)}
                      className={`px-3 py-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        targetType === item.id
                          ? "bg-cyan-500/20 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50"
                      } ${isCreationRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Count & Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>تعداد ساخت (Count):</span>
                  <span className="font-mono text-cyan-400">{count} مورد</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    disabled={isCreationRunning}
                    value={count}
                    onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500 transition-all"
                  />
                  <div className="flex gap-1">
                    {[5, 10, 20, 50].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={isCreationRunning}
                        onClick={() => setCount(preset)}
                        className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 transition-all"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Anti-Spam Delay */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>تاخیر بین ساخت (ضد اسپم تلگرام):</span>
                  <span className="font-mono text-cyan-400">{delaySeconds} ثانیه</span>
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  disabled={isCreationRunning}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              {/* 4. Language & Theme Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">زبان عناوین:</label>
                  <select
                    disabled={isCreationRunning}
                    value={namingLanguage}
                    onChange={(e) => setNamingLanguage(e.target.value as BatchNamingLanguage)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="fa">🇮🇷 فارسی (Persian)</option>
                    <option value="en">🇺🇸 انگلیسی (English)</option>
                    <option value="ar">🇸🇦 عربی (Arabic)</option>
                    <option value="ru">🇷🇺 روسی (Russian)</option>
                    <option value="mixed">🌐 ترکیب همه زبان‌ها (Mixed)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">تم و موضوع محتوا:</label>
                  <select
                    disabled={isCreationRunning}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as BatchThemeTopic)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="crypto">💎 ارز دیجیتال، بیت‌کوین و سیگنال</option>
                    <option value="tech">💻 تکنولوژی، برنامه‌نویسی و وب</option>
                    <option value="business">📈 کسب‌وکار، بیزینس و بازاریابی</option>
                    <option value="gaming">🎮 گیمینگ، بازی‌ها و سرگرمی</option>
                    <option value="vip">👑 کانال‌های VIP و اختصاصی</option>
                    <option value="general">🌍 عمومی و اطلاع‌رسانی</option>
                  </select>
                </div>
              </div>

              {/* 5. Custom Prefix & Suffix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">پیشوند نام (اختیاری):</label>
                  <input
                    type="text"
                    disabled={isCreationRunning}
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder="مثال: کانال رسمی"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">پسوند نام (اختیاری):</label>
                  <input
                    type="text"
                    disabled={isCreationRunning}
                    value={customSuffix}
                    onChange={(e) => setCustomSuffix(e.target.value)}
                    placeholder="مثال: | VIP"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* 6. Custom About / Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">توضیحات بیوگرافی (About):</label>
                <textarea
                  rows={2}
                  disabled={isCreationRunning}
                  value={customAbout}
                  onChange={(e) => setCustomAbout(e.target.value)}
                  placeholder="توضیحات سفارشی یا خالی بگذارید تا به صورت هوشمند تولید شود..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 transition-all resize-none"
                />
              </div>

              {/* 7. Auto-Broadcast Welcome Message Option */}
              <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={autoBroadcastWelcome}
                    disabled={isCreationRunning}
                    onChange={(e) => setAutoBroadcastWelcome(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-950 border-slate-700"
                  />
                  <span>ارسال خودکار پست خوش‌آمدگویی بلافاصله پس از ایجاد هر مورد</span>
                </label>

                {autoBroadcastWelcome && (
                  <div className="pt-2">
                    <textarea
                      rows={2}
                      disabled={isCreationRunning}
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="متن پست اول کانال یا پیام آغازین گروه..."
                      className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 text-xs text-cyan-200 outline-none focus:border-cyan-400 transition-all resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                {isCreationRunning ? (
                  <button
                    type="button"
                    onClick={handleStopCreation}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>توقف فرآیند ساخت</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCreation}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                  >
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>شروع ساخت خودکار ({count} مورد)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Live Progress Bar & Results (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* LIVE PROGRESS CARD WITH ENHANCED PERCENTAGE BAR */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">نوار پیشرفت زنده ساخت (Live Progress):</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
                  <Percent className="w-3.5 h-3.5" />
                  <span className="text-sm text-emerald-400">{creationPercent}%</span>
                </div>
              </div>

              {/* Visual Progress Bar with Glow and Animation */}
              <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-800 p-0.5 relative shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 relative ${
                    isCreationRunning
                      ? "bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 shadow-lg shadow-cyan-500/50"
                      : creationPercent === 100
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/30"
                      : "bg-slate-700"
                  }`}
                  style={{ width: `${creationPercent}%` }}
                >
                  {isCreationRunning && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Progress Counters & Status Badges */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">تکمیل شده</div>
                  <div className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                    {task ? task.completedCount : 0} / {task ? task.count : count}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">ناموفق / لیمیت</div>
                  <div className="font-mono text-xs font-bold text-rose-400 mt-0.5">
                    {task?.failedCount || 0} مورد
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">وضعیت فرآیند</div>
                  <div className="font-mono text-[11px] font-bold text-cyan-300 mt-0.5 truncate">
                    {task?.status === "running"
                      ? "🟢 در حال ساخت"
                      : task?.status === "completed"
                      ? "✅ پایان یافته"
                      : task?.status === "stopped"
                      ? "⏹️ متوقف"
                      : "آماده"}
                  </div>
                </div>
              </div>

              {/* Live Ticker message */}
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-bounce" />
                <span className="truncate">
                  {task?.currentAction || "آماده برای آغاز عملیات ساخت خودکار کانال و گروه."}
                </span>
              </div>

              {/* Session ID display */}
              {task?.sessionId && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>شناسه نشست (Session):</span>
                    <code className="text-cyan-400 font-mono text-[10px]">{task.sessionId}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(task.sessionId, "task-sess")}
                    className="text-slate-400 hover:text-white p-1"
                    title="کپی شناسه نشست"
                  >
                    {copiedId === "task-sess" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Created Items List */}
            <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>کانال‌ها و گروه‌های ایجاد شده</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400">
                    {task?.items?.length || 0}
                  </span>
                </h4>
                {task?.items && task.items.length > 0 && (
                  <button
                    onClick={handleExportLinks}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>خروجی TXT</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                {!task || !task.items || task.items.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                    <Compass className="w-8 h-8 mx-auto text-slate-600" />
                    <p>هنوز موردی ایجاد نشده است. با زدن «شروع ساخت خودکار» لیست موارد اینجا افزوده خواهد شد.</p>
                  </div>
                ) : (
                  task.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`glass-card rounded-2xl p-3.5 text-xs transition-all ${
                        item.status === "failed" ? "border-rose-500/30 bg-rose-950/10" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-cyan-400 font-bold">
                              #{task.items.length - idx}
                            </span>
                            <h5 className="font-bold text-white truncate max-w-[190px]" title={item.title}>
                              {item.title}
                            </h5>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 font-medium">
                              {item.type === "channel" ? "کانال" : "گروه"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5" title={item.about}>
                            {item.about}
                          </p>
                        </div>

                        {item.status === "success" ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {item.inviteLink && (
                              <a
                                href={item.inviteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
                                title="باز کردن در تلگرام"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleCopyText(item.inviteLink || `@${item.username}` || item.title, item.id)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="کپی لینک"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-mono flex-shrink-0">خطا</span>
                        )}
                      </div>

                      {item.inviteLink && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                          <span className="truncate max-w-[200px]" dir="ltr">{item.inviteLink}</span>
                          <span className="text-slate-500">
                            {new Date(item.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROUP & CHANNEL BROADCAST */}
      {activeTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Broadcast Setup (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-5">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Megaphone className="w-4 h-4 text-cyan-400" />
                <span>تنظیمات ارسال همگانی به کانال‌ها و گروه‌ها (Broadcast Task)</span>
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">متن پیام یا پست برای ارسال همگانی:</label>
                <textarea
                  rows={5}
                  disabled={isBroadcastRunning}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="متن کامل پیام تبلیغاتی، اطلاع‌رسانی یا پست خوش‌آمدگویی..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs text-white outline-none focus:border-cyan-500 transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>تاخیر بین هر ارسال (ثانیه):</span>
                  <span className="font-mono text-cyan-400">{broadcastDelay} ثانیه</span>
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  disabled={isBroadcastRunning}
                  value={broadcastDelay}
                  onChange={(e) => setBroadcastDelay(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>مقصد‌های هدف ارسال پیام:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  سیستم ابتدا کانال‌ها و گروه‌های جدید ساخته‌شده در بخش <strong>گروه‌ساز انبوه</strong> را هدف قرار می‌دهد و در صورت موجود نبودن، به کانال‌ها و سوپرگروه‌های چت اکانت ارسال می‌نماید.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                {isBroadcastRunning ? (
                  <button
                    type="button"
                    onClick={handleStopBroadcast}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>توقف عملیات برودکست</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartBroadcast}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                  >
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>آغاز ارسال همگانی (Start Broadcast)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Broadcast Live Progress Bar & Logs (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* LIVE BROADCAST PROGRESS BAR */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">پیشرفت درصد برودکست (Broadcast Progress):</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
                  <Percent className="w-3.5 h-3.5" />
                  <span className="text-sm text-emerald-400">{broadcastPercent}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden border border-slate-800 p-0.5 relative shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 relative ${
                    isBroadcastRunning
                      ? "bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 shadow-lg shadow-cyan-500/50"
                      : broadcastPercent === 100
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/30"
                      : "bg-slate-700"
                  }`}
                  style={{ width: `${broadcastPercent}%` }}
                >
                  {isBroadcastRunning && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">ارسال موفق</div>
                  <div className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                    {broadcastTask ? broadcastTask.sentCount : 0} / {broadcastTask ? broadcastTask.targetCount : 0}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">ناموفق / خطا</div>
                  <div className="font-mono text-xs font-bold text-rose-400 mt-0.5">
                    {broadcastTask?.failedCount || 0}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">وضعیت ارسال</div>
                  <div className="font-mono text-[11px] font-bold text-cyan-300 mt-0.5 truncate">
                    {broadcastTask?.status === "running"
                      ? "🚀 در حال ارسال"
                      : broadcastTask?.status === "completed"
                      ? "✅ پایان یافت"
                      : broadcastTask?.status === "stopped"
                      ? "⏹️ متوقف"
                      : "آماده"}
                  </div>
                </div>
              </div>

              {broadcastTask?.sessionId && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>شناسه نشست برودکست:</span>
                    <code className="text-cyan-400 font-mono text-[10px]">{broadcastTask.sessionId}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(broadcastTask.sessionId, "bcast-sess")}
                    className="text-slate-400 hover:text-white p-1"
                    title="کپی شناسه نشست"
                  >
                    {copiedId === "bcast-sess" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Broadcast Logs */}
            <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
              <h4 className="font-bold text-xs text-white flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>لاگ زنده ارسال به مقصدها</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {broadcastTask?.logs?.length || 0} رکورد
                </span>
              </h4>

              <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1 text-xs">
                {!broadcastTask || !broadcastTask.logs || broadcastTask.logs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    هنوز پیامی ارسال نشده است. با زدن دکمه شروع لاگ ارسال هر کانال اینجا ثبت می‌شود.
                  </div>
                ) : (
                  broadcastTask.logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                        log.status === "success"
                          ? "bg-slate-900/80 border-slate-800 text-slate-300"
                          : "bg-rose-950/20 border-rose-800/40 text-rose-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {log.status === "success" ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="font-medium text-white truncate max-w-[200px]">{log.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 flex-shrink-0">
                        {new Date(log.time).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SESSION TRACKER (API ENDPOINT TRACKING) */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          {/* Manual Session Search / Query Card */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4 border border-cyan-500/20">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>پیگیری مستقیم با شناسه نشست (Track Session by ID)</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              با استفاده از اندپوینت جدید <code>/api/batch-tasks/sessions/:sessionId</code> می‌توانید هر فرآیند ساخت یا برودکست در حال اجرا در پس‌زمینه را از هر دستگاهی رهگیری نمایید.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={manualSessionInput}
                onChange={(e) => setManualSessionInput(e.target.value)}
                placeholder="مثال: batch_sess_1728114920... یا bcast_sess_172811..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500 transition-all"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => handleTrackCustomSession()}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>رهگیری و بارگذاری نشست</span>
              </button>
            </div>
          </div>

          {/* Recent Sessions List from API */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>تاریخچه و نشست‌های فعال سرور</span>
              </h3>
              <button
                type="button"
                onClick={fetchRecentSessions}
                className="text-slate-400 hover:text-white p-1 text-xs flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? "animate-spin" : ""}`} />
                <span>بروزرسانی</span>
              </button>
            </div>

            <div className="space-y-3">
              {recentSessions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  هیچ نشستی در حافظه سرور یافت نشد. با شروع یک فرآیند ساخت یا برودکست، نشست به صورت خودکار ثبت خواهد شد.
                </div>
              ) : (
                recentSessions.map((sess) => (
                  <div
                    key={sess.sessionId}
                    className={`glass-card rounded-2xl p-4 transition-all hover:border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      trackedSessionId === sess.sessionId ? "border-cyan-500 ring-1 ring-cyan-500/30 bg-cyan-950/10" : ""
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sess.type === "creation"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {sess.type === "creation" ? "ساخت انبوه" : "برودکست همگانی"}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{sess.title}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span dir="ltr">{sess.sessionId}</span>
                        <span>•</span>
                        <span dir="ltr">{sess.phone}</span>
                        <span>•</span>
                        <span className="text-slate-500">
                          {sess.startedAt ? new Date(sess.startedAt).toLocaleTimeString("fa-IR") : "هم‌اکنون"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* Mini Progress */}
                      <div className="text-right w-28">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="text-slate-400">
                            {sess.completedCount}/{sess.totalCount}
                          </span>
                          <span className="font-bold text-cyan-400">{sess.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all"
                            style={{ width: `${sess.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTrackCustomSession(sess.sessionId)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-xs font-bold border border-slate-800 hover:border-cyan-400 transition-all"
                      >
                        رهگیری زنده
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
