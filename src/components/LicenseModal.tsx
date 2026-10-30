import React, { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Crown,
  Zap,
  RefreshCw,
  Unlock,
  Send,
  Coins,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { Language } from "../utils/i18n";
import { AuthSession } from "../types";
import { motion, AnimatePresence } from "motion/react";

export interface LicenseStatusData {
  status: "active" | "expired" | "none";
  isLicensed: boolean;
  planTitle: string;
  currentAccounts: number;
  freeLimit: number;
  maxAllowed: number;
  remainingSlots: number;
  canConnectMore: boolean;
  activatedAt: number | null;
  expiresAt: number | null;
  daysRemaining: number;
  formattedExpiresAt?: string;
  activeKeyMasked?: string;
  features: string[];
}

export interface LicenseKeyRecord {
  key: string;
  durationDays: number;
  maxAccounts: number;
  createdAt: number;
  isUsed: boolean;
  isDisabled?: boolean;
  usedAt?: number;
  usedBy?: string;
  note?: string;
}

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLicenseUpdated?: (status: LicenseStatusData) => void;
  authSession?: AuthSession | null;
}

// Authoritative Crypto Wallets requested by script creator
const CRYPTO_WALLETS = {
  tron: {
    title: "شبکه ترون (Tron TRX / USDT-TRC20)",
    symbol: "TRX / USDT",
    network: "TRON (TRC20)",
    address: "TBgTK3Png5D467cvCnwfA3xdLvUgJbpAfy",
    badge: "تراکنش سریع",
  },
  ton: {
    title: "شبکه تون (The Open Network - TON)",
    symbol: "TON",
    network: "TON Mainnet",
    address: "UQAozwWDvLXgp4XWS0t8Z9xYdmN5iJ76anD5XD3y74rdhQP-",
    badge: "کمترین کارمزد",
  },
};

// Authoritative Pricing Tiers
const LICENSE_PRICING_PLANS = [
  {
    id: "1m",
    durationDays: 30,
    title: "اشتراک ۱ ماهه (+۱۰ اکانت)",
    priceTon: "1.2 TON",
    priceTron: "26 TRX (یا 6.6 USDT)",
    badge: "۱ ماهه (۳۰ روز)",
    color: "cyan",
  },
  {
    id: "3m",
    durationDays: 90,
    title: "اشتراک ۳ ماهه (+۱۰ اکانت)",
    priceTon: "3.6 TON",
    priceTron: "78 TRX (یا 19.8 USDT)",
    badge: "۳ ماهه (۹۰ روز)",
    color: "purple",
  },
  {
    id: "1y",
    durationDays: 365,
    title: "اشتراک ۱ ساله VIP (+۱۰ اکانت)",
    priceTon: "14.4 TON",
    priceTron: "312 TRX (یا 79.2 USDT)",
    badge: "۱ ساله (۳۶۵ روز) 👑",
    color: "amber",
  },
];

