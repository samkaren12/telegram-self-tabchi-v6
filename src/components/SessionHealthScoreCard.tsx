import React, { useState, useEffect } from "react";
import {
  Activity,
  HeartPulse,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Radio,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Flame,
  Gauge,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Language } from "../utils/i18n";
import { SystemSessionHealthSummary, AccountSessionHealth } from "../types";

interface SessionHealthScoreCardProps {
  lang: Language;
}

export const SessionHealthScoreCard: React.FC<SessionHealthScoreCardProps> = ({ lang }) => {
  const isRtl = lang === "fa";

  const [data, setData] = useState<SystemSessionHealthSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingPing, setTestingPing] = useState<boolean>(false);
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      const res = await fetch("/api/system/session-health");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleRunPingTest = async () => {
    try {
      setTestingPing(true);
      const res = await fetch("/api/system/session-health/ping", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
          setFeedback(isRtl ? "سنجش زنده سلامت و پینگ سشن‌ها انجام شد ⚡" : "Ping test completed!");
          setTimeout(() => setFeedback(null), 3000);
        }
      }
    } catch (_) {
    } finally {
      setTestingPing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 6000);
    return () => clearInterval(interval);
  }, []);

  const overallScore = data?.overallScore ?? 100;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-cyan-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "from-emerald-500 to-teal-600";
    if (score >= 75) return "from-cyan-500 to-blue-600";
    if (score >= 50) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-red-600";
  };

  const getGradeBadge = (grade: string) => {
    const map: Record<string, string> = {
      "A+": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      A: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      B: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      C: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      D: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      F: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    };
    return (
      <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black border ${map[grade] || "bg-slate-800 text-slate-300"}`}>
        {grade}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900/90 relative overflow-hidden space-y-6">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {isRtl ? "شاخص سلامت و پایداری سشن‌ها (Session Health Score)" : "Real-time Session Health Score"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                LIVE 0-100%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRtl
                ? "پایش زنده و هوشمند تمامی اکانت‌ها بر اساس تاخیر پاسخگویی API، پایداری اتصال و وضعیت محدودیت Flood-Wait."
                : "Real-time score evaluating API latency, connection stability, and flood-wait penalty across all sessions."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleRunPingTest}
            disabled={testingPing}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? "animate-spin" : ""}`} />
            <span>{isRtl ? "تست زنده پینگ و سلامت" : "Ping Diagnostic"}</span>
          </button>
        </div>
      </div>

      {/* Top Score Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        {/* Main Overall Score Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 shadow-xl flex items-center justify-between gap-4 md:col-span-1">
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              {isRtl ? "میانگین نمره سلامت کل سشن‌ها" : "Overall Health Score"}
            </div>
            <div className={`text-3xl font-mono font-black mt-1 ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {overallScore >= 90 ? "🟢 وضعیت بهینه و پایدار" : overallScore >= 70 ? "🟡 نیازمند توجه" : "🔴 وضعیت بحرانی"}
            </div>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Gauge className={`w-8 h-8 ${getScoreColor(overallScore)}`} />
          </div>
        </div>

        {/* Latency Metric */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>{isRtl ? "میانگین تاخیر پاسخگویی (Latency)" : "Avg API Latency"}</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-mono font-bold text-cyan-300">
            {data?.avgLatencyMs || 45} ms
          </div>
          <p className="text-[10px] text-slate-500">
            پروتکل رمزنگاری MTProto مستقیم
          </p>
        </div>

        {/* Flood-Wait Metric */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>{isRtl ? "وضعیت محدودیت اسپم (Flood-Wait)" : "Flood-Wait Status"}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400 flex items-center gap-1.5">
            <span>{data?.warningCount || 0}</span>
            <span className="text-xs font-sans text-slate-400 font-normal">اکانت در محدودیت</span>
          </div>
          <p className="text-[10px] text-slate-500">
            {(data?.warningCount || 0) === 0 ? "بدون محدودیت موقت تلگرام ✅" : "برخی اکانت‌ها در زمان انتظار"}
          </p>
        </div>

        {/* Online vs Offline Accounts */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>{isRtl ? "سشن‌های آنلاین و آماده" : "Active Sessions"}</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {data?.healthyCount || 0} / {data?.totalAccounts || 0}
          </div>
          <p className="text-[10px] text-slate-500">
            پایداری و آماده‌باش دائمی
          </p>
        </div>
      </div>

      {/* Account List Breakdown */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-2">
          <span>{isRtl ? "جزئیات نمره سلامت به تفکیک اکانت‌ها" : "Individual Account Health Breakdown"}</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {data?.accounts.length || 0} {isRtl ? "حساب کاربری" : "Accounts"}
          </span>
        </div>

        {loading && !data ? (
          <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>در حال سنجش و ارزیابی سشن‌ها...</span>
          </div>
        ) : !data || data.accounts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            هیچ اکانتی برای سنجش سلامت یافت نشد.
          </div>
        ) : (
          <div className="space-y-2">
            {data.accounts.map((acc) => {
              const isExpanded = expandedPhone === acc.phone;
              const isFwActive = acc.floodWaitStatus.active;

              return (
                <div
                  key={acc.phone}
                  className={`rounded-2xl border transition-all ${
                    acc.isOnline
                      ? "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                      : "bg-slate-950/40 border-slate-900 opacity-60"
                  }`}
                >
                  {/* Account Summary Bar */}
                  <div
                    onClick={() => setExpandedPhone(isExpanded ? null : acc.phone)}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          acc.isOnline ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-slate-600"
                        }`}
                      ></div>
                      <div>
                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                          <span dir="ltr">{acc.phone}</span>
                          {getGradeBadge(acc.grade)}
                          {isFwActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                              Flood-Wait ({acc.floodWaitStatus.remainingSeconds}s)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {acc.firstName} {acc.lastName || ""}
                        </div>
                      </div>
                    </div>

                    {/* Score Bar & Latency stats */}
                    <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
                      {/* Latency */}
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">پینگ API</div>
                        <div className="font-mono text-xs font-bold text-cyan-300">
                          {acc.latencyMs > 0 ? `${acc.latencyMs}ms` : "-"}
                        </div>
                      </div>

                      {/* Connection Stability */}
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500">پایداری اتصال</div>
                        <div className="font-mono text-xs font-bold text-emerald-300">
                          {acc.connectionStability}%
                        </div>
                      </div>

                      {/* Health Score Gauge */}
                      <div className="w-28 sm:w-36 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">نمره سلامت</span>
                          <span className={`font-mono font-bold ${getScoreColor(acc.score)}`}>
                            {acc.score}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(acc.score)} transition-all duration-500`}
                            style={{ width: `${acc.score}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-slate-500 p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Diagnostic Breakdown */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/60 rounded-b-2xl space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="text-[10px] text-slate-400">امتیاز تاخیر (Max 35)</div>
                          <div className="font-mono font-bold text-cyan-400">
                            {acc.factors.latencyScore} / 35
                          </div>
                          <p className="text-[10px] text-slate-500">سرعت انتقال پکت‌های لایه MTProto</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="text-[10px] text-slate-400">امتیاز پایداری سشن (Max 40)</div>
                          <div className="font-mono font-bold text-emerald-400">
                            {acc.factors.stabilityScore} / 40
                          </div>
                          <p className="text-[10px] text-slate-500">عدم قطعی و پایداری سوکت زنده</p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="text-[10px] text-slate-400">امتیاز عدم محدودیت اسپم (Max 25)</div>
                          <div className="font-mono font-bold text-amber-400">
                            {acc.factors.floodScore} / 25
                          </div>
                          <p className="text-[10px] text-slate-500">بررسی مجازات Flood-Wait در تلگرام</p>
                        </div>
                      </div>

                      {/* Diagnostic Bullet list */}
                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] font-bold text-slate-400">نکات و تحلیل تشخیصی این سشن:</div>
                        <ul className="space-y-1 text-slate-300 text-[11px]">
                          {acc.diagnostics.map((diag, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>{diag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
