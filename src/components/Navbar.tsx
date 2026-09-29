import React from "react";
import { Send, Globe, Server, Plus, ShieldCheck, UserCheck, ExternalLink, Code2, Crown, User, LogOut, KeyRound, Volume2, VolumeX } from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount, SystemHealth, AuthSession } from "../types";

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  accounts: TelegramAccount[];
  selectedPhone: string | null;
  onSelectAccount: (phone: string) => void;
  onOpenConnectModal: () => void;
  systemHealth: SystemHealth | null;
  authSession?: AuthSession | null;
  onLogout?: () => void;
  onOpenOwnerPasswordModal?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  accounts,
  selectedPhone,
  onSelectAccount,
  onOpenConnectModal,
  systemHealth,
  authSession,
  onLogout,
  onOpenOwnerPasswordModal,
  soundEnabled = true,
  onToggleSound,
}) => {
  const t = translations[lang];
  const activeCount = accounts.filter((a) => a.isOnline).length;
  const selectedAccount = accounts.find((a) => a.phone === selectedPhone) || accounts[0];

  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/25 flex-shrink-0 group hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950/90 backdrop-blur-md rounded-[14px] flex items-center justify-center text-cyan-400 group-hover:text-cyan-300">
              <Send className="w-5 h-5 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight truncate">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                24/7 MTProto
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate hidden md:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Account Selector (if multiple) */}
          {accounts.length > 0 && (
            <div className="relative">
              <select
                value={selectedAccount?.phone || ""}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer font-mono shadow-sm"
              >
                {accounts.map((acc) => (
                  <option key={acc.phone} value={acc.phone} className="bg-slate-900 text-white">
                    {acc.isOnline ? "🟢" : "⚪"} {acc.firstName || acc.phone} ({acc.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* System status pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-700/60 text-xs text-slate-300">
            <Server className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>
              {activeCount}/{accounts.length} {lang === "fa" ? "حساب فعال" : "active"}
            </span>
          </div>

          {/* Creator GitHub Link with Authentic GitHub Icon */}
          <a
            href="https://github.com/samkaren12"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all text-xs font-mono font-medium shadow-sm hover:shadow-cyan-500/20 group"
            title="GitHub Profile: samkaren12"
          >
            {/* Authentic GitHub SVG Logo */}
            <svg
              className="w-4 h-4 fill-current text-slate-300 group-hover:text-white group-hover:scale-110 transition-all duration-300"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span className="hidden md:inline font-bold">GitHub: samkaren12</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all hidden sm:inline" />
          </a>

          {/* Global Sound Notification Toggle */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-center ${
                soundEnabled
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 shadow-sm"
                  : "bg-slate-900/80 border-slate-700/80 text-slate-500 hover:text-slate-300"
              }`}
              title={
                soundEnabled
                  ? lang === "fa"
                    ? "اعلان‌های صوتی فعال است (کلیک برای بی‌صدا)"
                    : "Sound notifications ON (Click to mute)"
                  : lang === "fa"
                  ? "اعلان‌های صوتی غیرفعال است (کلیک برای فعال‌سازی)"
                  : "Sound notifications OFF (Click to unmute)"
              }
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white transition-all text-xs font-medium"
            title={lang === "fa" ? "Switch to English" : "تغییر به فارسی"}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === "fa" ? "EN" : "فارسی"}</span>
          </button>

          {/* User Session Role Badge */}
          {authSession && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                authSession.role === "owner"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              }`}
            >
              {authSession.role === "owner" ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "fa" ? `مالک: ${authSession.username || "samkaren12"}` : `Owner: ${authSession.username}`}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono">{authSession.customerPhone || authSession.username}</span>
                </>
              )}
            </div>
          )}

          {/* Owner Change Password/Username Button */}
          {authSession?.role === "owner" && onOpenOwnerPasswordModal && (
            <button
              onClick={onOpenOwnerPasswordModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all shadow-sm"
              title={lang === "fa" ? "تغییر نام‌کاربری و رمز عبور مالک" : "Change Owner Credentials"}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">{lang === "fa" ? "تغییر رمز و کاربری" : "Change Login"}</span>
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700 text-slate-300 transition-all text-xs"
              title={lang === "fa" ? "خروج از پنل" : "Logout"}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Connect Account Primary CTA (Owner Only) */}
          {(!authSession || authSession.role === "owner") && (
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="whitespace-nowrap">{t.connectAccount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
