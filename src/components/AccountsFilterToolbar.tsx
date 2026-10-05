import React from "react";
import {
  Search,
  Filter,
  X,
  Radio,
  Wifi,
  WifiOff,
  Infinity as InfinityIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Flame,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount } from "../types";

export type SubscriptionFilterType = "all" | "active" | "unlimited" | "expiring_soon" | "expired";
export type OnlineFilterType = "all" | "online" | "offline";
export type BroadcastLoadFilterType = "all" | "broadcasting" | "high" | "medium" | "low_idle";
export type SortByType = "default" | "phone" | "broadcast_sent" | "expiry";

export interface AccountFiltersState {
  searchQuery: string;
  subscriptionStatus: SubscriptionFilterType;
  onlineStatus: OnlineFilterType;
  broadcastLoad: BroadcastLoadFilterType;
  sortBy: SortByType;
}

export const defaultAccountFilters: AccountFiltersState = {
  searchQuery: "",
  subscriptionStatus: "all",
  onlineStatus: "all",
  broadcastLoad: "all",
  sortBy: "default",
};

interface AccountsFilterToolbarProps {
  filters: AccountFiltersState;
  onChangeFilters: (filters: AccountFiltersState) => void;
  onResetFilters: () => void;
  totalAccountsCount: number;
  filteredAccountsCount: number;
  lang: Language;
}

