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
  Heart,
  Menu,
  ChevronRight,
  ChevronLeft,
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
  onOpenDonateModal?: () => void;
  onOpenMobileSidebar?: () => void;
  currentSectionTitle?: string;
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
  onOpenDonateModal,
  onOpenMobileSidebar,
  currentSectionTitle,
}) => {
  const t = translations[lang];
  const activeCount = accounts.filter((a) => a.isOnline).length;
  const selectedAccount = accounts.find((a) => a.phone === selectedPhone) || accounts[0];
  const [copiedCli, setCopiedCli] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass-header border-b border-violet-500/15">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left/Start Zone: Mobile Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Hamburger Trigger */}
          {onOpenMobileSidebar && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-violet-500/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="منو"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 min-w-0">
            <span className="hidden sm:inline text-slate-400 font-mono">Console</span>
            {currentSectionTitle && (
              <>
                <span className="hidden sm:inline text-slate-600">
                  {lang === "fa" ? "‹" : "/"}
                </span>
                <span className="text-white font-semibold truncate">
                  {currentSectionTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right/End Controls Zone */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Active Account Switcher Dropdown */}
          {accounts.length > 0 && (
            <div className="relative">
              <select
                value={selectedAccount?.phone || ""}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="bg-slate-900/90 border border-violet-500/25 hover:border-violet-500/50 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 sm:py-2 focus:outline-none focus:border-violet-500 transition-all cursor-pointer font-mono shadow-sm"
              >
                {accounts.map((acc) => (
                  <option key={acc.phone} value={acc.phone} className="bg-[#0b0f20] text-white">
                    {acc.isOnline ? "●" : "○"} {acc.firstName || acc.phone} ({acc.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* System Status Metric */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-violet-500/15 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-slate-300">
              {activeCount}/{accounts.length} {lang === "fa" ? "اکانت آنلاین" : "online"}
            </span>
          </div>

          {/* Sound Notification Toggle */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-center cursor-pointer ${
                soundEnabled
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300"
              }`}
              title={
                soundEnabled
                  ? lang === "fa"
                    ? "اعلان‌های صوتی روشن است"
                    : "Sound notifications ON"
                  : lang === "fa"
                  ? "اعلان‌های صوتی خاموش است"
                  : "Sound notifications OFF"
              }
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-violet-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-violet-500/15 hover:border-violet-500/35 text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            title={lang === "fa" ? "Switch to English" : "تغییر به فارسی"}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === "fa" ? "EN" : "فارسی"}</span>
          </button>

          {/* Owner Change Password/Username Button */}
          {authSession?.role === "owner" && onOpenOwnerPasswordModal && (
            <button
              onClick={onOpenOwnerPasswordModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/25 text-violet-300 text-xs font-medium transition-all shadow-sm cursor-pointer"
              title={lang === "fa" ? "تغییر نام‌کاربری و رمز عبور مالک" : "Change Owner Credentials"}
            >
              <KeyRound className="w-3.5 h-3.5 text-violet-400" />
              <span>{lang === "fa" ? "تغییر رمز" : "Password"}</span>
            </button>
          )}

          {/* User Session Role Badge */}
          {authSession && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                authSession.role === "owner"
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                  : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
              }`}
            >
              {authSession.role === "owner" ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-violet-400" />
                  <span className="font-mono text-[11px]">{authSession.username || "samkaren12"}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[11px]">{authSession.customerPhone || authSession.username}</span>
                </>
              )}
            </div>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-slate-400 transition-all text-xs cursor-pointer"
              title={lang === "fa" ? "خروج از پنل" : "Logout"}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Connect Account Primary CTA (Owner Only) */}
          {(!authSession || authSession.role === "owner") && (
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm text-white saas-btn-primary transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">{t.connectAccount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
