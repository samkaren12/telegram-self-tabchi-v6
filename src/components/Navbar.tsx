import React from "react";
import { Send, Globe, Server, Plus, ShieldCheck, UserCheck, ExternalLink, Code2, Crown, User, LogOut } from "lucide-react";
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
}) => {
  const t = translations[lang];
  const activeCount = accounts.filter((a) => a.isOnline).length;
  const selectedAccount = accounts.find((a) => a.phone === selectedPhone) || accounts[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-emerald-400 p-0.5 shadow-cyan-500/20 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Send className="w-5 h-5 transform -rotate-12" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
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
                className="bg-slate-800/90 border border-slate-700 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer font-mono"
              >
                {accounts.map((acc) => (
                  <option key={acc.phone} value={acc.phone}>
                    {acc.isOnline ? "🟢" : "⚪"} {acc.firstName || acc.phone} ({acc.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* System status pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {activeCount}/{accounts.length} {lang === "fa" ? "حساب فعال" : "active"}
            </span>
          </div>

          {/* Creator GitHub Link */}
          <a
            href="https://github.com/samkaren12"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white transition-all text-xs font-mono font-medium shadow-sm group"
            title="GitHub: samkaren12"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">GitHub: samkaren12</span>
            <ExternalLink className="w-3 h-3 text-slate-400 hidden sm:inline" />
          </a>

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium"
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
                  <span>{lang === "fa" ? "مالک: samkaren12" : "Owner"}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono">{authSession.customerPhone || authSession.username}</span>
                </>
              )}
            </div>
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
