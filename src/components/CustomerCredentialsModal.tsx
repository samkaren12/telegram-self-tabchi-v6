import React, { useState, useEffect } from "react";
import {
  KeyRound,
  X,
  Copy,
  Check,
  Save,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Language } from "../utils/i18n";
import { TelegramAccount, ClientCredentials } from "../types";

interface CustomerCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TelegramAccount | null;
  onSuccess: () => void;
  lang: Language;
}

export const CustomerCredentialsModal: React.FC<CustomerCredentialsModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess,
  lang,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (account) {
      setUsername(account.client_credentials?.username || account.phone);
      setPassword(account.client_credentials?.password || "");
      setFeedback(null);
      setCopied(false);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleCopy = () => {
    const credsText =
      `📱 شماره: ${account.phone}\n` +
      `👤 نام کاربری: ${username}\n` +
      `🔑 رمز عبور: ${password}\n` +
      `🌐 آدرس ورود: ${window.location.origin}`;
    navigator.clipboard.writeText(credsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save credentials");
      }

      account.client_credentials = data.credentials;
      setFeedback({
        type: "success",
        message: lang === "fa" ? "مشخصات ورود مشتری با موفقیت ذخیره گردید." : "Customer credentials updated!",
      });

      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Error saving credentials",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>{lang === "fa" ? "مشخصات ورود وب مشتری" : "Customer Web Login"}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">
                {account.phone} ({account.firstName || "User"})
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

        {/* Informative card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>{lang === "fa" ? "دریافت اتوماتیک از ربات تلگرام:" : "Automatic Bot Retrieval:"}</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {lang === "fa"
              ? "مشتری می‌تواند در ربات تلگرام اختصاصی شماره خود دکمه «🔑 دریافت مشخصات ورود به پنل وب» را لمس کرده یا دستور /login را بفرستد تا این مشخصات به صورت خودکار برایش ارسال شود."
              : "The customer can send /login to their dedicated Telegram bot to receive these credentials automatically."}
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === "fa" ? "نام کاربری مشتری (یا شماره تلفن):" : "Customer Username / Phone:"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dir="ltr"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white text-xs font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === "fa" ? "رمز عبور اختصاصی مشتری:" : "Customer Password:"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-amber-300 font-bold text-xs font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Copy Credentials"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copied ? (lang === "fa" ? "کپی شد" : "Copied") : (lang === "fa" ? "کپی" : "Copy")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            {lang === "fa" ? "انصراف" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !password.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "..." : lang === "fa" ? "ذخیره مشخصات مشتری" : "Save Credentials"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
