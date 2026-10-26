import React, { useState } from "react";
import {
  Clock,
  Radio,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Infinity as InfinityIcon,
  Wifi,
  Sparkles,
  Zap,
} from "lucide-react";
import { TelegramAccount } from "../types";
import { Language, translations } from "../utils/i18n";
import { TabId } from "./Sidebar";
import { motion } from "motion/react";

interface ActiveAccountBannerProps {
  account: TelegramAccount;
  lang: Language;
  isCustomer: boolean;
  onSelectTab: (tab: TabId) => void;
  onExtendSubscription?: (account: TelegramAccount) => void;
}

export const ActiveAccountBanner: React.FC<ActiveAccountBannerProps> = ({
  account,
  lang,
  isCustomer,
  onSelectTab,
  onExtendSubscription,
}) => {
  const t = translations[lang];
  const isFa = lang === "fa";
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(account.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOnline = account.isOnline;
  const isTabchiBroadcasting = account.features?.tabchi?.status === "broadcasting";
  const isClockActive = account.features?.self_time?.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel rounded-2xl p-3.5 sm:p-5 relative overflow-hidden shadow-2xl animate-shimmer border border-violet-500/25 hover:border-violet-500/40"
    >
      {/* Top Cybernetic Accent Line */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-violet-500/0 via-cyan-400/80 to-violet-500/0" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Account Info with Avatar */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative group shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-[#080c1d] rounded-[14px] flex items-center justify-center text-white font-black text-base sm:text-lg">
                {account.firstName ? account.firstName[0].toUpperCase() : "U"}
              </div>
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#050712] flex items-center justify-center ${
                isOnline
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                  : "bg-slate-500"
              }`}
              title={isOnline ? t.status.online : t.status.offline}
            >
              {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white truncate tracking-tight">
                {account.firstName || ""} {account.lastName || ""}
              </h2>
              {account.username && (
                <span className="text-xs text-cyan-400 font-mono font-medium">
                  @{account.username}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isOnline
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {isOnline ? t.status.online : t.status.offline}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="font-mono text-slate-300" dir="ltr">
                {account.phone}
              </span>
              <button
                onClick={handleCopyPhone}
                className="text-slate-400 hover:text-cyan-300 transition-colors p-0.5 rounded cursor-pointer"
                title={isFa ? "کپی شماره" : "Copy phone"}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>24ms Ping</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Badges & Features Matrix */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {/* Profile Clock Feature Badge */}
          <button
            type="button"
            onClick={() => onSelectTab("self")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isClockActive
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25 shadow-sm shadow-cyan-500/10"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${isClockActive ? "text-cyan-400 animate-spin" : "text-slate-500"}`} style={{ animationDuration: "12s" }} />
            <span>{isFa ? "ساعت سلف:" : "Clock:"}</span>
            <span className="font-bold">{isClockActive ? (isFa ? "روشن 🟢" : "Active") : (isFa ? "خاموش" : "Off")}</span>
          </button>

          {/* Tabchi Broadcaster Feature Badge */}
          <button
            type="button"
            onClick={() => onSelectTab("tabchi")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isTabchiBroadcasting
                ? "bg-violet-500/20 text-violet-200 border-violet-500/50 hover:bg-violet-500/30 shadow-md shadow-violet-500/15"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isTabchiBroadcasting ? "text-violet-400 animate-pulse" : "text-slate-500"}`} />
            <span>{isFa ? "تبچی:" : "Tabchi:"}</span>
            <span className="font-bold">
              {isTabchiBroadcasting
                ? (isFa ? "در حال ارسال 🚀" : "Broadcasting")
                : (isFa ? "آماده" : "Idle")}
            </span>
          </button>

          {/* Subscription State Badge / Extend Action */}
          {account.subscription?.is_unlimited ? (
            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/35 flex items-center gap-1.5">
              <InfinityIcon className="w-3.5 h-3.5 text-violet-400" />
              <span>{isFa ? "اشتراک دائمی و نامحدود" : "Unlimited"}</span>
            </span>
          ) : account.subscription?.expires_at &&
            new Date(account.subscription.expires_at).getTime() <= Date.now() ? (
            isCustomer ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>{isFa ? "اشتراک منقضی شده" : "Expired"}</span>
              </span>
            ) : onExtendSubscription ? (
              <button
                onClick={() => onExtendSubscription(account)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-500/50 flex items-center gap-1.5 hover:bg-rose-500/30 transition-all cursor-pointer shadow-sm shadow-rose-500/10"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>{isFa ? "تمدید اشتراک منقضی" : "Extend Expired"}</span>
              </button>
            ) : null
          ) : account.subscription?.expires_at ? (
            isCustomer ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {(() => {
                    const diffMs = new Date(account.subscription.expires_at).getTime() - Date.now();
                    const days = Math.max(0, Math.floor(diffMs / (24 * 3600 * 1000)));
                    const hours = Math.max(0, Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000)));
                    return `${days} روز و ${hours} ساعت`;
                  })()}
                </span>
              </span>
            ) : onExtendSubscription ? (
              <button
                onClick={() => onExtendSubscription(account)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 flex items-center gap-1.5 hover:bg-cyan-500/25 transition-all cursor-pointer"
                title={isFa ? "تمدید اشتراک این اکانت" : "Extend subscription"}
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? "تمدید اشتراک" : "Extend Sub"}</span>
              </button>
            ) : null
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
