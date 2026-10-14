import React, { useState, useEffect } from "react";
import {
  Lock,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Crown,
  Bot,
  Sparkles,
  HelpCircle,
  Phone,
  User,
  Eye,
  EyeOff,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  X,
  Terminal,
  Zap,
  Heart,
  Loader2,
  Cpu,
  Layers,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { AuthSession } from "../types";
import { DonateModal } from "./DonateModal";

interface StartupLockModalProps {
  lang: Language;
  onUnlocked: (session: AuthSession) => void;
  portalMode?: "client" | "admin";
}

export const StartupLockModal: React.FC<StartupLockModalProps> = ({
  lang,
  onUnlocked,
  portalMode = "client",
}) => {
  const [role, setRole] = useState<"owner" | "customer">(
    portalMode === "admin" ? "owner" : "customer"
  );
  const [ownerUsername, setOwnerUsername] = useState("samkaren12");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [customerUsername, setCustomerUsername] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showDonateDialog, setShowDonateDialog] = useState(false);

  // Sync role if portalMode changes
  useEffect(() => {
    setRole(portalMode === "admin" ? "owner" : "customer");
  }, [portalMode]);

  useEffect(() => {
    fetch("/api/auth/owner-credentials")
      .then((res) => res.json())
      .then((data) => {
        if (data.credentials?.username) {
          setOwnerUsername(data.credentials.username);
        }
      })
      .catch(() => {});
  }, []);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    const activeRole = role;
    const username = activeRole === "owner" ? ownerUsername.trim() : customerUsername.trim();
    const password = activeRole === "owner" ? ownerPassword.trim() : customerPassword.trim();

    if (!password) {
      setError(lang === "fa" ? "لطفاً رمز عبور را وارد نمایید." : "Please enter your password.");
      setVerifying(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: activeRole, username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === "fa" ? "مشخصات ورود نامعتبر است." : "Invalid login credentials."));
      }

      const session: AuthSession = {
        role: data.session.role,
        username: data.session.username,
        customerPhone: data.session.customerPhone,
        accountName: data.session.accountName,
      };

      sessionStorage.setItem("hacker_v6_authenticated", "true");
      sessionStorage.setItem("hacker_v6_session", JSON.stringify(session));
      onUnlocked(session);
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطا در برقراری ارتباط با سرور" : "Server connection error"));
    } finally {
      setVerifying(false);
    }
  };

  const fillQuickOwnerTest = () => {
    setOwnerUsername("samkaren12");
    setOwnerPassword("samkaren12");
    setError(null);
  };

  const isOwnerPortal = role === "owner";

  return (
    <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto cyber-matrix-grid">
      {/* Ambient Gradient Glows (Violet & Cyan) */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/12 rounded-full blur-[140px] pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="fixed top-1/2 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div
        className="w-full max-w-md bg-gradient-to-b from-[#0d1326]/90 to-[#090d1c]/95 border border-violet-500/20 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_-5px_rgba(139,92,246,0.15)] my-auto transition-all duration-300"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Subtle Ambient Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/60 to-cyan-400/60" />

        {/* Header with Developer Avatar & Official Branding */}
        <div className="text-center space-y-3.5 relative z-10">
          <div className="relative inline-block mx-auto">
            {/* Spinning/Subtle Glowing Gradient Ring */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[2px] shadow-[0_0_30px_rgba(139,92,246,0.35)] group hover:scale-105 transition-all duration-300">
              <div className="w-full h-full bg-[#0a0e1e] rounded-[14px] overflow-hidden flex items-center justify-center relative">
                <img
                  src="https://github.com/samkaren12.png"
                  alt="samkaren12 Developer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                {/* Fallback Icon */}
                <Crown className="w-8 h-8 text-violet-400 absolute -z-10" />
              </div>
            </div>

            {/* Live Status Indicator */}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#090d1c] flex items-center justify-center shadow-[0_0_10px_#10b981]">
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
          </div>

          {/* Badges & Titles */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-semibold text-violet-300 bg-violet-950/60 border border-violet-500/30 px-2.5 py-0.5 rounded-full">
                CORE v6.2.0 • MTPROTO
              </span>
              <a
                href="https://github.com/samkaren12"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono font-semibold text-cyan-300 hover:text-white bg-cyan-950/50 border border-cyan-500/30 hover:border-cyan-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all"
              >
                <span>DEV: @samkaren12</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </a>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isOwnerPortal
                ? (lang === "fa" ? "ورود به پنل مدیریت مالک سرور" : "Master Server Owner Portal")
                : (lang === "fa" ? "ورود به پنل اختصاصی مشتریان" : "Customer Portal Login")}
            </h2>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {isOwnerPortal
                ? (lang === "fa"
                    ? "دسترسی مدیریت کامل به حساب‌ها، ربات فروشگاهی و اتوماسیون دائمی تلگرام"
                    : "Full management access to accounts, store bot, and permanent daemon")
                : (lang === "fa"
                    ? "مدیریت ساعت زنده روی پروفایل، منشی هوشمند و تبلیغات خودکار تبچی"
                    : "Manage your Self-time clock, Auto-reply, and Tabchi broadcaster")}
            </p>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#070b18] border border-violet-500/20 rounded-2xl gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRole("owner");
              setError(null);
              try {
                window.history.pushState({}, "", "/admin");
              } catch (_) {}
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isOwnerPortal
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(139,92,246,0.35)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-violet-950/30"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{lang === "fa" ? "پنل مالک سرور" : "Master Owner"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("customer");
              setError(null);
              try {
                window.history.pushState({}, "", "/client");
              } catch (_) {}
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isOwnerPortal
                ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-[0_4px_16px_rgba(6,182,212,0.35)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-cyan-950/30"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{lang === "fa" ? "پنل مشتریان" : "Client Portal"}</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isOwnerPortal ? (
            /* OWNER FORM */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === "fa" ? "نام کاربری روت مالک سرور:" : "Server Owner Username:"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    placeholder="samkaren12"
                    dir="ltr"
                    className="w-full saas-input rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-violet-500 transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {lang === "fa" ? "رمز عبور مالک:" : "Master Password:"}
                  </label>
                  <button
                    type="button"
                    onClick={fillQuickOwnerTest}
                    className="text-[11px] text-violet-400 hover:text-violet-300 font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    title="پر کردن اتوماتیک samkaren12"
                  >
                    <Zap className="w-3 h-3 text-violet-400" />
                    <span>{lang === "fa" ? "پر کردن سریع (تستی)" : "Quick Fill"}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="samkaren12"
                    dir="ltr"
                    autoFocus
                    className="w-full saas-input rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-violet-500 transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CUSTOMER FORM */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === "fa" ? "شماره تلفن یا یوزرنیم تلگرام شما:" : "Your Telegram Phone or Username:"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerUsername}
                    onChange={(e) => setCustomerUsername(e.target.value)}
                    placeholder="+989123456789"
                    dir="ltr"
                    autoFocus
                    className="w-full saas-input rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-cyan-500 transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === "fa" ? "رمز عبور اختصاصی (دریافت از ربات تلگرام):" : "Password (from Telegram Bot):"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="SK-xxxxxx"
                    dir="ltr"
                    className="w-full saas-input rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:border-cyan-500 transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bot instructions for customers */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 text-xs leading-relaxed flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  {lang === "fa" ? (
                    <>
                      💡 <b>راهنمای مشتریان:</b> مشخصات و رمز عبور ورود را می‌توانید از طریق دکمه <b>«دریافت مشخصات ورود به پنل وب»</b> در ربات تلگرام شماره خود دریافت کنید.
                    </>
                  ) : (
                    <>
                      💡 <b>Customer Guide:</b> You can get your login password via the <b>"Get Web Panel Credentials"</b> button in your Telegram Bot.
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Clean Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons: Submit & Helpers */}
          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={verifying || (isOwnerPortal ? !ownerPassword : !customerPassword)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white saas-btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === "fa" ? "در حال احراز هویت امنیتی..." : "Authenticating..."}</span>
                </>
              ) : (
                <>
                  <span>
                    {isOwnerPortal
                      ? (lang === "fa" ? "ورود به پنل مالک سرور" : "Sign In to Master Portal")
                      : (lang === "fa" ? "ورود به پنل مشتری" : "Sign In to Client Portal")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Friendly Help Modal Button & Donate Button */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowHelpDialog(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-900/60 hover:bg-violet-950/30 border border-violet-500/20 hover:border-violet-500/40 text-violet-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span className="truncate">{lang === "fa" ? "راهنمای ورود" : "Login Guide"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDonateDialog(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-900/60 hover:bg-rose-950/30 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{lang === "fa" ? "حمایت مالی" : "Donate"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer Credit & System Information */}
        <div className="pt-3 border-t border-violet-500/15 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>24/7 PERMANENT DAEMON</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{lang === "fa" ? "توسعه‌دهنده:" : "Developer:"}</span>
            <a
              href="https://github.com/samkaren12"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 font-semibold hover:underline"
            >
              samkaren12
            </a>
          </div>
        </div>
      </div>

      {/* Visual Help & Friendly Tutorial Dialog on Login Screen */}
      {showHelpDialog && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-[#0a0e20] border border-violet-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-5 relative overflow-hidden animate-in fade-in zoom-in-95"
            dir={lang === "fa" ? "rtl" : "ltr"}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowHelpDialog(false)}
              className="absolute top-4 left-4 sm:left-6 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-violet-500/40 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-md">
                <Lightbulb className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {lang === "fa" ? "راهنمای سریع ورود به پنل" : "Quick Login Guide"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === "fa" ? "چطور در چند ثانیه وارد پنل شوید؟" : "How to log in within seconds?"}
                </p>
              </div>
            </div>

            {/* Visual Guide Cards */}
            <div className="space-y-3 text-xs text-slate-300">
              {/* Card 1: Owner */}
              <div className="p-4 rounded-2xl bg-violet-950/20 border border-violet-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-violet-300 font-bold">
                  <Crown className="w-4 h-4 text-violet-400" />
                  <span>{lang === "fa" ? "۱. اگر مالک سرور هستید (Root Master):" : "1. If you are the Server Owner:"}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[12px]">
                  {lang === "fa"
                    ? "نام کاربری پیش‌فرض samkaren12 و رمز عبور پیش‌فرض نیز samkaren12 است. همچنین در فرم ورود می‌توانید دکمه «پر کردن سریع» را بزنید."
                    : "The default credentials are username: samkaren12 and password: samkaren12. You can also click 'Quick Fill' in the login form."}
                </p>
              </div>

              {/* Card 2: Customer */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span>{lang === "fa" ? "۲. اگر خریدار / مشتری هستید (Client):" : "2. If you are a Customer:"}</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[12px]">
                  {lang === "fa"
                    ? "وارد ربات تلگرام شماره خودتان شوید و روی دکمه «🔑 دریافت مشخصات ورود به پنل وب» کلیک کنید. ربات بلافاصله شماره تلفن و رمز اختصاصی (مانند SK-xxxxxx) را برای شما ارسال می‌کند."
                    : "Go to your Telegram Bot and tap 'Get Web Panel Credentials'. The bot will send you your unique password (e.g. SK-xxxxxx)."}
                </p>
              </div>

              {/* Card 3: Security */}
              <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {lang === "fa"
                    ? "کلیه سشن‌ها با توکن رمزنگاری‌شده و پایش زنده دیمن محافظت می‌شوند."
                    : "All sessions are encrypted with token protection and 24/7 daemon monitoring."}
                </span>
              </div>
            </div>

            {/* Close Button Bottom */}
            <button
              onClick={() => setShowHelpDialog(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-bold text-xs transition-all cursor-pointer"
            >
              {lang === "fa" ? "متوجه شدم، رفتن به فرم ورود" : "Got it, back to login"}
            </button>
          </div>
        </div>
      )}

      {/* Donation Modal on Login Screen */}
      <DonateModal
        isOpen={showDonateDialog}
        onClose={() => setShowDonateDialog(false)}
        lang={lang}
      />
    </div>
  );
};
