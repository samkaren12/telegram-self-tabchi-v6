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
    <div className="fixed inset-0 z-50 bg-[#020504]/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto cyber-matrix-grid">
      {/* Ambient Cyber Neon Orbs (Emerald Green & Crimson Red) */}
      <div className="fixed top-1/4 left-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2 animate-pulse" />

      <div
        className={`w-full max-w-lg bg-[#050b07]/90 border ${
          isOwnerPortal ? "border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)]" : "border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
        } rounded-3xl p-5 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-2xl transition-all duration-300 my-auto`}
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Holographic Top Scanner Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-rose-500 animate-pulse" />

        {/* Decorative corner glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header with Developer GitHub Avatar & Cyber HUD Ring */}
        <div className="text-center space-y-3 relative z-10">
          <div className="relative inline-block mx-auto">
            {/* Spinning Neon Gradient Ring */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-emerald-500 via-rose-500 to-emerald-400 p-[3px] shadow-[0_0_30px_rgba(16,185,129,0.45)] group hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#020603] rounded-full overflow-hidden flex items-center justify-center relative">
                <img
                  src="https://github.com/samkaren12.png"
                  alt="samkaren12 Developer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                {/* Fallback Icon */}
                <Crown className="w-9 h-9 text-emerald-400 absolute -z-10" />
              </div>
            </div>

            {/* Live Online & Root Status Ping */}
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center shadow-[0_0_10px_#10b981]">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            </span>
          </div>

          {/* Developer & System Branding */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                CORE v6.2.0 • MTPROTO
              </span>
              <a
                href="https://github.com/samkaren12"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono font-bold text-rose-300 hover:text-white bg-rose-950/70 border border-rose-500/40 hover:border-rose-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              >
                <span>DEV: @samkaren12</span>
                <ExternalLink className="w-3 h-3 text-rose-400" />
              </a>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-white to-rose-400 tracking-tight">
              {isOwnerPortal
                ? (lang === "fa" ? "ورود به پنل مدیریت مالک سرور" : "Master Server Owner Portal")
                : (lang === "fa" ? "ورود به پنل اختصاصی مشتریان" : "Customer Portal Login")}
            </h2>

            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {isOwnerPortal
                ? (lang === "fa"
                    ? "دسترسی فوق‌امنیتی روت برای پایش حساب‌های متصل، ربات فروشگاهی و اتوماسیون ۲۴ ساعته"
                    : "Root access portal to supervise all connected accounts, store bot and 24/7 daemon")
                : (lang === "fa"
                    ? "مدیریت ساعت زنده روی پروفایل، پیام‌رسان هوشمند، قفل پیوی و تبلیغات خودکار تبچی"
                    : "Manage your Self-time clock, Auto-reply, Lock PV and Tabchi broadcaster")}
            </p>
          </div>
        </div>

        {/* Role Selector Tabs (Hacker Green & Black with Red Accent) */}
        <div className="grid grid-cols-2 p-1.5 bg-[#020503] border border-emerald-500/30 rounded-2xl gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRole("owner");
              setError(null);
              try {
                window.history.pushState({}, "", "/admin");
              } catch (_) {}
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isOwnerPortal
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.02]"
                : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>{lang === "fa" ? "👑 پنل مالک سرور" : "Master Owner"}</span>
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
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isOwnerPortal
                ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.02]"
                : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{lang === "fa" ? "👤 پنل مشتریان" : "Client Portal"}</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isOwnerPortal ? (
            /* OWNER FORM */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-emerald-300/90 mb-1.5">
                  {lang === "fa" ? "نام کاربری روت مالک سرور:" : "Server Owner Username:"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    placeholder="samkaren12"
                    dir="ltr"
                    className="w-full bg-[#020704] border border-emerald-500/40 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                  />
                  <User className="w-4 h-4 text-emerald-500/60 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-emerald-300/90">
                    {lang === "fa" ? "رمز عبور مالک:" : "Master Password:"}
                  </label>
                  <button
                    type="button"
                    onClick={fillQuickOwnerTest}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    title="پر کردن اتوماتیک samkaren12"
                  >
                    <Zap className="w-3 h-3 text-rose-400" />
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
                    className="w-full bg-[#020704] border border-emerald-500/40 rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-emerald-500/60 absolute left-3 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-emerald-300 transition-colors cursor-pointer p-0.5"
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
                <label className="block text-xs font-semibold text-emerald-300/90 mb-1.5">
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
                    className="w-full bg-[#020704] border border-emerald-500/40 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                  />
                  <Phone className="w-4 h-4 text-emerald-500/60 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300/90 mb-1.5">
                  {lang === "fa" ? "رمز عبور اختصاصی (دریافت از ربات تلگرام):" : "Password (from Telegram Bot):"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="SK-xxxxxx"
                    dir="ltr"
                    className="w-full bg-[#020704] border border-emerald-500/40 rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-emerald-500/60 absolute left-3 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-emerald-300 transition-colors cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Bot instructions for customers */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-start gap-2.5">
                <Bot className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
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

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons: Submit & Friendly Help Modal Trigger */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={verifying || (isOwnerPortal ? !ownerPassword : !customerPassword)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-black bg-gradient-to-r from-emerald-400 via-green-400 to-rose-400 hover:from-emerald-300 hover:to-rose-300 shadow-[0_0_25px_rgba(16,185,129,0.35)] disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>
                {verifying
                  ? (lang === "fa" ? "در حال احراز هویت امنیتی..." : "Authenticating...")
                  : isOwnerPortal
                  ? (lang === "fa" ? "ورود به پنل مالک سرور ⚡" : "Sign In to Master Portal ⚡")
                  : (lang === "fa" ? "ورود به پنل مشتری ⚡" : "Sign In to Client Portal ⚡")}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Friendly Help Modal Button & Donate Button */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowHelpDialog(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-black/60 hover:bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
                <span className="truncate">{lang === "fa" ? "راهنمای ورود 💡" : "Login Guide 💡"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDonateDialog(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-black/60 hover:bg-rose-950/30 border border-rose-500/30 hover:border-rose-400/60 text-rose-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30 animate-pulse flex-shrink-0" />
                <span className="truncate">{lang === "fa" ? "دونیت و حمایت 💖" : "Donate 💖"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Footer Credit & System Information */}
        <div className="pt-3 border-t border-emerald-500/20 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
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
              className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
            >
              samkaren12
            </a>
          </div>
        </div>
      </div>

      {/* Visual Help & Friendly Tutorial Dialog on Login Screen */}
      {showHelpDialog && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-[#040805] border border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(16,185,129,0.3)] space-y-5 relative overflow-hidden animate-in fade-in zoom-in-95"
            dir={lang === "fa" ? "rtl" : "ltr"}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowHelpDialog(false)}
              className="absolute top-4 left-4 sm:left-6 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {lang === "fa" ? "راهنمای خودمونی و خیلی راحت ورود" : "Quick Friendly Login Guide"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === "fa" ? "چطور در چند ثانیه به پنل لاگین کنید؟" : "How to log in within seconds?"}
                </p>
              </div>
            </div>

            {/* Visual Guide Cards */}
            <div className="space-y-3.5 text-xs text-slate-300">
              {/* Card 1: Owner */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Crown className="w-4 h-4 text-emerald-400" />
                  <span>{lang === "fa" ? "۱. اگر مالک سرور هستید (Root Master):" : "1. If you are the Server Owner:"}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {lang === "fa"
                    ? "به عنوان مالک سرور، نام کاربری پیش‌فرض شما samkaren12 و رمز عبور پیش‌فرض نیز samkaren12 است. همچنین در ترمینال لینوکس با زدن دستور sudo selfandtabchi می‌توانید رمز مالک را عوض کنید یا دکمه «پر کردن سریع» را در فرم بزنید!"
                    : "As the server owner, the default credentials are username: samkaren12 and password: samkaren12. You can also customize them via sudo selfandtabchi CLI."}
                </p>
              </div>

              {/* Card 2: Customer */}
              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 space-y-2">
                <div className="flex items-center gap-2 text-teal-300 font-bold">
                  <Bot className="w-4 h-4 text-teal-400" />
                  <span>{lang === "fa" ? "۲. اگر خریدار / مشتری هستید (Client):" : "2. If you are a Customer:"}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {lang === "fa"
                    ? "وارد ربات تلگرام شماره خودتان شوید و روی دکمه «🔑 دریافت مشخصات ورود به پنل وب» کلیک کنید. ربات بلافاصله شماره تلفن و یک رمز عبور اختصاصی مانند SK-xxxxxx برای شما می‌فرستد. آن را در تب «پنل مشتریان» وارد کنید و وارد شوید!"
                    : "Go to your Telegram Bot and tap 'Get Web Panel Credentials'. The bot will send you your unique password (e.g. SK-xxxxxx). Then enter it in the Client Portal tab."}
                </p>
              </div>

              {/* Card 3: Security */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {lang === "fa"
                    ? "کلیه سشن‌ها و لاگین‌ها بر بستر امنیتی توکن رمزنگاری‌شده و پایش زنده دیمن محافظت می‌شوند."
                    : "All sessions are encrypted with token protection and 24/7 daemon monitoring."}
                </span>
              </div>
            </div>

            {/* Close Button Bottom */}
            <button
              onClick={() => setShowHelpDialog(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
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