export const AccountsFilterToolbar: React.FC<AccountsFilterToolbarProps> = ({
  filters,
  onChangeFilters,
  onResetFilters,
  totalAccountsCount,
  filteredAccountsCount,
  lang,
}) => {
  const isRtl = lang === "fa";

  const isFilterActive =
    filters.searchQuery.trim() !== "" ||
    filters.subscriptionStatus !== "all" ||
    filters.onlineStatus !== "all" ||
    filters.broadcastLoad !== "all" ||
    filters.sortBy !== "default";

  const handleUpdate = <K extends keyof AccountFiltersState>(key: K, value: AccountFiltersState[K]) => {
    onChangeFilters({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-xl border border-cyan-500/20 bg-slate-900/80 space-y-4">
      {/* Top Header & Search Bar Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleUpdate("searchQuery", e.target.value)}
            placeholder={
              isRtl
                ? "جستجو در شماره تلفن، نام، نام خانوادگی، یا نام کاربری..."
                : "Search by phone number, name, or username..."
            }
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pr-10 pl-9 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/80 transition-all font-medium"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => handleUpdate("searchQuery", "")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter Badge & Reset Button */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">
              {isRtl ? "نتایج:" : "Results:"}
            </span>
            <span className="font-bold text-cyan-300">
              {filteredAccountsCount}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">
              {totalAccountsCount}
            </span>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="پاک کردن تمامی فیلترها"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isRtl ? "پاکسازی فیلترها" : "Reset"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-800/80">
        {/* 1. Subscription Status Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <InfinityIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRtl ? "وضعیت اشتراک (Subscription):" : "Subscription Status:"}</span>
          </label>
          <div className="relative">
            <select
              value={filters.subscriptionStatus}
              onChange={(e) => handleUpdate("subscriptionStatus", e.target.value as SubscriptionFilterType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium appearance-none"
            >
              <option value="all">🌐 {isRtl ? "همه وضعیت‌های اشتراک" : "All Subscriptions"}</option>
              <option value="active">✅ {isRtl ? "اشتراک فعال و معتبر" : "Active & Valid"}</option>
              <option value="unlimited">♾️ {isRtl ? "دائمی و نامحدود" : "Unlimited Access"}</option>
              <option value="expiring_soon">⏳ {isRtl ? "رو به اتمام (کمتر از ۳ روز)" : "Expiring Soon (≤3d)"}</option>
              <option value="expired">❌ {isRtl ? "منقضی شده" : "Expired"}</option>
            </select>
          </div>
        </div>

        {/* 2. Online Status Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isRtl ? "وضعیت اتصال (Online Status):" : "Online Status:"}</span>
          </label>
          <div className="relative">
            <select
              value={filters.onlineStatus}
              onChange={(e) => handleUpdate("onlineStatus", e.target.value as OnlineFilterType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium appearance-none"
            >
              <option value="all">⚡ {isRtl ? "همه اکانت‌ها (آنلاین و آفلاین)" : "All Accounts"}</option>
              <option value="online">🟢 {isRtl ? "آنلاین و متصل" : "Online Only"}</option>
              <option value="offline">🔴 {isRtl ? "قطع اتصال و آفلاین" : "Offline Only"}</option>
            </select>
          </div>
        </div>

        {/* 3. Broadcast Load Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? "ترافیک ارسال (Broadcast Load):" : "Broadcast Load:"}</span>
          </label>
          <div className="relative">
            <select
              value={filters.broadcastLoad}
              onChange={(e) => handleUpdate("broadcastLoad", e.target.value as BroadcastLoadFilterType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium appearance-none"
            >
              <option value="all">📊 {isRtl ? "همه بارهای کاری" : "All Loads"}</option>
              <option value="broadcasting">🚀 {isRtl ? "در حال ارسال همگانی فعال" : "Active Broadcasting"}</option>
              <option value="high">🔥 {isRtl ? "بار کاری بالا (بیش از ۵۰۰ پیام)" : "High Load (>500 msgs)"}</option>
              <option value="medium">⚡ {isRtl ? "بار متوسط (۱۰۰ تا ۵۰۰ پیام)" : "Medium Load (100-500)"}</option>
              <option value="low_idle">💤 {isRtl ? "بار پایین / آماده‌به‌کار (<۱۰۰)" : "Idle / Low (<100)"}</option>
            </select>
          </div>
        </div>

        {/* 4. Sort By */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
            <span>{isRtl ? "مرتب‌سازی نتایج بر اساس:" : "Sort Order:"}</span>
          </label>
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => handleUpdate("sortBy", e.target.value as SortByType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition-all cursor-pointer font-medium appearance-none"
            >
              <option value="default">📋 {isRtl ? "ترتیب پیش‌فرض" : "Default Order"}</option>
              <option value="broadcast_sent">🚀 {isRtl ? "بیشترین پیام‌های ارسالی" : "Most Broadcast Sent"}</option>
              <option value="expiry">⏳ {isRtl ? "نزدیک‌ترین زمان انقضا" : "Closest Expiry Date"}</option>
              <option value="phone">📞 {isRtl ? "شماره تلفن" : "Phone Number"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filter Tag Chips for Rapid Toggle */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
        <span className="text-slate-500 text-[10px] ml-1">
          {isRtl ? "میانبرهای سریع:" : "Quick shortcuts:"}
        </span>

        {/* Online Only Shortcut */}
        <button
          type="button"
          onClick={() =>
            handleUpdate("onlineStatus", filters.onlineStatus === "online" ? "all" : "online")
          }
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
            filters.onlineStatus === "online"
              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{isRtl ? "فقط آنلاین‌ها" : "Online Only"}</span>
        </button>

        {/* Active Broadcasting Shortcut */}
        <button
          type="button"
          onClick={() =>
            handleUpdate("broadcastLoad", filters.broadcastLoad === "broadcasting" ? "all" : "broadcasting")
          }
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
            filters.broadcastLoad === "broadcasting"
              ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>{isRtl ? "در حال ارسال همگانی" : "Broadcasting Now"}</span>
        </button>

        {/* Expiring Soon Shortcut */}
        <button
          type="button"
          onClick={() =>
            handleUpdate(
              "subscriptionStatus",
              filters.subscriptionStatus === "expiring_soon" ? "all" : "expiring_soon"
            )
          }
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
            filters.subscriptionStatus === "expiring_soon"
              ? "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{isRtl ? "کمتر از ۳ روز مانده" : "Expiring Soon"}</span>
        </button>

        {/* Expired Shortcut */}
        <button
          type="button"
          onClick={() =>
            handleUpdate("subscriptionStatus", filters.subscriptionStatus === "expired" ? "all" : "expired")
          }
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
            filters.subscriptionStatus === "expired"
              ? "bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>{isRtl ? "منقضی شده‌ها" : "Expired"}</span>
        </button>

        {/* High Load Shortcut */}
        <button
          type="button"
          onClick={() =>
            handleUpdate("broadcastLoad", filters.broadcastLoad === "high" ? "all" : "high")
          }
          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
            filters.broadcastLoad === "high"
              ? "bg-purple-500/20 border-purple-500/60 text-purple-300 font-bold"
              : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-3 h-3 text-purple-400" />
          <span>{isRtl ? "بار کاری سنگین (>۵۰۰)" : "High Load (>500)"}</span>
        </button>
      </div>
    </div>
  );
};
