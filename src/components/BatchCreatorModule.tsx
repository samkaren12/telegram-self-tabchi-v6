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
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import {
  TelegramAccount,
  BatchTargetType,
  BatchNamingLanguage,
  BatchThemeTopic,
  BatchCreationTask,
  BatchCreatedItem,
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

  // Configuration form state
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

  // Task & Status state
  const [task, setTask] = useState<BatchCreationTask | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Poll current task status for selected account
  const fetchTaskStatus = async () => {
    if (!account?.phone) return;
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/batch-create`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.task) {
          setTask(json.task);
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchTaskStatus();

    // Polling while running or if account changes
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchTaskStatus, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [account?.phone]);

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
      const customNamesList = useCustomNamesList && customNamesText.trim()
        ? customNamesText.split("\n").map((n) => n.trim()).filter(Boolean)
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
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "خطا در شروع عملیات ساخت.");
      }

      setTask(json.task);
      showToast("success", "عملیات ساخت خودکار با موفقیت آغاز شد!");
    } catch (err: any) {
      showToast("error", err.message || "خطای ناشناخته در شروع ساخت.");
    } finally {
      setActionLoading(false);
    }
  };

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
      showToast("success", "فرآیند ساخت متوقف گردید.");
    } catch (err: any) {
      showToast("error", err.message || "خطا در متوقف‌سازی فرآیند.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = (item: BatchCreatedItem) => {
    const textToCopy = item.inviteLink || item.username ? `@${item.username}` : item.title;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
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
  };

  const isRunning = task?.status === "running";
  const progressPercent = task && task.count > 0 ? Math.round((task.completedCount / task.count) * 100) : 0;

  if (!account) {
    return (
      <div className="glass-panel rounded-3xl p-10 text-center space-y-4">
        <FolderPlus className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-200">اکانتی انتخاب نشده است</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          برای ساخت خودکار کانال و گروه، لطفاً ابتدا یک اکانت آنلاین را از نوار بالای پنل انتخاب کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={lang === "fa" ? "rtl" : "ltr"}>
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/50 text-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-emerald-500 p-0.5 shadow-xl shadow-cyan-500/25 flex-shrink-0 group hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-cyan-400">
                <FolderPlus className="w-7 h-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  سازنده خودکار و انبوه کانال و گروه تلگرام
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-mono">
                  BATCH CREATOR
                </span>
                {isRunning && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    درحال ساخت...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                ایجاد خودکار هر تعداد کانال عمومی/خصوصی یا سوپرگروه با نام‌های جذاب و متناسب در زبان‌های فارسی، انگلیسی، عربی و روسی با مدیریت هوشمند تاخیر ضد فلود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-mono bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-slate-800 text-slate-300 shadow-inner flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${account.isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`}></span>
              <span>{account.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings & Live Creation Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Creation Configuration (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">تنظیمات ساخت گروه و کانال</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              MTProto Native API
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Target Type (Channel, Group, Supergroup) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">نوع مورد جهت ساخت:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "channel", label: "کانال (Channel)", icon: Radio },
                  { id: "supergroup", label: "سوپرگروه (Supergroup)", icon: Layers },
                  { id: "group", label: "گروه عادی (Group)", icon: ListPlus },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isRunning}
                    onClick={() => setTargetType(item.id as BatchTargetType)}
                    className={`px-3 py-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      targetType === item.id
                        ? "bg-cyan-500/20 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50"
                    } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Count (تعداد) */}
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
                  disabled={isRunning}
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500 transition-all"
                />
                <div className="flex gap-1">
                  {[5, 10, 20, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isRunning}
                      onClick={() => setCount(preset)}
                      className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Delay seconds */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>تاخیر بین ساخت (ضد اسپم):</span>
                <span className="font-mono text-cyan-400">{delaySeconds} ثانیه</span>
              </label>
              <input
                type="number"
                min="2"
                max="60"
                disabled={isRunning}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            {/* 4. Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">زبان عنوان‌ها و اسامی:</label>
              <select
                disabled={isRunning}
                value={namingLanguage}
                onChange={(e) => setNamingLanguage(e.target.value as BatchNamingLanguage)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium"
              >
                <option value="fa">🇮🇷 فارسی (Persian)</option>
                <option value="en">🇺🇸 انگلیسی (English)</option>
                <option value="ar">🇸🇦 عربی (Arabic)</option>
                <option value="ru">🇷🇺 روسی (Russian)</option>
                <option value="mixed">🌐 ترکیب تصادفی همه زبان‌ها (Mixed)</option>
              </select>
            </div>

            {/* 5. Theme / Topic Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">موضوع و تم محتوایی:</label>
              <select
                disabled={isRunning}
                value={topic}
                onChange={(e) => setTopic(e.target.value as BatchThemeTopic)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium"
              >
                <option value="crypto">💎 ارز دیجیتال، بیت‌کوین و سیگنال (Crypto)</option>
                <option value="tech">💻 تکنولوژی، برنامه‌نویسی و آی‌تی (Tech & IT)</option>
                <option value="business">📈 کسب‌و‌کار، تجارت و بازاریابی (Business)</option>
                <option value="gaming">🎮 گیمینگ، استریم و بازی‌ها (Gaming)</option>
                <option value="entertainment">🎭 سرگرمی، فان و چالش‌ها (Entertainment)</option>
                <option value="vip">👑 کانال و کلوب‌های اختصاصی VIP</option>
                <option value="general">🌍 عمومی، اطلاع‌رسانی و آزاد (General)</option>
              </select>
            </div>

            {/* 6. Prefix & Suffix Customization */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">پیشوند دلخواه نام (اختیاری):</label>
              <input
                type="text"
                disabled={isRunning}
                value={customPrefix}
                onChange={(e) => setCustomPrefix(e.target.value)}
                placeholder="مثال: کانال رسمی"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">پسوند دلخواه نام (اختیاری):</label>
              <input
                type="text"
                disabled={isRunning}
                value={customSuffix}
                onChange={(e) => setCustomSuffix(e.target.value)}
                placeholder="مثال: | VIP 2026"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            {/* 7. Custom About / Bio */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">بیوگرافی یا توضیحات (About) سفارشی:</label>
              <textarea
                rows={2}
                disabled={isRunning}
                value={customAbout}
                onChange={(e) => setCustomAbout(e.target.value)}
                placeholder="توضیحات پیش‌فرض یا اختصاصی برای قرارگیری در بایوی تمام موارد ایجاد شده..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 transition-all placeholder-slate-600"
              />
            </div>

            {/* 8. Toggle Manual Names List */}
            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  ورود دستی لیست نام‌ها (اختیاری - هر نام در یک خط)
                </span>
                <input
                  type="checkbox"
                  id="toggleCustomNames"
                  checked={useCustomNamesList}
                  disabled={isRunning}
                  onChange={(e) => setUseCustomNamesList(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </div>

              {useCustomNamesList && (
                <textarea
                  rows={4}
                  disabled={isRunning}
                  value={customNamesText}
                  onChange={(e) => setCustomNamesText(e.target.value)}
                  placeholder={`نام کانال اول\nنام کانال دوم\nSuper Signal VIP\nGroup Chat Tech`}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-500 transition-all placeholder-slate-600"
                />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>سیستم هوشمند مقابله با FloodWait تلگرام فعال است.</span>
            </div>

            <div className="flex items-center gap-2">
              {isRunning ? (
                <button
                  type="button"
                  onClick={handleStopCreation}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/40 transition-all active:scale-95"
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

        {/* Right Section: Live Creation Feed & Export (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progress Card */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span>پیشرفت ساخت:</span>
                <span className="font-mono text-cyan-400">
                  {task ? `${task.completedCount} از ${task.count}` : `۰ از ${count}`}
                </span>
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>وضعیت: {task?.status === "running" ? "🟢 در حال ارسال درخواست به تلگرام..." : task?.status === "completed" ? "✅ ساخت به اتمام رسید" : task?.status === "stopped" ? "⏹️ متوقف شده" : "آماده به کار"}</span>
              {task?.items && task.items.length > 0 && (
                <button
                  onClick={handleExportLinks}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>خروجی متنی TXT</span>
                </button>
              )}
            </div>
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
              <button
                onClick={fetchTaskStatus}
                className="text-slate-400 hover:text-white p-1"
                title="بروزرسانی لیست"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
              {!task || !task.items || task.items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <Compass className="w-8 h-8 mx-auto text-slate-600" />
                  <p>هنوز موردی ساخته نشده است. با زدن دکمه «شروع ساخت خودکار» لیست اینجا اضافه می‌شود.</p>
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
                          <h5 className="font-bold text-white truncate max-w-[200px]" title={item.title}>
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
                            onClick={() => handleCopyLink(item)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="کپی لینک دعوت"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-rose-400 font-mono flex-shrink-0">
                          خطا
                        </span>
                      )}
                    </div>

                    {item.inviteLink && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                        <span className="truncate max-w-[220px]" dir="ltr">{item.inviteLink}</span>
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
    </div>
  );
};
