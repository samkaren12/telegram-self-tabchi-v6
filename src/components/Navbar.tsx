import React, { useState } from "react";
import {
  Send,
  Globe,
  Server,
  Plus,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Code2,
  Crown,
  User,
  LogOut,
  KeyRound,
  Volume2,
  VolumeX,
  Lightbulb,
  Terminal,
  Check,
  Copy,
  Sparkles,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount, SystemHealth, AuthSession } from "../types";
import { HelpSectionId } from "./VisualHelpModal";

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
  onOpenHelpModal?: (section?: HelpSectionId) => void;
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
  onOpenHelpModal,
}) => {
  const t = translations[lang];
  const activeCount = accounts.filter((a) => a.isOnline).length;
  const selectedAccount = accounts.find((a) => a.phone === selectedPhone) || accounts[0];
  const [copiedCli, setCopiedCli] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-header bg-black/90 border-b border-emerald-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Logo with Matrix Green & Crimson Glow */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-400 to-rose-500 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex-shrink-0 group hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#030805] rounded-[14px] flex items-center justify-center text-emerald-400 group-hover:text-emerald-300">
              <Send className="w-4 h-4 sm:w-5 sm:h-5 transform -rotate-12 group-hover:rotate-0 transition-transform duration-300" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-rose-400 tracking-tight truncate">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                24/7 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden md:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Sudo terminal command quick copy pill */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText("sudo selfandtabchi");
              setCopiedCli(true);
              setTimeout(() => setCopiedCli(false), 2000);
            }}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/80 border border-emerald-500/40 text-[11px] font-mono text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            title="کلیک برای کپی دستور sudo selfandtabchi"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>sudo selfandtabchi</span>
            {copiedCli ? (
              <Check className="w-3 h-3 text-emerald-300 animate-bounce" />
            ) : (
              <Copy className="w-3 h-3 text-slate-500 hover:text-emerald-300" />
            )}
          </button>

          {/* Friendly Visual Guide Trigger Button */}
          {onOpenHelpModal && (
            <button
              type="button"
              onClick={() => onOpenHelpModal()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-rose-500/15 hover:from-emerald-500/30 hover:to-rose-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95"
              title="راهنمای تصویری و خودمونی بخش‌ها"
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden xs:inline sm:inline">راهنمای تصویری 💡</span>
            </button>
          )}

          {/* Account Selector (if multiple) */}
          {accounts.length > 0 && (
            <div className="relative">
              <select
                value={selectedAccount?.phone || ""}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="bg-black/80 border border-emerald-500/30 hover:border-emerald-400 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 sm:py-2 focus:outline-none focus:border-emerald-400 transition-all cursor-pointer font-mono shadow-sm"
              >
                {accounts.map((acc) => (
                  <option key={acc.phone} value={acc.phone} className="bg-slate-950 text-white">
                    {acc.isOnline ? "🟢" : "⚪"} {acc.firstName || acc.phone} ({acc.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* System status pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-500/30 text-xs text-slate-300">
            <Server className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>
              {activeCount}/{accounts.length} {lang === "fa" ? "حساب فعال" : "active"}
            </span>
          </div>

          {/* Global Sound Notification Toggle */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-center ${
                soundEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "bg-black/60 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
              title={
                soundEnabled
                  ? lang === "fa"
                    ? "اعلان‌های صوتی فعال است"
                    : "Sound notifications ON"
                  : lang === "fa"
                  ? "اعلان‌های صوتی غیرفعال است"
                  : "Sound notifications OFF"
              }
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl bg-black/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-all text-xs font-bold"
            title={lang === "fa" ? "Switch to English" : "تغییر به فارسی"}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === "fa" ? "EN" : "فارسی"}</span>
          </button>

          {/* User Session Role Badge */}
          {authSession && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                authSession.role === "owner"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              {authSession.role === "owner" ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-rose-400" />
                  <span>{lang === "fa" ? `مالک: ${authSession.username || "samkaren12"}` : `Owner: ${authSession.username}`}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">{authSession.customerPhone || authSession.username}</span>
                </>
              )}
            </div>
          )}

          {/* Owner Change Password/Username Button */}
          {authSession?.role === "owner" && onOpenOwnerPasswordModal && (
            <button
              onClick={onOpenOwnerPasswordModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all shadow-sm"
              title={lang === "fa" ? "تغییر نام‌کاربری و رمز عبور مالک" : "Change Owner Credentials"}
            >
              <KeyRound className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">{lang === "fa" ? "تغییر رمز" : "Password"}</span>
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-black/60 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 border border-slate-800 text-slate-400 transition-all text-xs"
              title={lang === "fa" ? "خروج از پنل" : "Logout"}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Connect Account Primary CTA (Owner Only) with Neon Green */}
          {(!authSession || authSession.role === "owner") && (
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="whitespace-nowrap">{t.connectAccount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