const CREATOR_TELEGRAM_ID = "@samkarendev";
const CREATOR_TELEGRAM_URL = "https://t.me/samkarendev";

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLicenseUpdated,
}) => {
  const [licenseData, setLicenseData] = useState<LicenseStatusData | null>(null);
  const [inputKey, setInputKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/license/status");
      const data = await res.json();
      if (data.success) {
        setLicenseData(data);
        if (onLicenseUpdated) onLicenseUpdated(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setMessage(null);
    }
  }, [isOpen]);

  const handleActivate = async (e?: React.FormEvent, directKey?: string) => {
    if (e) e.preventDefault();
    const keyToUse = (directKey || inputKey).trim();
    if (!keyToUse) {
      setMessage({
        text: lang === "fa" ? "لطفاً کد لایسنس دریافتی از سازنده را وارد کنید." : "Please enter a license key.",
        type: "error",
      });
      return;
    }

    setActivating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyToUse }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "کد لایسنس نامعتبر است.");
      }

      setMessage({ text: data.message, type: "success" });
      setInputKey("");
      await fetchStatus();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActivating(false);
    }
  };

  const copyToClipboard = (text: string, customId?: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(customId || text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const isFa = lang === "fa";
  const currentCount = licenseData?.currentAccounts || 0;
  const isLicensed = Boolean(licenseData?.isLicensed);
  const freeLimit = licenseData?.freeLimit || 10;
  const daysLeft = licenseData?.daysRemaining || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-[#0a0f24] to-slate-950 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/40 text-slate-100 overflow-hidden"
        dir={isFa ? "rtl" : "ltr"}
      >
        {/* Header Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                {isFa ? "لایسنس اتصال بیش از ۱۰ شماره (پنل مالک سرور)" : "Multi-Account Server License"}
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isLicensed ? (isFa ? "لایسنس فعال" : "Active") : (isFa ? "پلن رایگان (۱۰ اکانت)" : "Free (Max 10)")}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFa
                  ? "فعال‌سازی کد لایسنس دریافت‌شده از سازنده اسکریپت جهت اتصال نامحدود اکانت‌ها روی سرور"
                  : "Activate your license key on this server to unlock unlimited accounts"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Quota Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {isFa ? "وضعیت سهمیه اتصال اکانت‌های سرور شما:" : "Connected Accounts Quota:"}
              </span>
              <span className="font-bold text-amber-300 dir-ltr">
                {currentCount} / {isLicensed ? "∞ (نامحدود)" : `${freeLimit}`}
              </span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isLicensed
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : currentCount >= freeLimit
                    ? "bg-gradient-to-r from-rose-500 to-amber-500"
                    : "bg-gradient-to-r from-amber-500 to-yellow-400"
                }`}
                style={{
                  width: isLicensed ? "100%" : `${Math.min(100, (currentCount / freeLimit) * 100)}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                {isLicensed
                  ? (isFa ? "🎉 لایسنس روی سرور شما فعال است و می‌توانید بدون محدودیت اکانت اضافه کنید." : "Unlimited numbers allowed.")
                  : currentCount >= freeLimit
                  ? (isFa ? "⚠️ ظرفیت ۱۰ اکانت رایگان تکمیل گردیده است." : "Free quota reached.")
                  : (isFa ? `${freeLimit - currentCount} اسلات خالی تا پایان سهمیه رایگان` : `${freeLimit - currentCount} slots remaining`)}
              </span>
              {isLicensed && licenseData?.formattedExpiresAt && (
                <span className="text-emerald-400 font-medium">
                  {isFa ? `انقضا: ${licenseData.formattedExpiresAt} (${daysLeft} روز باقی‌مانده)` : `Expires: ${daysLeft} days`}
                </span>
              )}
            </div>
          </div>

          {/* Feedback message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                  message.type === "success"
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                    : "bg-rose-950/60 border-rose-500/40 text-rose-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Status Card + License Input Form */}
          {isLicensed && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>{licenseData?.planTitle}</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/30 font-medium">
                  {isFa ? `${daysLeft} روز اعتبار فعال` : `${daysLeft} Days Left`}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                <p>• {isFa ? "اتصال همزمان نامحدود شماره‌های تلگرام بدون محدودیت ۱۰ شماره" : "Unlimited phone numbers"}</p>
                <p>• {isFa ? "پایداری ۲۴ ساعته روی سرور لینوکس بدون قطعی" : "High speed MTProto worker"}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>
                  {isFa ? "کد لایسنس فعال روی سرور:" : "Active Key:"}{" "}
                  <code className="text-amber-300 font-mono">{licenseData?.activeKeyMasked}</code>
                </span>
              </div>
            </div>
          )}

          {/* License Key Input Form (Always available for activation or renewal) */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>
                {isLicensed
                  ? (isFa ? "تمدید یا ثبت کد لایسنس جدید روی سرور" : "Renew / Enter New License Key")
                  : (isFa ? "ثبت و فعال‌سازی کد لایسنس در پنل مالک" : "Activate License Key")}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFa
                ? "کد لایسنس دریافت‌شده از سازنده اسکریپت را در کادر زیر وارد کنید تا به همان مدت (۱ ماهه، ۳ ماهه یا ۱ ساله) روی سرور شما فعال شود:"
                : "Paste the license key received from the script creator below to unlock unlimited accounts on your server:"}
            </p>

            <form onSubmit={handleActivate} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  placeholder="SAM-30D-XXXXXX-XXXXXXXX"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-500 uppercase text-center tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={activating || !inputKey.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
              >
                {activating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                <span>{isFa ? "فعال‌سازی لایسنس روی سرور" : "Activate License"}</span>
              </button>
            </form>
          </div>

          {/* OFFICIAL PRICING TIERS SECTION (TON & TRON ONLY) */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Coins className="w-4 h-4 text-cyan-400" />
                {isFa ? "تعرفه‌های رسمی خرید لایسنس (تون و معادل ترون):" : "Official License Pricing:"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LICENSE_PRICING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{plan.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                      {plan.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-amber-300 flex items-center gap-1.5 font-mono">
                      <span>{plan.priceTon}</span>
                      <span className="text-[11px] text-slate-400 font-sans font-normal">معادل</span>
                    </div>
                    <div className="text-xs font-mono text-cyan-300 font-semibold dir-ltr text-right">
                      {plan.priceTron}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {plan.durationDays} روز اعتبار اتصال نامحدود
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRYPTO WALLETS SECTION (TRON & TON ONLY - NO BANK CARDS) */}
          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs sm:text-sm">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span>{isFa ? "آدرس‌های ولت جهت واریز وجه لایسنس:" : "Direct Payment Wallets:"}</span>
              </div>
              <span className="text-[11px] text-slate-400">فقط ولت ترون و تون</span>
            </div>

            {/* Tron Wallet */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">{CRYPTO_WALLETS.tron.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
                  TRC20
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-rose-300 break-all dir-ltr text-right select-all">
                  {CRYPTO_WALLETS.tron.address}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(CRYPTO_WALLETS.tron.address, "tron")}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  {copiedKey === "tron" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{isFa ? "کپی شد" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>{isFa ? "کپی ولت ترون" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* TON Wallet */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">{CRYPTO_WALLETS.ton.title}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                  TON Network
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-cyan-300 break-all dir-ltr text-right select-all">
                  {CRYPTO_WALLETS.ton.address}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(CRYPTO_WALLETS.ton.address, "ton")}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  {copiedKey === "ton" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">{isFa ? "کپی شد" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>{isFa ? "کپی ولت تون" : "Copy"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DIRECT TELEGRAM RECEIPT VERIFICATION BOX */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-1 text-center sm:text-right">
                <div className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>{isFa ? "ارسال فیش واریزی و دریافت کد لایسنس" : "Send Receipt to Creator:"}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isFa
                    ? "پس از واریز مبلغ به یکی از دو ولت بالا، فیش یا لینک تراکنش را به آیدی تلگرام سازنده ارسال کنید تا کد لایسنس برای فعال‌سازی در پنل مالکتان ارسال شود:"
                    : "After sending crypto, forward your TxID / screenshot to the creator on Telegram to receive your key:"}
                </p>
              </div>

              <a
                href={CREATOR_TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{CREATOR_TELEGRAM_ID}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition cursor-pointer"
          >
            {isFa ? "بستن" : "Close"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
