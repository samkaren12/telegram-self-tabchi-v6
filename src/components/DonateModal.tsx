import React, { useState } from "react";
import {
  Heart,
  X,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Language } from "../utils/i18n";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

/**
 * High-Fidelity Official TRON (TRX) Logo
 */
export const TronLogo: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="TRON (TRX) Logo"
  >
    <rect width="32" height="32" rx="9" fill="#1f0306" />
    <rect
      x="0.75"
      y="0.75"
      width="30.5"
      height="30.5"
      rx="8.25"
      stroke="#FF060A"
      strokeOpacity="0.5"
      strokeWidth="1.5"
    />
    {/* Geometric Facets of TRON Diamond */}
    <path d="M26.4 8.7L5.6 4.3l11.4 23.4L26.4 8.7z" fill="#E50914" />
    <path d="M17 27.7l1.3-15-12.7-8.4 11.4 23.4z" fill="#B30710" />
    <path d="M18.3 12.7L5.6 4.3l7 12.2 5.7-3.8z" fill="#FF3338" />
    <path d="M18.3 12.7l8.1-4-9.4 19 1.3-15z" fill="#FF5E62" />
    <path
      d="M12.6 16.5l4.4 11.2-1.3-15-3.1 3.8z"
      fill="#FFFFFF"
      fillOpacity="0.35"
    />
  </svg>
);

/**
 * High-Fidelity Official TON (The Open Network / Toncoin) Logo
 */
