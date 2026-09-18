import React, { useState, useEffect } from "react";
import { Lock, ShieldAlert, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import { Language, translations } from "../utils/i18n";

interface StartupLockModalProps {
  lang: Language;
  onUnlocked: () => void;
}

export const StartupLockModal: React.FC<StartupLockModalProps> = ({
  lang,
  onUnlocked,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    setTimeout(() => {
      // Standard Hacker Edition v6 startup password
      if (password === "selfsamkaren12" || password === "admin") {
        sessionStorage.setItem("hacker_v6_authenticated", "true");
        onUnlocked();
      } else {
        setError(
          lang === "fa"
            ? "رمز عبور استارتاپ اشتباه است (رمز پیش‌فرض: selfsamkaren12)"
            : "Invalid startup password (default: selfsamkaren12)"
        );
      }
      setVerifying(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-black text-white">
              {t.system.startupAuthTitle}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
              v6 PRO
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {t.system.startupAuthDesc}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              {t.system.passwordPlaceholder}
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="selfsamkaren12"
                dir="ltr"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || !password}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            <span>{verifying ? "..." : t.system.unlockBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Hint */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Default Key: <span className="text-cyan-400">selfsamkaren12</span>
          </p>
        </div>
      </div>
    </div>
  );
};
