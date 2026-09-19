import React, { useState } from "react";
import {
  Calendar,
  Infinity as InfinityIcon,
  Check,
  X,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { TelegramAccount } from "../types";
import { Language } from "../utils/i18n";

interface ExtendSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TelegramAccount | null;
  onSuccess: () => void;
  lang: Language;
}

export const ExtendSubscriptionModal: React.FC<ExtendSubscriptionModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess,
  lang,
}) => {
  if (!isOpen || !account) return null;

  const sub = account.subscription;
  const isUnlimitedCurrent = sub?.is_unlimited ?? true;

  const [isUnlimited, setIsUnlimited] = useState<boolean>(isUnlimitedCurrent);
  const [daysToAdd, setDaysToAdd] = useState<number>(30);
  const [notes, setNotes] = useState<string>(sub?.notes || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const calculateNewExpiryDate = (days: number) => {
    let baseTime = Date.now();
    if (sub?.expires_at && !sub.is_unlimited) {
      const currentExpiry = new Date(sub.expires_at).getTime();
      if (currentExpiry > baseTime) {
        baseTime = currentExpiry;
      }
    }
    const newDate = new Date(baseTime + days * 24 * 60 * 60 * 1000);
    return newDate.toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_unlimited: isUnlimited,
          days_to_add: isUnlimited ? undefined : Number(daysToAdd),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در تمدید اشتراک");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const presets = [7, 15, 30, 60, 90, 180, 365];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 flex items-center justify-center text-slate-950">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {lang === "fa" ? "تمدید و مدیریت اشتراک اکانت" : "Extend Account Subscription"}
              </h3>
              <p className="text-xs text-slate-400 font-mono" dir="ltr">
                {account.phone} ({account.firstName || "Telegram User"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400">
              {lang === "fa" ? "وضعیت فعلی اشتراک:" : "Current Subscription Status:"}
            </div>
            <div className="flex items-center justify-between">
              {sub?.is_unlimited ? (
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <InfinityIcon className="w-4 h-4" />
                  <span>{lang === "fa" ? "نامحدود (دائمی)" : "Unlimited (Permanent)"}</span>
                </div>
              ) : sub?.expires_at ? (
                <div>
                  <div className="text-xs font-semibold text-cyan-400">
                    {lang === "fa" ? "تاریخ انقضا:" : "Expires At:"}{" "}
                    <span className="font-mono">
                      {new Date(sub.expires_at).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(sub.expires_at).getTime() <= Date.now() ? (
                      <span className="text-rose-400 font-bold">
                        {lang === "fa" ? "⛔ منقضی شده" : "⛔ Expired"}
                      </span>
                    ) : (
                      <span className="text-emerald-400">
                        {lang === "fa" ? "🟢 فعال و معتبر" : "🟢 Active"}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-slate-300 text-xs">{lang === "fa" ? "ثبت‌نشده" : "Not Set"}</span>
              )}

              <span className="text-xs text-slate-500 font-mono">
                {account.userId ? `ID: ${account.userId}` : ""}
              </span>
            </div>
          </div>

          {/* Plan Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {lang === "fa" ? "انتخاب نوع اشتراک جدید:" : "Select New Subscription Type:"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsUnlimited(true)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  isUnlimited
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <InfinityIcon className="w-4 h-4" />
                <span>{lang === "fa" ? "اشتراک نامحدود (دائمی)" : "Unlimited Plan"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUnlimited(false)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  !isUnlimited
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{lang === "fa" ? "تعیین تعداد روز" : "Set Days Limit"}</span>
              </button>
            </div>
          </div>

          {/* Days Input & Presets (if not unlimited) */}
          {!isUnlimited && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === "fa" ? "تعداد روزهای اضافه شونده:" : "Days to Add:"}
                </label>
                <span className="text-xs text-cyan-400 font-mono font-bold">
                  +{daysToAdd} {lang === "fa" ? "روز" : "days"}
                </span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDaysToAdd(p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      daysToAdd === p
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p} {lang === "fa" ? "روزه" : "d"}
                  </button>
                ))}
              </div>

              {/* Custom Number Input */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder={lang === "fa" ? "تعداد روز دلخواه..." : "Custom days..."}
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {lang === "fa" ? "روز" : "Days"}
                </span>
              </div>

              {/* Calculated New Expiry */}
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
                <span>{lang === "fa" ? "تاریخ جدید انقضا:" : "New Expiration Date:"}</span>
                <span className="font-bold font-mono">{calculateNewExpiryDate(daysToAdd)}</span>
              </div>
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {lang === "fa" ? "یادداشت یا نام کاربر (اختیاری):" : "Notes / Owner Tag (Optional):"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === "fa" ? "مثلا: مشتری vip یا نام دارنده شماره..." : "e.g. VIP Customer..."}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {lang === "fa" ? "انصراف" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span>{lang === "fa" ? "در حال ثبت..." : "Saving..."}</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{lang === "fa" ? "ثبت و تمدید اشتراک" : "Confirm & Extend"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