export const TonLogo: React.FC<{ className?: string }> = ({
  className = "w-6 h-6",
}) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Toncoin (TON) Logo"
  >
    <rect width="32" height="32" rx="9" fill="#031526" />
    <rect
      x="0.75"
      y="0.75"
      width="30.5"
      height="30.5"
      rx="8.25"
      stroke="#0098EA"
      strokeOpacity="0.5"
      strokeWidth="1.5"
    />
    {/* Faceted TON Gem */}
    {/* Top left facet */}
    <path d="M16 5.5L7 11.2l9 3.8V5.5z" fill="#38BDF8" />
    {/* Top right facet */}
    <path d="M16 5.5v9.5l9-3.8-9-5.7z" fill="#0098EA" />
    {/* Bottom left facet */}
    <path d="M7 11.2l9 15.3V15l-9-3.8z" fill="#0284C7" />
    {/* Bottom right facet */}
    <path d="M16 26.5l9-15.3-9 3.8v11.5z" fill="#0369A1" />
    {/* Specular apex highlight */}
    <path
      d="M16 5.5l3.2 2-3.2 1.4-3.2-1.4 3.2-2z"
      fill="#FFFFFF"
      fillOpacity="0.6"
    />
  </svg>
);

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [copiedTron, setCopiedTron] = useState(false);
  const [copiedTon, setCopiedTon] = useState(false);
  const [showTronQr, setShowTronQr] = useState(false);
  const [showTonQr, setShowTonQr] = useState(false);

  if (!isOpen) return null;

  const tronAddress = "TBgTK3Png5D467cvCnwfA3xdLvUgJbpAfy";
  const tonAddress = "UQAozwWDvLXgp4XWS0t8Z9xYdmN5iJ76anD5XD3y74rdhQP-";

  const handleCopyTron = () => {
    navigator.clipboard.writeText(tronAddress);
    setCopiedTron(true);
    setTimeout(() => setCopiedTron(false), 2500);
  };

  const handleCopyTon = () => {
    navigator.clipboard.writeText(tonAddress);
    setCopiedTon(true);
    setTimeout(() => setCopiedTon(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-gradient-to-br from-[#020503] via-[#040c06] to-[#0a0304] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(16,185,129,0.3)] space-y-6 overflow-hidden my-auto max-h-[94vh] overflow-y-auto"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Holographic Scanner Top Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-rose-500 to-emerald-400 animate-pulse" />

        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:left-6 p-2 rounded-xl bg-black/70 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Developer Avatar */}
        <div className="text-center space-y-3 relative z-10 pt-2">
          <div className="relative inline-block mx-auto">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-emerald-500 via-rose-500 to-emerald-400 p-[3px] shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <div className="w-full h-full bg-[#020603] rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src="https://github.com/samkaren12.png"
                  alt="samkaren12 Developer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <Heart className="w-7 h-7 text-rose-400 fill-rose-500/20" />
              </div>
            </div>

            {/* Heart Badge */}
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-black flex items-center justify-center shadow-[0_0_10px_#ef4444]">
              <Heart className="w-3 h-3 text-white fill-current" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                DONATION & SUPPORT
              </span>
              <a
                href="https://github.com/samkaren12"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
              >
                <span>@samkaren12</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-rose-400">
              {lang === "fa" ? "حمایت مالی و دونیت به توسعه‌دهنده 💖" : "Support & Donate to Developer 💖"}
            </h3>

            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {lang === "fa"
                ? "اگر این پنل و اسکریپت‌های سلف و تبچی براتون کاربردی بوده، با دونیت کردن از توسعه نسخه‌های بعدی، امکانات رایگان و نگهداری سرورها حمایت کنید."
                : "If you find this Telegram automation suite useful, consider donating to support future updates and server maintenance."}
            </p>
          </div>
        </div>

        {/* Wallets Container */}
        <div className="space-y-4 relative z-10 text-xs">
          {/* 1. TRON Wallet (TRX & USDT-TRC20) */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-black/70 border border-rose-500/35 shadow-inner space-y-3 hover:border-rose-400/70 transition-all group">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Official Tron Logo Badge */}
                <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <TronLogo className="w-10 h-10 shadow-[0_0_15px_rgba(255,6,10,0.35)]" />
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-black bg-rose-600 text-white font-mono shadow-sm">
                    TRX
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      {lang === "fa" ? "شبکه ترون (TRON / TRX)" : "TRON Network (TRX)"}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      TRC-20
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      USDT
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    TRX • Tether USDT TRC-20 • BitTorrent
                  </span>
                </div>
              </div>

              {/* Action Buttons: Explorer & QR */}
              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                <a
                  href={`https://tronscan.org/#/address/${tronAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/50 transition-all cursor-pointer flex items-center gap-1"
                  title="مشاهده در مرجع TronScan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline text-[10px] font-mono font-bold">TronScan</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowTronQr(!showTronQr)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    showTronQr
                      ? "bg-rose-500/20 border-rose-400 text-rose-200"
                      : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-rose-500/40"
                  }`}
                  title="نمایش QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline text-[10px] font-bold">QR</span>
                </button>
              </div>
            </div>

            {/* Address Box */}
            <div className="flex items-center gap-2 p-2.5 bg-[#020503] rounded-xl border border-rose-500/30">
              <span className="font-mono text-rose-300 select-all break-all text-[11px] flex-1" dir="ltr">
                {tronAddress}
              </span>
              <button
                type="button"
                onClick={handleCopyTron}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-[11px] shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {copiedTron ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                <span>{copiedTron ? (lang === "fa" ? "کپی شد ✓" : "Copied!") : (lang === "fa" ? "کپی آدرس" : "Copy")}</span>
              </button>
            </div>

            {/* QR Code Preview */}
            {showTronQr && (
              <div className="p-3.5 bg-white rounded-2xl mx-auto w-fit shadow-[0_0_30px_rgba(255,6,10,0.25)] animate-in fade-in zoom-in-95 text-center space-y-2 border-2 border-rose-500">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${tronAddress}`}
                  alt="Tron QR Code"
                  className="w-36 h-36 mx-auto rounded-lg"
                />
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-bold text-slate-900 font-mono">
                  <TronLogo className="w-4 h-4" />
                  <span>TRON • TRX / USDT TRC-20</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. TON Wallet (TON / Gram / USDT-TON) */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-black/70 border border-cyan-500/35 shadow-inner space-y-3 hover:border-cyan-400/70 transition-all group">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Official TON Logo Badge */}
                <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <TonLogo className="w-10 h-10 shadow-[0_0_15px_rgba(0,152,234,0.35)]" />
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-black bg-cyan-600 text-white font-mono shadow-sm">
                    TON
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      {lang === "fa" ? "شبکه تون‌کوین (TON / The Open Network)" : "Toncoin Network (TON)"}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      TON
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Gram
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                    Toncoin • USDT TON • Telegram Ecosystem
                  </span>
                </div>
              </div>

              {/* Action Buttons: Explorer & QR */}
              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                <a
                  href={`https://tonscan.org/address/${tonAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center gap-1"
                  title="مشاهده در مرجع TonScan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline text-[10px] font-mono font-bold">TonScan</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowTonQr(!showTonQr)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                    showTonQr
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                      : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40"
                  }`}
                  title="نمایش QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline text-[10px] font-bold">QR</span>
                </button>
              </div>
            </div>

            {/* Address Box */}
            <div className="flex items-center gap-2 p-2.5 bg-[#020503] rounded-xl border border-cyan-500/30">
              <span className="font-mono text-cyan-300 select-all break-all text-[11px] flex-1" dir="ltr">
                {tonAddress}
              </span>
              <button
                type="button"
                onClick={handleCopyTon}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black font-black text-[11px] shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {copiedTon ? <Check className="w-3.5 h-3.5 text-black stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                <span>{copiedTon ? (lang === "fa" ? "کپی شد ✓" : "Copied!") : (lang === "fa" ? "کپی آدرس" : "Copy")}</span>
              </button>
            </div>

            {/* QR Code Preview */}
            {showTonQr && (
              <div className="p-3.5 bg-white rounded-2xl mx-auto w-fit shadow-[0_0_30px_rgba(0,152,234,0.25)] animate-in fade-in zoom-in-95 text-center space-y-2 border-2 border-cyan-500">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${tonAddress}`}
                  alt="TON QR Code"
                  className="w-36 h-36 mx-auto rounded-lg"
                />
                <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-bold text-slate-900 font-mono">
                  <TonLogo className="w-4 h-4" />
                  <span>TON • Toncoin / Gram / USDT</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-1 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5 border-t border-emerald-500/20">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-current animate-pulse flex-shrink-0" />
          <span>
            {lang === "fa"
              ? "خیلی مخلصیم! حمایت‌های شما انگیزه اصلی آپدیت‌ها و سرورهای پروژه است."
              : "Thank you for supporting this open-source Telegram automation project!"}
          </span>
        </div>
      </div>
    </div>
  );
};
