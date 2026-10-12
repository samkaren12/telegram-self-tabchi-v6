import React, { useState, useEffect } from "react";
import {
  Server,
  Cpu,
  Layers,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Terminal,
  Copy,
  Check,
  Info,
  Clock,
  Sparkles,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { Language } from "../utils/i18n";

interface ServerCapacityData {
  success: boolean;
  specs: {
    os: {
      platform: string;
      type: string;
      release: string;
      arch: string;
      hostname: string;
    };
    cpu: {
      cores: number;
      model: string;
      speedMhz: number;
      loadAvg1m: number;
      loadAvg5m: number;
      loadAvg15m: number;
    };
    memory: {
      totalMb: number;
      freeMb: number;
      usedMb: number;
      usagePercent: number;
      processRssMb: number;
      processHeapUsedMb: number;
    };
    uptime: {
      serverUptimeSeconds: number;
      processUptimeSeconds: number;
    };
    nodeVersion: string;
  };
  capacity: {
    currentAccountsCount: number;
    currentOnlineCount: number;
    ramPerAccountMb: number;
    maxSafeCapacity: number;
    absoluteMaxCapacity: number;
    remainingSafeSlots: number;
    capacityUsagePercent: number;
    loadStatus: "optimal" | "moderate" | "heavy" | "critical";
    formula: string;
    recommendations: string[];
  };
}

interface ServerSpecsCapacityModuleProps {
  lang: Language;
}

export const ServerSpecsCapacityModule: React.FC<ServerSpecsCapacityModuleProps> = ({ lang }) => {
  const [data, setData] = useState<ServerCapacityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulatedAccounts, setSimulatedAccounts] = useState<number>(5);
  const [copiedSwap, setCopiedSwap] = useState(false);
  const isRtl = lang === "fa";

  const fetchCapacity = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/server-capacity");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCapacity();
    const interval = setInterval(fetchCapacity, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d} روز و ${h} ساعت`;
    if (h > 0) return `${h} ساعت و ${m} دقیقه`;
    return `${m} دقیقه`;
  };

  const swapCommand = "sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile";

  const handleCopySwap = () => {
    navigator.clipboard.writeText(swapCommand);
    setCopiedSwap(true);
    setTimeout(() => setCopiedSwap(false), 2500);
  };

  if (!data) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 text-center animate-pulse space-y-3">
        <Server className="w-8 h-8 text-emerald-400 mx-auto animate-spin" />
        <p className="text-xs text-slate-400">
          {isRtl ? "درحال بررسی مشخصات سخت‌افزاری و ظرفیت سنجی سرور..." : "Analyzing server hardware & accounts capacity..."}
        </p>
      </div>
    );
  }

  const { specs, capacity } = data;

  // Simulator calculation
  const simRamMb = simulatedAccounts * (capacity.ramPerAccountMb || 45);
  const simTotalRamUsedMb = specs.memory.usedMb + simRamMb;
  const simTotalRamPercent = Math.min(100, Math.round((simTotalRamUsedMb / specs.memory.totalMb) * 100));
  const simIsSafe = simTotalRamPercent < 85;

  const loadStatusMeta = {
    optimal: { label: isRtl ? "عالی و پرسرعت (سبک)" : "Optimal (Light)", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400" },
    moderate: { label: isRtl ? "نرمال و پایدار (متوسط)" : "Moderate (Normal)", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", dot: "bg-cyan-400" },
    heavy: { label: isRtl ? "بار کاری سنگین (هشدار)" : "Heavy Load", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
    critical: { label: isRtl ? "بسیار سنگین (سقف ظرفیت)" : "Critical Load", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", dot: "bg-rose-400" },
  }[capacity.loadStatus] || { label: "Normal", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", dot: "bg-cyan-400" };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. CAPACITY HERO GAUGE & SIZING CARD */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-emerald-500/40 bg-gradient-to-br from-slate-950 via-slate-900/90 to-emerald-950/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-24 -mb-24"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Layers className="w-7 h-7 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isRtl ? "ظرفیت‌سنجی هوشمند سرور: تا چند تا شماره میشه اد کرد؟" : "Server Account Capacity & Telegram Sizing Engine"}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${loadStatusMeta.bg} ${loadStatusMeta.color}`}>
                  <span className={`w-2 h-2 rounded-full ${loadStatusMeta.dot} animate-pulse`}></span>
                  <span>{loadStatusMeta.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isRtl
                  ? "محاسبه دقیق بر مبنای توان واقعی CPU، فضای رم آزاد و مصرف MTProto؛ تضمین فعالیت ۲۴ ساعته بدون کرش و هنگ کردن سشن‌ها."
                  : "Accurate estimation based on CPU cores, available RAM, and GramJS MTProto client footprint."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchCapacity}
            disabled={loading}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>{isRtl ? "بروزرسانی زنده مشخصات" : "Refresh Metrics"}</span>
          </button>
        </div>

        {/* Big Highlights: Capacity Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {/* Box 1: Safe Max Numbers */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-1.5 shadow-inner">
            <span className="text-[11px] text-slate-400 font-medium">
              {isRtl ? "ظرفیت امن و پایدار (توصیه‌شده):" : "Recommended Safe Capacity:"}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
              <span>تا {capacity.maxSafeCapacity}</span>
              <span className="text-xs font-sans text-emerald-300 font-bold">شماره</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {isRtl ? "بدون افت سرعت حتی در زمان ارسال همزمان تبچی" : "Zero lag even during simultaneous broadcasts"}
            </p>
          </div>

          {/* Box 2: Absolute Max with Swap */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-1.5 shadow-inner">
            <span className="text-[11px] text-slate-400 font-medium">
              {isRtl ? "حداکثر ظرفیت (با فعال‌سازی Swap):" : "Max with Virtual Swap:"}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono flex items-baseline gap-1.5">
              <span>تا {capacity.absoluteMaxCapacity}</span>
              <span className="text-xs font-sans text-cyan-300 font-bold">شماره</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {isRtl ? "با حافظه مجازی ۴ گیگابایتی و مدیریت بهینه رم" : "Requires 4GB swap space activated"}
            </p>
          </div>

          {/* Box 3: Current Added Accounts */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 shadow-inner">
            <span className="text-[11px] text-slate-400 font-medium">
              {isRtl ? "شماره‌های فعلی متصل به پنل:" : "Currently Hosted Accounts:"}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{capacity.currentAccountsCount}</span>
              <span className="text-xs font-mono text-slate-400">/ {capacity.maxSafeCapacity}</span>
            </div>
            <p className="text-[10px] text-emerald-400 font-mono">
              {capacity.currentOnlineCount} {isRtl ? "اکانت آنلاین و آماده ارسال" : "online & active"}
            </p>
          </div>

          {/* Box 4: Remaining Free Slots */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-1.5 shadow-inner">
            <span className="text-[11px] text-slate-400 font-medium">
              {isRtl ? "فضای خالی برای افزودن شماره جدید:" : "Free Slots Available Now:"}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono flex items-baseline gap-1.5">
              <span>+{capacity.remainingSafeSlots}</span>
              <span className="text-xs font-sans text-purple-200 font-bold">جای خالی</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {isRtl ? "می‌توانید فوراً شماره‌های بیشتری اضافه کنید" : "Ready for immediate account connection"}
            </p>
          </div>
        </div>

        {/* Capacity Meter Bar */}
        <div className="pt-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isRtl ? "درصد اشغال ظرفیت شماره‌های سرور:" : "Server Account Capacity Meter:"}</span>
            </span>
            <span className="font-mono text-emerald-400">
              {capacity.capacityUsagePercent}% ({capacity.currentAccountsCount} از {capacity.maxSafeCapacity} اسلات پر شده)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              style={{ width: `${Math.max(5, Math.min(100, capacity.capacityUsagePercent))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. REAL HARDWARE SPECIFICATIONS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CPU Card */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <Cpu className="w-4 h-4" />
              <span>{isRtl ? "پردازنده سرور (CPU)" : "Processor (CPU)"}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {specs.cpu.cores} {isRtl ? "هسته" : "Cores"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-white font-mono font-bold text-xs truncate" title={specs.cpu.model}>
              {specs.cpu.model}
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{isRtl ? "لود میانگین (۱، ۵، ۱۵ دقیقه):" : "Load Averages (1m, 5m, 15m):"}</span>
              <span className="font-mono text-cyan-300 font-bold">
                {specs.cpu.loadAvg1m} / {specs.cpu.loadAvg5m} / {specs.cpu.loadAvg15m}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{isRtl ? "فرکانس تقریبی:" : "Clock Speed:"}</span>
              <span className="font-mono text-slate-200">{specs.cpu.speedMhz} MHz</span>
            </div>
          </div>
        </div>

        {/* RAM Card */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <Activity className="w-4 h-4" />
              <span>{isRtl ? "حافظه رم فیزیکی (RAM)" : "System Memory (RAM)"}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {specs.memory.usagePercent}% {isRtl ? "مصرف" : "Used"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isRtl ? "کل رم سرور:" : "Total RAM:"}</span>
              <span className="font-mono text-white font-bold">{specs.memory.totalMb.toLocaleString()} MB ({(specs.memory.totalMb / 1024).toFixed(1)} GB)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isRtl ? "رم آزاد در دسترس:" : "Free Available RAM:"}</span>
              <span className="font-mono text-emerald-400 font-bold">{specs.memory.freeMb.toLocaleString()} MB ({(specs.memory.freeMb / 1024).toFixed(1)} GB)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isRtl ? "سهم پردازه دیمن تلگرام:" : "Telegram Daemon RSS:"}</span>
              <span className="font-mono text-purple-300 font-bold">{specs.memory.processRssMb} MB</span>
            </div>
          </div>
        </div>

        {/* OS & Environment Card */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <HardDrive className="w-4 h-4" />
              <span>{isRtl ? "سیستم‌عامل و محیط میزبان" : "Operating System & Host"}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {specs.os.arch}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isRtl ? "سیستم‌عامل:" : "OS Platform:"}</span>
              <span className="font-mono text-white font-bold">{specs.os.type} ({specs.os.platform})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isRtl ? "آپتایم سرور:" : "Server Uptime:"}</span>
              <span className="font-mono text-cyan-300 font-bold">{formatUptime(specs.uptime.serverUptimeSeconds)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{isRtl ? "محیط اجرا (Node.js):" : "Node.js Engine:"}</span>
              <span className="font-mono text-slate-300">{specs.nodeVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE SIMULATOR (تست و شبیه‌سازی افزودن تعداد شماره دلخواه) */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              {isRtl ? "شبیه‌ساز افزودن شماره: اگر چند اکانت دیگر اضافه کنم چه می‌شود؟" : "Interactive Account Scaling Simulator"}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isRtl
                ? "اسلایدر زیر را جابجا کنید تا اثر افزودن شماره‌های جدید بر مصرف رم و توان سرور را شبیه‌سازی کنید."
                : "Drag the slider to preview RAM and system impact before adding new accounts."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold">
              {isRtl ? "تعداد شماره‌های فرضی برای افزودن:" : "Simulated Number of Accounts to Add:"}
            </span>
            <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20">
              +{simulatedAccounts} {isRtl ? "شماره جدید" : "New Accounts"}
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={Math.max(30, capacity.absoluteMaxCapacity)}
            value={simulatedAccounts}
            onChange={(e) => setSimulatedAccounts(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">{isRtl ? "رم اضافی مورد نیاز:" : "Estimated Additional RAM:"}</span>
              <div className="font-mono font-bold text-cyan-300 text-sm">~{simRamMb} MB</div>
              <p className="text-[10px] text-slate-500">مبنا: ۴۵ مگابایت به ازای هر خط</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">{isRtl ? "مجموع مصرف رم سرور:" : "Total Projected RAM Usage:"}</span>
              <div className="font-mono font-bold text-white text-sm">
                {simTotalRamPercent}% ({simTotalRamUsedMb} MB)
              </div>
              <p className="text-[10px] text-slate-500">از کل {specs.memory.totalMb} MB رم سرور</p>
            </div>

            <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${simIsSafe ? "bg-emerald-950/20 border-emerald-500/30" : "bg-rose-950/20 border-rose-500/30"}`}>
              <span className={simIsSafe ? "text-emerald-300" : "text-rose-300"}>
                {isRtl ? "نتیجه ارزیابی سرور:" : "Feasibility Assessment:"}
              </span>
              <div className={`font-bold text-xs flex items-center gap-1.5 ${simIsSafe ? "text-emerald-400" : "text-rose-400"}`}>
                {simIsSafe ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>
                  {simIsSafe
                    ? isRtl ? "کاملاً ایمن و قابل اجرا بدون افت سرعت ✅" : "Safe & recommended to proceed"
                    : isRtl ? "هشدار: رم سرور نزدیک به سقف؛ نیاز به Swap ⚠️" : "Warning: Upgrade RAM or enable Swap"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {simIsSafe ? "پایداری کامل تضمین می‌شود" : "ممکن است تبچی به کندی ارسال شود"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. OPTIMIZATION GUIDE & SWAP ACCELERATOR */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">
              {isRtl ? "توصیه‌های حرفه‌ای: چطور تعداد شماره‌های قابل اجرا را ۲ برابر کنیم؟" : "Capacity Boost & Optimization Recommendations"}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isRtl ? "راهکارهای تضمینی برای پشتیبانی از ۵۰ الی ۱۰۰ اکانت همزمان بدون کندی" : "Tested methods to scale to 50-100 simultaneous accounts"}
            </p>
          </div>
        </div>

        {/* Swap Fast Command Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>{isRtl ? "دستور فعال‌سازی فوری ۴ گیگابایت حافظه مجازی (Swap Memory):" : "One-Line Command to enable 4GB Swap Space:"}</span>
            </span>
            <button
              type="button"
              onClick={handleCopySwap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-all border border-emerald-500/40 active:scale-95 cursor-pointer"
            >
              {copiedSwap ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSwap ? (isRtl ? "کپی شد!" : "Copied!") : (isRtl ? "کپی دستور" : "Copy")}</span>
            </button>
          </div>
          <code className="block p-3 rounded-xl bg-black font-mono text-emerald-400 text-xs overflow-x-auto border border-emerald-500/20" dir="ltr">
            {swapCommand}
          </code>
          <p className="text-[11px] text-slate-400">
            {isRtl
              ? "با اجرای این دستور در ترمینال سرور، ۴ گیگابایت فضای کمکی به رم اضافه می‌شود و می‌توانید تا ۲ برابر شماره بیشتر بدون هزینه اضافی هاست کنید."
              : "Running this adds 4GB virtual swap memory instantly, effectively doubling your account hosting capacity."}
          </p>
        </div>

        {/* Bullet Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {capacity.recommendations.map((rec, i) => (
            <div key={i} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300 leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
