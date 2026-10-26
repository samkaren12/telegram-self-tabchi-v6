import React, { useState, useEffect } from "react";
import {
  Activity,
  Plus,
  Globe,
  ChevronDown,
  Smartphone,
  ShieldAlert,
  Cpu,
  Database,
  LogOut,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Volume2,
  VolumeX,
  HelpCircle,
  Heart,
  Menu,
  Sparkles,
  Clock,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount, SystemHealth, AuthSession } from "../types";
import { motion } from "motion/react";

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  accounts: TelegramAccount[];
  selectedPhone: string | null;
  onSelectAccount: (phone: string) => void;
  onOpenConnectModal: () => void;
  systemHealth: SystemHealth | null;
  authSession: AuthSession | null;
  onLogout: () => void;
  onOpenOwnerPasswordModal?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenHelpModal?: () => void;
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
  const selectedAccount = accounts.find((a) => a.phone === selectedPhone);
  const isOwner = authSession?.role === "owner";
  const [liveTime, setLiveTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      setLiveTime(
        new Date().toLocaleTimeString(lang === "fa" ? "fa-IR" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, [lang]);

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <header className="sticky top-0 z-30 glass-header border-b border-violet-500/20 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.75)]">
      {/* Subtle Top Holographic Line */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-violet-500/70 to-cyan-400/70 opacity-85" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Drawer Trigger + Section Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileSidebar && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={onOpenMobileSidebar}
              className="md:hidden w-10 h-10 rounded-xl bg-slate-900/90 border border-violet-500/30 flex items-center justify-center text-slate-300 hover:text-white hover:border-violet-400 transition-all cursor-pointer shadow-md"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white truncate tracking-tight bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text text-transparent">
                {currentSectionTitle || t.appTitle}
              </h1>

              {/* Role Pill */}
              {authSession && (
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${
                    isOwner
                      ? "bg-amber-500/12 border-amber-500/35 text-amber-300"
                      : "bg-cyan-500/12 border-cyan-500/35 text-cyan-300"
                  }`}
                >
                  {isOwner ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span>{lang === "fa" ? "مدیریت کل" : "Admin"}</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3 text-cyan-400" />
                      <span>{lang === "fa" ? "پنل کاربری" : "Customer"}</span>
                    </>
                  )}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
              <span>{t.appSubtitle}</span>
            </p>
          </div>
        </div>

        {/* Center: Live System Health Telemetry Strip (Desktop) */}
        {systemHealth && (
          <div className="hidden xl:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-slate-900/75 border border-violet-500/20 text-xs backdrop-blur-xl shadow-inner">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>{t.status.online}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1 text-slate-300 font-mono">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span>{systemHealth.memoryUsageMb} MB</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1 text-slate-300 font-mono">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatUptime(systemHealth.uptimeSeconds)}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1 text-slate-300 font-mono">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {systemHealth.connectedAccountsCount}/{accounts.length}
              </span>
            </div>
            {liveTime && (
              <>
                <span className="text-slate-700">|</span>
                <div className="flex items-center gap-1 text-cyan-300 font-mono" dir="ltr">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{liveTime}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: Account Switcher & Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Account Switcher Dropdown */}
          {accounts.length > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 border border-violet-500/25 hover:border-violet-400/50 text-xs sm:text-sm transition-all cursor-pointer shadow-sm">
                <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold text-slate-200 max-w-[100px] sm:max-w-[140px] truncate">
                  {selectedAccount
                    ? `${selectedAccount.firstName || selectedAccount.phone}`
                    : lang === "fa"
                    ? "انتخاب اکانت"
                    : "Select Account"}
                </span>
                {selectedAccount && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      selectedAccount.isOnline
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                        : "bg-slate-500"
                    }`}
                  />
                )}
                {accounts.length > 1 && (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                )}
              </button>

              {/* Dropdown Menu */}
              {accounts.length > 1 && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl glass-panel shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1.5 border border-violet-500/30">
                  <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 border-b border-slate-800/80">
                    {t.accounts.title} ({accounts.length})
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40 my-1">
                    {accounts.map((acc) => (
                      <button
                        key={acc.phone}
                        onClick={() => onSelectAccount(acc.phone)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right text-xs transition-all cursor-pointer ${
                          acc.phone === selectedPhone
                            ? "bg-violet-600/25 text-violet-200 font-bold border border-violet-500/30"
                            : "text-slate-300 hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-medium truncate">
                            {acc.firstName} {acc.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {acc.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              acc.isOnline ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connect New Account Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenConnectModal}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl saas-btn-primary text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.connectAccount}</span>
          </motion.button>

          {/* Donate Button (Tablet & Desktop) */}
          {onOpenDonateModal && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onOpenDonateModal}
              title={lang === "fa" ? "دونیت و حمایت مالی" : "Donate & Support"}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-500/12 hover:bg-rose-500/22 border border-rose-500/30 text-rose-300 transition-all text-xs font-semibold cursor-pointer"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span className="hidden xl:inline">{lang === "fa" ? "حمایت" : "Donate"}</span>
            </motion.button>
          )}

          {/* Visual Help Button (Tablet & Desktop) */}
          {onOpenHelpModal && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onOpenHelpModal}
              title={lang === "fa" ? "راهنمای تصویری" : "Visual Guide"}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-cyan-300 transition-all text-xs font-semibold cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline">{lang === "fa" ? "راهنما" : "Guide"}</span>
            </motion.button>
          )}

          {/* Sound Toggle */}
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              title={
                soundEnabled
                  ? lang === "fa"
                    ? "صدای اعلان‌ها فعال"
                    : "Sound Alerts On"
                  : lang === "fa"
                  ? "صدای اعلان‌ها غیرفعال"
                  : "Sound Alerts Off"
              }
              className={`p-2 rounded-xl border transition-all text-xs cursor-pointer ${
                soundEnabled
                  ? "bg-slate-900/80 border-slate-700/80 text-cyan-400 hover:bg-slate-800"
                  : "bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-violet-400" />
            <span className="uppercase font-mono">{lang === "fa" ? "EN" : "FA"}</span>
          </button>

          {/* Owner Password Change Button */}
          {isOwner && onOpenOwnerPasswordModal && (
            <button
              type="button"
              onClick={onOpenOwnerPasswordModal}
              title={lang === "fa" ? "تغییر رمز مدیریت" : "Change Admin Password"}
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all text-xs cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
            </button>
          )}

          {/* Logout */}
          {authSession && (
            <button
              onClick={onLogout}
              title={lang === "fa" ? "خروج از حساب" : "Logout"}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all text-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
