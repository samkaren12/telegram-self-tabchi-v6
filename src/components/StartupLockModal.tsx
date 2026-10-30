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
  Phone,
  User,
  Eye,
  EyeOff,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  X,
  Zap,
  Heart,
  Loader2,
  Copy,
  Plus,
  Trash2,
  Calendar,
  LogOut,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { AuthSession } from "../types";
import { DonateModal } from "./DonateModal";
import { LicenseKeyRecord, LicenseStatusData } from "./LicenseModal";

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
  const [role, setRole] = useState<"owner" | "customer" | "creator">(
    portalMode === "admin" ? "owner" : "customer"
  );
  const [ownerUsername, setOwnerUsername] = useState("samkaren12");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [customerUsername, setCustomerUsername] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");

  // Creator Portal state
  const [creatorUsername, setCreatorUsername] = useState("");
  const [creatorPassword, setCreatorPassword] = useState("");
  const [creatorAuthenticated, setCreatorAuthenticated] = useState(false);
  const [creatorKeys, setCreatorKeys] = useState<LicenseKeyRecord[]>([]);
  const [creatorLicenseStatus, setCreatorLicenseStatus] = useState<LicenseStatusData | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [genPlanType, setGenPlanType] = useState<"30" | "90" | "365" | "custom">("30");
  const [customDays, setCustomDays] = useState("60");
  const [genNote, setGenNote] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [latestGeneratedKey, setLatestGeneratedKey] = useState<LicenseKeyRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatorSuccessMsg, setCreatorSuccessMsg] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCustomerDeliveryText = (keyRecord: LicenseKeyRecord) => {
    return (
      `🔑 لایسنس اختصاصی اتصال نامحدود اکانت (+۱۰ شماره)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📌 کد لایسنس شما (یک‌بار مصرف):\n` +
      `${keyRecord.key}\n\n` +
      `⏱ مدت اعتبار: ${keyRecord.durationDays} روز کامل\n` +
      `🔒 نوع لایسنس: یک‌بار مصرف (پس از اولین ثبت در سرور سوزانده می‌شود)\n` +
      (keyRecord.note ? `👤 مشخصات: ${keyRecord.note}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📖 نحوه فعال‌سازی روی سرور:\n` +
      `وارد «پنل مالک سرور» خود شوید، روی دکمه طلایی «لایسنس» کلیک کرده و کد بالا را وارد نمایید تا بلافاصله به مدت ${keyRecord.durationDays} روز برایتان فعال گردد.\n` +
      `🆔 پشتیبانی سازنده: @samkarendev`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    setCreatorSuccessMsg(null);

    if (role === "creator") {
      const cleanUser = creatorUsername.trim();
      const cleanPass = creatorPassword.trim();
      if (!cleanUser || !cleanPass) {
        setError(
          lang === "fa"
            ? "لطفاً نام کاربری و رمز عبور اختصاصی را وارد نمایید."
            : "Please enter Creator username and password."
        );
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch("/api/license/creator/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUser, password: cleanPass }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(
            data.message ||
              (lang === "fa"
                ? "نام کاربری یا رمز عبور وارد شده نادرست است."
                : "Invalid Creator credentials.")
          );
        }
        setCreatorAuthenticated(true);
        setCreatorKeys(Array.isArray(data.keys) ? data.keys : []);
        if (data.licenseStatus) {
          setCreatorLicenseStatus(data.licenseStatus);
        }
        setCreatorSuccessMsg(data.message);
      } catch (err: any) {
        setError(err.message || "خطا در احراز هویت پنل سازنده سرور");
      } finally {
        setVerifying(false);
      }
      return;
    }

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

  const handleGenerateCreatorKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingKey(true);
    setError(null);
    setCreatorSuccessMsg(null);

    const days =
      genPlanType === "custom" ? Math.max(1, parseInt(customDays, 10) || 30) : parseInt(genPlanType, 10);

    try {
      const res = await fetch("/api/license/admin/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-creator-username": creatorUsername.trim(),
          "x-creator-password": creatorPassword.trim(),
        },
        body: JSON.stringify({
          durationDays: days,
          note: genNote.trim() || `لایسنس ${days} روزه سرور مشتری`,
          creatorUsername: creatorUsername.trim(),
          creatorPassword: creatorPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ساخت کد لایسنس");
      }
      setLatestGeneratedKey(data.key);
      if (Array.isArray(data.keys)) {
        setCreatorKeys(data.keys);
      }
      setGenNote("");
      setCreatorSuccessMsg(data.message);
    } catch (err: any) {
      setError(err.message || "خطا در تولید کلید لایسنس");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleDeleteCreatorKey = async (targetKey: string) => {
    try {
      const res = await fetch(`/api/license/admin/keys/${encodeURIComponent(targetKey)}`, {
        method: "DELETE",
        headers: {
          "x-creator-username": creatorUsername.trim(),
          "x-creator-password": creatorPassword.trim(),
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.keys)) {
        setCreatorKeys(data.keys);
        if (data.license) {
          setCreatorLicenseStatus(data.license);
        }
        if (latestGeneratedKey?.key === targetKey) {
          setLatestGeneratedKey(null);
        }
        setCreatorSuccessMsg(data.message);
      }
    } catch (_) {}
  };

  const handleToggleCreatorKeyStatus = async (targetKey: string) => {
    setTogglingKey(targetKey);
    setError(null);
    setCreatorSuccessMsg(null);
    try {
      const res = await fetch(`/api/license/admin/keys/${encodeURIComponent(targetKey)}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-creator-username": creatorUsername.trim(),
          "x-creator-password": creatorPassword.trim(),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در تغییر وضعیت لایسنس");
      }
      if (Array.isArray(data.keys)) {
        setCreatorKeys(data.keys);
      }
      if (data.license) {
        setCreatorLicenseStatus(data.license);
      }
      setCreatorSuccessMsg(data.message);
    } catch (err: any) {
      setError(err.message || "خطا در تغییر وضعیت کلید لایسنس");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleToggleServerLicense = async (enable: boolean, targetKey?: string, durationDays?: number) => {
    setTogglingKey("server-toggle");
    setError(null);
    setCreatorSuccessMsg(null);
    try {
      const res = await fetch("/api/license/admin/server-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-creator-username": creatorUsername.trim(),
          "x-creator-password": creatorPassword.trim(),
        },
        body: JSON.stringify({
          enable,
          targetKey,
          durationDays: durationDays || (genPlanType === "custom" ? parseInt(customDays, 10) || 30 : parseInt(genPlanType, 10)),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در تغییر وضعیت لایسنس سرور");
      }
      if (Array.isArray(data.keys)) {
        setCreatorKeys(data.keys);
      }
      if (data.license) {
        setCreatorLicenseStatus(data.license);
      }
      setCreatorSuccessMsg(data.message);
    } catch (err: any) {
      setError(err.message || "خطا در تغییر وضعیت لایسنس سرور");
    } finally {
      setTogglingKey(null);
    }
  };

  const fillQuickOwnerTest = () => {
    setOwnerUsername("samkaren12");
    setOwnerPassword("samkaren12");
    setError(null);
  };

  const isOwnerPortal = role === "owner";
  const isCustomerPortal = role === "customer";
  const isCreatorPortal = role === "creator";

  return (
    <div className="fixed inset-0 z-50 bg-[#060814]/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto cyber-matrix-grid">
      {/* Ambient Gradient Glows (Violet & Cyan) */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/12 rounded-full blur-[140px] pointer-events-none translate-x-1/2 translate-y-1/2" />
      <div className="fixed top-1/2 right-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div
        className={`w-full ${
          isCreatorPortal && creatorAuthenticated ? "max-w-xl" : "max-w-md"
        } bg-gradient-to-b from-[#0d1326]/90 to-[#090d1c]/95 border ${
          isCreatorPortal ? "border-amber-500/35" : "border-violet-500/20"
        } rounded-3xl p-5 sm:p-7 space-y-5 relative overflow-hidden backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_35px_-5px_rgba(139,92,246,0.15)] my-auto transition-all duration-300`}
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Subtle Ambient Top Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
            isCreatorPortal ? "via-amber-400 to-yellow-500" : "via-violet-500/60 to-cyan-400/60"
          }`}
        />

        {/* Header with Developer Avatar & Official Branding */}
        <div className="text-center space-y-3 relative z-10">
          <div className="relative inline-block mx-auto">
            {/* Spinning/Subtle Glowing Gradient Ring */}
            <div
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr ${
                isCreatorPortal
                  ? "from-amber-500 via-yellow-400 to-orange-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                  : "from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_0_30px_rgba(139,92,246,0.35)]"
              } p-[2px] group hover:scale-105 transition-all duration-300`}
            >
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
                <Crown className="w-8 h-8 text-amber-400 absolute -z-10" />
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
                href="https://t.me/samkarendev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono font-semibold text-amber-300 hover:text-white bg-amber-950/50 border border-amber-500/30 hover:border-amber-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all"
              >
                <span>SUPPORT: @samkarendev</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </a>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {isCreatorPortal
                ? (lang === "fa" ? "پنل سازنده سرور و صدور لایسنس" : "Server Creator & License Studio")
                : isOwnerPortal
                ? (lang === "fa" ? "ورود به پنل مدیریت مالک سرور" : "Master Server Owner Portal")
                : (lang === "fa" ? "ورود به پنل اختصاصی مشتریان" : "Customer Portal Login")}
            </h2>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {isCreatorPortal
                ? (lang === "fa"
                    ? "بخش خصوصی سازنده اسکریپت جهت صدور کد لایسنس زمان‌دار برای سرور مشتریان"
                    : "Private Script Creator portal for generating timed customer server licenses")
                : isOwnerPortal
                ? (lang === "fa"
                    ? "دسترسی مدیریت کامل به حساب‌ها، ربات فروشگاهی و اتوماسیون دائمی تلگرام"
                    : "Full management access to accounts, store bot, and permanent daemon")
                : (lang === "fa"
                    ? "مدیریت ساعت زنده روی پروفایل، منشی هوشمند و تبلیغات خودکار تبچی"
                    : "Manage your Self-time clock, Auto-reply, and Tabchi broadcaster")}
            </p>
          </div>
        </div>

        {/* Role Selector Tabs (3 Portals: Owner, Customer, Server Creator) */}
        <div className="grid grid-cols-3 p-1 bg-[#070b18] border border-violet-500/25 rounded-2xl gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setRole("owner");
              setError(null);
              try {
                window.history.pushState({}, "", "/admin");
              } catch (_) {}
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              isOwnerPortal
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(139,92,246,0.35)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-violet-950/30"
            }`}
          >
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === "fa" ? "پنل مالک سرور" : "Owner"}</span>
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
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              isCustomerPortal
                ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-[0_4px_16px_rgba(6,182,212,0.35)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-cyan-950/30"
            }`}
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === "fa" ? "پنل مشتریان" : "Client"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("creator");
              setError(null);
              setCreatorSuccessMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              isCreatorPortal
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.4)]"
                : "text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/30"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lang === "fa" ? "پنل سازنده سرور" : "Creator"}</span>
          </button>
        </div>

        {/* CREATOR PORTAL VIEW (WHEN AUTHENTICATED AS @Samkaren12) */}
        {isCreatorPortal && creatorAuthenticated ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Creator Status Bar */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/40 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    {lang === "fa" ? "استودیو اختصاصی صدور لایسنس سازنده" : "Creator License Studio"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === "fa"
                      ? "کدهای تولیدشده با امضای رمزنگاری روی سرور تمام مشتریان کار می‌کنند"
                      : "Signed keys work on any customer server"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreatorAuthenticated(false);
                  setCreatorPassword("");
                  setLatestGeneratedKey(null);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-[11px] flex items-center gap-1 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === "fa" ? "خروج" : "Logout"}</span>
              </button>
            </div>

            {creatorSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{creatorSuccessMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Direct Server License Status & Enable/Disable Control */}
            <div
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                creatorLicenseStatus?.isLicensed
                  ? "bg-emerald-950/30 border-emerald-500/40"
                  : "bg-slate-900/80 border-slate-700/80"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      creatorLicenseStatus?.isLicensed ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                    }`}
                  />
                  <span className={creatorLicenseStatus?.isLicensed ? "text-emerald-300" : "text-slate-200"}>
                    {creatorLicenseStatus?.isLicensed
                      ? (lang === "fa" ? "وضعیت لایسنس سرور فعلی: فعال (نامحدود)" : "Current Server License: Active")
                      : (lang === "fa" ? "وضعیت لایسنس سرور فعلی: غیرفعال (محدود به ۱۰ شماره)" : "Current Server License: Inactive")}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {creatorLicenseStatus?.isLicensed
                    ? `${creatorLicenseStatus.planTitle} • ${creatorLicenseStatus.daysRemaining} روز باقی‌مانده`
                    : "با یک کلیک می‌توانید لایسنس این سرور را مستقیماً فعال یا غیرفعال کنید."}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {creatorLicenseStatus?.isLicensed ? (
                  <button
                    type="button"
                    disabled={togglingKey === "server-toggle"}
                    onClick={() => handleToggleServerLicense(false)}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{lang === "fa" ? "غیرفعال کردن لایسنس" : "Disable License"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={togglingKey === "server-toggle"}
                    onClick={() => handleToggleServerLicense(true)}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{lang === "fa" ? "فعال‌سازی لایسنس سرور" : "Enable Server License"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Key Generation Form */}
            <form
              onSubmit={handleGenerateCreatorKey}
              className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3.5"
            >
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                <span>{lang === "fa" ? "ساخت کد لایسنس جدید برای مشتری:" : "Generate New Customer License Key:"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    {lang === "fa" ? "انتخاب مدت زمان لایسنس:" : "License Duration:"}
                  </label>
                  <select
                    value={genPlanType}
                    onChange={(e) => setGenPlanType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="30">۱ ماهه (۳۰ روزه — ۱.۲ تون / ۲۶ ترون)</option>
                    <option value="90">۳ ماهه (۹۰ روزه — ۳.۶ تون / ۷۸ ترون)</option>
                    <option value="365">۱ ساله VIP (۳۶۵ روزه — ۱۴.۴ تون / ۳۱۲ ترون)</option>
                    <option value="custom">تعداد روز دلخواه (سفارشی)</option>
                  </select>
                </div>

                {genPlanType === "custom" ? (
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      {lang === "fa" ? "تعداد روز اعتبار دلخواه:" : "Custom Days:"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      dir="ltr"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-amber-300 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">
                      {lang === "fa" ? "نام مشتری یا آیدی تلگرام (اختیاری):" : "Customer Note / Telegram ID:"}
                    </label>
                    <input
                      type="text"
                      value={genNote}
                      onChange={(e) => setGenNote(e.target.value)}
                      placeholder="مثلاً: @customer_id یا سرور اول"
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {genPlanType === "custom" && (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    {lang === "fa" ? "نام مشتری یا آیدی تلگرام (اختیاری):" : "Customer Note / Telegram ID:"}
                  </label>
                  <input
                    type="text"
                    value={genNote}
                    onChange={(e) => setGenNote(e.target.value)}
                    placeholder="مثلاً: @customer_id یا سرور اول"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={generatingKey}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {generatingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{lang === "fa" ? "ساخت و تولید کد لایسنس جدید" : "Generate License Key"}</span>
              </button>
            </form>

            {/* Newly Generated Key Highlight Card */}
            {latestGeneratedKey && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-amber-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {lang === "fa"
                      ? `کد لایسنس ${latestGeneratedKey.durationDays} روزه آماده تحویل به مشتری:`
                      : `Generated ${latestGeneratedKey.durationDays}-Day Key:`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {latestGeneratedKey.durationDays} روز اعتبار
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-sm sm:text-base font-extrabold text-amber-300 text-center tracking-widest select-all dir-ltr">
                  {latestGeneratedKey.key}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(latestGeneratedKey.key, "latest-key")}
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedId === "latest-key" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{lang === "fa" ? "کد لایسنس کپی شد!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>{lang === "fa" ? "کپی کد لایسنس" : "Copy Key Only"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(formatCustomerDeliveryText(latestGeneratedKey), "latest-full")
                    }
                    className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedId === "latest-full" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{lang === "fa" ? "پیام کامل کپی شد!" : "Full Msg Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-400" />
                        <span>{lang === "fa" ? "کپی با متن راهنمای مشتری" : "Copy with Instructions"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* List of All Generated Keys with Enable / Disable Controls */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {lang === "fa"
                    ? `مدیریت، فعال و غیرفعال‌سازی لایسنس‌های مشتریان (${creatorKeys.length}):`
                    : "Manage Customer Licenses:"}
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {creatorKeys.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-3">
                    {lang === "fa" ? "هنوز کلیدی تولید نشده است." : "No keys generated yet."}
                  </p>
                ) : (
                  creatorKeys.map((k) => {
                    const isDisabled = Boolean(k.isDisabled);
                    return (
                      <div
                        key={k.key}
                        className={`p-3 rounded-xl bg-slate-950 border ${
                          isDisabled
                            ? "border-rose-500/40 opacity-80"
                            : k.isUsed
                            ? "border-emerald-500/35"
                            : "border-slate-800"
                        } flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="font-mono font-bold flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`select-all dir-ltr ${
                                isDisabled ? "line-through text-rose-400" : "text-amber-300"
                              }`}
                            >
                              {k.key}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-sans">
                              {k.durationDays} روزه
                            </span>
                            {isDisabled ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-sans">
                                غیرفعال (مسدود)
                              </span>
                            ) : k.isUsed ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans">
                                فعال‌شده روی سرور
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans">
                                آماده تحویل
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {k.note || "بدون یادداشت"} •{" "}
                            {new Date(k.createdAt).toLocaleDateString("fa-IR")}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {/* Enable / Disable Key Button */}
                          <button
                            type="button"
                            disabled={togglingKey === k.key}
                            onClick={() => handleToggleCreatorKeyStatus(k.key)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
                              isDisabled
                                ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300"
                                : "bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300"
                            }`}
                            title={isDisabled ? "فعال کردن مجدد لایسنس" : "غیرفعال کردن لایسنس"}
                          >
                            {togglingKey === k.key ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isDisabled ? (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span>{isDisabled ? "فعال کردن" : "غیرفعال کردن"}</span>
                          </button>

                          {/* Activate directly on this server */}
                          {(!k.isUsed || isDisabled) && (
                            <button
                              type="button"
                              onClick={() => handleToggleServerLicense(true, k.key, k.durationDays)}
                              className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-[11px] transition cursor-pointer"
                              title="فعال‌سازی مستقیم این لایسنس روی همین سرور"
                            >
                              اعمال روی سرور
                            </button>
                          )}

                          {/* Copy Key */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(k.key, `k-${k.key}`)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                            title="کپی کد لایسنس"
                          >
                            {copiedId === `k-${k.key}` ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Key */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCreatorKey(k.key)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="حذف کلید"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* LOGIN FORMS FOR OWNER, CUSTOMER, OR CREATOR */
          <form onSubmit={handleSubmit} className="space-y-4">
            {isCreatorPortal ? (
              /* CREATOR LOGIN FORM (PRIVATE - NO CREDENTIAL HINTS SHOWN) */
              <div className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-amber-950/25 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    {lang === "fa" ? (
                      <>
                        این بخش <b>کاملاً خصوصی و منحصراً مخصوص سازنده اصلی اسکریپت</b> است. دسترسی بدون احراز هویت اختصاصی امکان‌پذیر نمی‌باشد.
                      </>
                    ) : (
                      <>
                        Private <b>Script Creator Portal</b>. Authorized access only.
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1.5">
                    {lang === "fa" ? "نام کاربری سازنده سرور:" : "Creator Username:"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={creatorUsername}
                      onChange={(e) => setCreatorUsername(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="off"
                      dir="ltr"
                      autoFocus
                      className="w-full saas-input rounded-xl px-4 py-2.5 pl-10 text-sm font-mono text-amber-200 placeholder-slate-600 focus:border-amber-500 transition-all"
                    />
                    <User className="w-4 h-4 text-amber-400 absolute left-3 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-amber-300 mb-1.5">
                    {lang === "fa" ? "رمز عبور سازنده سرور:" : "Creator Password:"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={creatorPassword}
                      onChange={(e) => setCreatorPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="off"
                      dir="ltr"
                      className="w-full saas-input rounded-xl pl-10 pr-10 py-2.5 text-sm font-mono text-amber-200 placeholder-slate-600 focus:border-amber-500 transition-all"
                    />
                    <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-3.5 pointer-events-none" />
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
            ) : isOwnerPortal ? (
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
                disabled={
                  verifying ||
                  (isCreatorPortal
                    ? !creatorUsername || !creatorPassword
                    : isOwnerPortal
                    ? !ownerPassword
                    : !customerPassword)
                }
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm ${
                  isCreatorPortal
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/25"
                    : "text-white saas-btn-primary"
                } disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer`}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === "fa" ? "در حال احراز هویت امنیتی..." : "Authenticating..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isCreatorPortal
                        ? (lang === "fa" ? "ورود به پنل سازنده سرور و ساخت لایسنس" : "Sign In to Creator Studio")
                        : isOwnerPortal
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
        )}

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
                    ? "نام کاربری پیش‌فرض samkaren12 و رمز عبور پیش‌فرض نیز samkaren12 است. برای اتصال بیش از ۱۰ شماره در پنل مالک، کد لایسنس دریافت‌شده از سازنده را در بخش لایسنس وارد نمایید."
                    : "The default credentials are username: samkaren12 and password: samkaren12."}
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
