import React, { useState } from "react";
import {
  Lock,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Crown,
  Users,
  Bot,
  Sparkles,
  HelpCircle,
  Phone,
  User,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { AuthSession } from "../types";

interface StartupLockModalProps {
  lang: Language;
  onUnlocked: (session: AuthSession) => void;
}

export const StartupLockModal: React.FC<StartupLockModalProps> = ({
  lang,
  onUnlocked,
}) => {
  const [role, setRole] = useState<"owner" | "customer">("owner");
  const [ownerUsername, setOwnerUsername] = useState("samkaren12");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [customerUsername, setCustomerUsername] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    const username = role === "owner" ? ownerUsername.trim() : customerUsername.trim();
    const password = role === "owner" ? ownerPassword.trim() : customerPassword.trim();

    if (!password) {
      setError(lang === "fa" ? "لطفاً رمز عبور را وارد نمایید." : "Please enter your password.");
      setVerifying(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username, password }),
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
              {lang === "fa" ? "ورود به پنل مدیریت تلگرام" : "Telegram Control Panel Login"}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 font-mono">
              v6 PRO
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {lang === "fa"
              ? "سیستم هوشمند احراز هویت دو مرحله‌ای مالک و مشتریان"
              : "Dual Authentication System for Owner and Customers"}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setRole("owner");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "owner"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>{lang === "fa" ? "ورود مالک اسکریپت" : "Owner Login"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("customer");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "customer"
                ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === "fa" ? "ورود مشتریان" : "Customer Login"}</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {role === "owner" ? (
            /* OWNER FORM */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === "fa" ? "نام کاربری مالک:" : "Owner Username:"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    placeholder="samkaren12"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === "fa" ? "رمز عبور مالک:" : "Owner Password:"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="samkaren12"
                    dir="ltr"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          ) : (
            /* CUSTOMER FORM */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === "fa" ? "شماره تلفن یا نام کاربری اکانت شما:" : "Your Phone or Username:"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerUsername}
                    onChange={(e) => setCustomerUsername(e.target.value)}
                    placeholder="+989123456789"
                    dir="ltr"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === "fa" ? "رمز عبور اختصاصی (دریافت از ربات):" : "Password (from Telegram Bot):"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="SK-xxxxxx"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              {/* Bot instructions for customers */}
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed flex items-start gap-2">
                <Bot className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  {lang === "fa" ? (
                    <>
                      💡 <b>راهنمای مشتریان:</b> رمز عبور را به صورت خودکار از ربات تلگرام اختصاصی شماره خود یا در پیام‌های ذخیره‌شده (Saved Messages) با ارسال دستور <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">/login</code> دریافت نمایید.
                    </>
                  ) : (
                    <>
                      💡 <b>Customer Guide:</b> Get your password automatically from your account's dedicated bot or by sending <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">/login</code> in Saved Messages.
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || (role === "owner" ? !ownerPassword : !customerPassword)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 transition-all active:scale-95 ${
              role === "owner"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20"
                : "bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-cyan-500/20"
            }`}
          >
            <span>{verifying ? "در حال احراز هویت..." : t.system.unlockBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Hint */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 font-mono">
            {role === "owner" ? (
              <>
                👑 {lang === "fa" ? "مالک اسکریپت:" : "Owner Creds:"}{" "}
                <span className="text-amber-400 font-bold">samkaren12</span> /{" "}
                <span className="text-amber-400 font-bold">samkaren12</span>
              </>
            ) : (
              <>
                🤖 {lang === "fa" ? "دریافت رمز مشتری با کامند:" : "Customer code cmd:"}{" "}
                <span className="text-cyan-400 font-bold">/login</span> {lang === "fa" ? "در تلگرام" : "in Telegram"}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
