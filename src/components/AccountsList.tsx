import React, { useState } from "react";
import {
  Users,
  Copy,
  Check,
  Power,
  RefreshCw,
  Clock,
  MessageSquare,
  Radio,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Calendar,
  Infinity as InfinityIcon,
  Sparkles,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount } from "../types";
import { ExtendSubscriptionModal } from "./ExtendSubscriptionModal";

interface AccountsListProps {
  accounts: TelegramAccount[];
  selectedPhone: string | null;
  onSelectAccount: (phone: string) => void;
  onOpenConnectModal: () => void;
  onRefresh: () => void;
  lang: Language;
}

export const AccountsList: React.FC<AccountsListProps> = ({
  accounts,
  selectedPhone,
  onSelectAccount,
  onOpenConnectModal,
  onRefresh,
  lang,
}) => {
  const t = translations[lang];
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [subscriptionTargetAccount, setSubscriptionTargetAccount] = useState<TelegramAccount | null>(null);

  const handleCopySession = (phone: string, sessionString: string) => {
    navigator.clipboard.writeText(sessionString);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleDisconnect = async (phone: string) => {
    if (!confirm(t.accounts.disconnectConfirm)) return;

    setActionLoading(phone);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(phone)}/disconnect`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      onRefresh();
    } catch (err) {
      alert("Error disconnecting account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReconnect = async (phone: string) => {
    setActionLoading(phone);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(phone)}/reconnect`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reconnect");
      onRefresh();
    } catch (err) {
      alert("Error reconnecting account");
    } finally {
      setActionLoading(null);
    }
  };

  const renderSubscriptionStatus = (acc: TelegramAccount) => {
    const sub = acc.subscription;
    if (!sub || sub.is_unlimited) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <InfinityIcon className="w-3.5 h-3.5" />
          <span>{lang === "fa" ? "اشتراک نامحدود (دائمی)" : "Unlimited Subscription"}</span>
        </div>
      );
    }

    if (sub.expires_at) {
      const expiry = new Date(sub.expires_at);
      const diffMs = expiry.getTime() - Date.now();

      if (diffMs <= 0) {
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lang === "fa" ? "⛔ اشتراک منقضی شده (نیازمند تمدید)" : "⛔ Subscription Expired"}</span>
          </div>
        );
      }

      const daysLeft = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const hoursLeft = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {lang === "fa"
              ? `⏳ باقی‌مانده: ${daysLeft} روز و ${hoursLeft} ساعت`
              : `⏳ Left: ${daysLeft}d ${hoursLeft}h`}
          </span>
        </div>
      );
    }

    return null;
  };

  if (accounts.length === 0) {
    return (
      <div
        className="p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto shadow-2xl"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-lg shadow-cyan-500/10">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-100">
          {t.noAccounts}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 mb-6 leading-relaxed">
          {t.noAccountsDesc}
        </p>
        <button
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.connectFirstAccount}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={lang === "fa" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
            <span>{t.accounts.title}</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
              {accounts.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            {lang === "fa"
              ? "مدیریت جداگانه هر شماره تلفن، تعیین روزشمار، تمدید اشتراک و بررسی وضعیت آنلاین بودن"
              : "Manage each phone number independently, configure subscription days, extend access, and monitor status"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenConnectModal}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === "fa" ? "افزودن شماره جدید" : "Add Account"}</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === "fa" ? "بروزرسانی" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => {
          const isSelected = acc.phone === selectedPhone;
          const isExpired =
            acc.subscription &&
            !acc.subscription.is_unlimited &&
            acc.subscription.expires_at &&
            new Date(acc.subscription.expires_at).getTime() <= Date.now();

          return (
            <div
              key={acc.phone}
              className={`bg-slate-900 border rounded-2xl p-5 transition-all relative ${
                isSelected
                  ? "border-cyan-500/80 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                  : isExpired
                  ? "border-rose-500/40 bg-rose-950/10"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Top info */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {acc.firstName ? acc.firstName[0].toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-100 text-sm truncate">
                        {acc.firstName || "Telegram User"} {acc.lastName}
                      </h4>
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          acc.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                        }`}
                        title={acc.isOnline ? "Worker Online" : "Offline"}
                      ></span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate" dir="ltr">
                      {acc.phone} {acc.username ? `@${acc.username}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate" dir="ltr">
                      ID: {acc.userId}
                    </p>
                  </div>
                </div>

                {/* Select button */}
                <button
                  onClick={() => onSelectAccount(acc.phone)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {isSelected ? (lang === "fa" ? "حساب فعال" : "Active") : (lang === "fa" ? "انتخاب" : "Select")}
                </button>
              </div>

              {/* Subscription Status Bar */}
              <div className="my-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                {renderSubscriptionStatus(acc)}

                <button
                  onClick={() => setSubscriptionTargetAccount(acc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                  title="Extend or change subscription"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{lang === "fa" ? "تمدید اشتراک 📅" : "Extend"}</span>
                </button>
              </div>

              {/* Status Feature Badges */}
              <div className="flex flex-wrap gap-2 mb-4 pt-2 border-t border-slate-800/80">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                    acc.features?.self_time?.active
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "bg-slate-950 text-slate-500 border border-slate-800"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {lang === "fa" ? "ساعت پروفایل" : "Self-Time"}:{" "}
                    {acc.features?.self_time?.active ? (lang === "fa" ? "فعال" : "ON") : (lang === "fa" ? "خاموش" : "OFF")}
                  </span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                    acc.features?.auto_reply?.active
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-950 text-slate-500 border border-slate-800"
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>
                    {lang === "fa" ? "منشی هوشمند" : "Auto-Reply"}:{" "}
                    {acc.features?.auto_reply?.active ? (lang === "fa" ? "فعال" : "ON") : (lang === "fa" ? "خاموش" : "OFF")}
                  </span>
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                    acc.features?.tabchi?.status === "broadcasting"
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"
                      : "bg-slate-950 text-slate-500 border border-slate-800"
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>
                    {lang === "fa" ? "تبچی" : "Tabchi"}:{" "}
                    {acc.features?.tabchi?.total_sent || 0} {lang === "fa" ? "ارسال" : "sent"}
                  </span>
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleCopySession(acc.phone, acc.sessionString)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors border border-slate-800 font-mono"
                  title="Copy Telethon / GramJS StringSession"
                >
                  {copiedPhone === acc.phone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>
                    {copiedPhone === acc.phone ? (lang === "fa" ? "کپی شد" : "Copied") : t.accounts.copySession}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {!acc.isOnline && (
                    <button
                      onClick={() => handleReconnect(acc.phone)}
                      disabled={actionLoading === acc.phone}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30 transition-colors"
                      title={t.accounts.reconnect}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDisconnect(acc.phone)}
                    disabled={actionLoading === acc.phone}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30 transition-colors"
                    title={t.accounts.disconnect}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extend Subscription Modal */}
      <ExtendSubscriptionModal
        isOpen={Boolean(subscriptionTargetAccount)}
        onClose={() => setSubscriptionTargetAccount(null)}
        account={subscriptionTargetAccount}
        onSuccess={onRefresh}
        lang={lang}
      />
    </div>
  );
};

