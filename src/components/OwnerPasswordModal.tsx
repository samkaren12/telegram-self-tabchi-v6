import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Language } from "../utils/i18n";

interface OwnerPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onCredentialsUpdated?: (newUsername: string) => void;
}

export const OwnerPasswordModal: React.FC<OwnerPasswordModalProps> = ({
  isOpen,
  onClose,
  lang,
  onCredentialsUpdated,
}) => {
  const [currentUsername, setCurrentUsername] = useState("samkaren12");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchCurrentCredentials();
    }
  }, [isOpen]);

  const fetchCurrentCredentials = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/auth/owner-credentials");
      if (res.ok) {
        const data = await res.json();
        if (data.credentials?.username) {
          setCurrentUsername(data.credentials.username);
          setNewUsername(data.credentials.username);
        }
      }
    } catch (_) {
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError(lang === "fa" ? "لطفاً رمز عبور فعلی خود را وارد کنید." : "Please enter your current password.");
      return;
    }

    if (newPassword && newPassword.length < 5) {
      setError(lang === "fa" ? "رمز عبور جدید باید حداقل ۵ کاراکتر باشد." : "New password must be at least 5 characters.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError(lang === "fa" ? "رمز عبور جدید و تکرار آن یکسان نیستند." : "New password and confirmation do not match.");
      return;
    }

    if (newUsername.trim().length < 3) {
      setError(lang === "fa" ? "نام کاربری باید حداقل ۳ کاراکتر باشد." : "Username must be at least 3 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/owner-credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newUsername: newUsername.trim(),
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === "fa" ? "خطا در تغییر مشخصات" : "Failed to update credentials"));
      }

      setSuccess(
        lang === "fa"
          ? "مشخصات ورود مالک با موفقیت تغییر یافت و ذخیره شد!"
          : "Owner login credentials updated successfully!"
      );
      setCurrentUsername(data.username || newUsername.trim());
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update session storage username
      try {
        const rawSession = sessionStorage.getItem("hacker_v6_session");
        if (rawSession) {
          const sess = JSON.parse(rawSession);
          sess.username = data.username || newUsername.trim();
          sessionStorage.setItem("hacker_v6_session", JSON.stringify(sess));
        }
      } catch (_) {}

      if (onCredentialsUpdated) {
        onCredentialsUpdated(data.username || newUsername.trim());
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || (lang === "fa" ? "خطای ناشناخته در ارتباط با سرور" : "Server error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === "fa" ? "تغییر نام‌کاربری و رمز عبور مالک" : "Change Owner Credentials"}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === "fa"
                  ? "جهت جلوگیری از دسترسی دیگران به پنل مدیریت"
                  : "Prevent unauthorized access to the admin portal"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Username Info */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">
              {lang === "fa" ? "نام کاربری فعلی مالک:" : "Current Owner Username:"}
            </span>
            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {fetching ? "..." : currentUsername}
            </span>
          </div>

          {/* New Username Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === "fa" ? "نام کاربری جدید مالک:" : "New Owner Username:"}</span>
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. myadmin"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-all"
              required
            />
          </div>

          {/* Current Password Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === "fa" ? "رمز عبور فعلی مالک (جهت تایید هویت):" : "Current Password (for verification):"}</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز فعلی (پیش‌فرض: samkaren12)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Input */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "fa" ? "رمز عبور جدید مالک (اختیاری):" : "New Password (optional):"}</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۵ کاراکتر (در صورت خالی بودن بدون تغییر می‌ماند)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          {newPassword && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === "fa" ? "تکرار رمز عبور جدید:" : "Confirm New Password:"}</span>
              </label>
              <input
                type={showNewPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار دقیق رمز جدید"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-all"
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold transition-colors"
            >
              {lang === "fa" ? "انصراف" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === "fa" ? "در حال ذخیره..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{lang === "fa" ? "ذخیره مشخصات جدید" : "Save Credentials"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
