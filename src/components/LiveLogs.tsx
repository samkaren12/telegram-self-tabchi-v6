import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { LogEntry } from "../types";

interface LiveLogsProps {
  lang: Language;
}

export const LiveLogs: React.FC<LiveLogsProps> = ({ lang }) => {
  const t = translations[lang];
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const handleClear = async () => {
    try {
      await fetch("/api/logs/clear", { method: "POST" });
      setLogs([]);
    } catch (_) {}
  };

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.module}] ${
            l.accountPhone ? `(${l.accountPhone}) ` : ""
          }${l.message}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (selectedModule !== "all" && l.module !== selectedModule) return false;
    if (selectedLevel !== "all" && l.level !== selectedLevel) return false;
    return true;
  });

  const getLevelBadge = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return <span className="text-emerald-400">SUCCESS</span>;
      case "warn":
        return <span className="text-amber-400">WARN</span>;
      case "error":
        return <span className="text-rose-400">ERROR</span>;
      default:
        return <span className="text-cyan-400">INFO</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4" dir="ltr">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">
              {t.logs.title}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live MTProto Gateway & Automation events ({filteredLogs.length} entries)
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.logs.copied : t.logs.copy}</span>
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 hover:text-rose-400 text-slate-300 text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.logs.clear}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 text-[11px] font-mono">Filter:</span>
        {["all", "auth", "self_time", "auto_reply", "tabchi", "system"].map((mod) => (
          <button
            key={mod}
            onClick={() => setSelectedModule(mod)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
              selectedModule === mod
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "bg-slate-950 text-slate-400 hover:text-white"
            }`}
          >
            {mod}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {["all", "info", "success", "warn", "error"].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all ${
              selectedLevel === lvl
                ? "bg-slate-700 text-white font-bold"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div
        ref={logContainerRef}
        className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-2 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-slate-600 italic">
            {t.logs.empty}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed hover:bg-slate-900/50 p-1 rounded transition-colors">
              <span className="text-slate-600 text-[10px] flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="font-bold text-[10px] w-14 flex-shrink-0">
                {getLevelBadge(log.level)}
              </span>
              <span className="text-purple-400 text-[10px] flex-shrink-0 px-1 py-0.2 bg-purple-500/10 rounded">
                [{log.module}]
              </span>
              {log.accountPhone && (
                <span className="text-amber-400/90 text-[10px] flex-shrink-0">
                  {log.accountPhone}:
                </span>
              )}
              <span className="text-slate-200 break-all flex-1">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
