import React, { useState } from "react";
import {
  Heart,
  X,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Coins,
  Wallet,
} from "lucide-react";
import { Language } from "../utils/i18n";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

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
        className="relative w-full max-w-lg bg-gradient-to-br from-[#020503] via-[#040c06] to-[#0a0304] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(16,185,129,0.3)] space-y-6 overflow-hidden my-auto"
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
        <div className="space-y-3.5 relative z-10 text-xs">
          {/* 1. TRON Wallet (TRX & USDT-TRC20) */}
          <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 shadow-inner space-y-2.5 hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">
                    {lang === "fa" ? "کیف پول ترون (TRON / TRX / USDT TRC-20)" : "TRON Network (TRX / USDT TRC-20)"}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">TRC-20 Standard</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTronQr(!showTronQr)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/40 transition-all cursor-pointer"
                title="نمایش QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Address Box */}
            <div className="flex items-center gap-2 p-2.5 bg-[#020503] rounded-xl border border-emerald-500/30">
              <span className="font-mono text-emerald-300 select-all break-all text-[11px] flex-1" dir="ltr">
                {tronAddress}
              </span>
              <button
                type="button"
                onClick={handleCopyTron}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {copiedTron ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                <span>{copiedTron ? (lang === "fa" ? "کپی شد ✓" : "Copied!") : (lang === "fa" ? "کپی آدرس" : "Copy")}</span>
              </button>
            </div>

            {/* Optional QR Code Preview */}
            {showTronQr && (
              <div className="p-3 bg-white rounded-xl mx-auto w-fit shadow-lg animate-in fade-in text-center space-y-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${tronAddress}`}
                  alt="Tron QR Code"
                  className="w-36 h-36 mx-auto"
                />
                <span className="text-[10px] text-slate-800 font-mono block">TRON / TRX / USDT</span>
              </div>
            )}
          </div>

          {/* 2. TON Wallet (TON / Gram / USDT-TON) */}
          <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/40 shadow-inner space-y-2.5 hover:border-cyan-400 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                  💎
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">
                    {lang === "fa" ? "کیف پول تون‌کوین (TON / Gram / USDT TON)" : "Toncoin Network (TON / Gram)"}
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-mono">The Open Network (TON)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTonQr(!showTonQr)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer"
                title="نمایش QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Address Box */}
            <div className="flex items-center gap-2 p-2.5 bg-[#020503] rounded-xl border border-cyan-500/30">
              <span className="font-mono text-cyan-300 select-all break-all text-[11px] flex-1" dir="ltr">
                {tonAddress}
              </span>
              <button
                type="button"
                onClick={handleCopyTon}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[11px] shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {copiedTon ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                <span>{copiedTon ? (lang === "fa" ? "کپی شد ✓" : "Copied!") : (lang === "fa" ? "کپی آدرس" : "Copy")}</span>
              </button>
            </div>

            {/* Optional QR Code Preview */}
            {showTonQr && (
              <div className="p-3 bg-white rounded-xl mx-auto w-fit shadow-lg animate-in fade-in text-center space-y-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${tonAddress}`}
                  alt="TON QR Code"
                  className="w-36 h-36 mx-auto"
                />
                <span className="text-[10px] text-slate-800 font-mono block">TON / Gram / USDT-TON</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-current animate-pulse" />
          <span>
            {lang === "fa"
              ? "خیلی مخلصیم! حمایت‌های شما انگیزه اصلی آپدیت‌هاست."
              : "Thank you for supporting this open-source project!"}
          </span>
        </div>
      </div>
    </div>
  );
};
