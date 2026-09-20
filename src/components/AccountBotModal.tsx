import React, { useState, useEffect } from "react";
import {
  Bot,
  X,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Power,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Key,
} from "lucide-react";
import { Language } from "../utils/i18n";
import { TelegramAccount, AccountBotConfig } from "../types";

interface AccountBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: TelegramAccount | null;
  onSuccess: () => void;
  lang: Language;
}

export const AccountBotModal: React.FC<AccountBotModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess,
  lang,
}) => {
  const [botToken, setBotToken] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"connected" | "disconnected" | "error">("disconnected");
  const [botUsername, setBotUsername] = useState<string | undefined>(undefined);
  const [botFirstName, setBotFirstName] = useState<string | undefined>(undefined);

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (account) {
      setBotToken(account.bot?.bot_token || "");
      setEnabled(Boolean(account.bot?.enabled));
      setStatus(account.bot?.status || "disconnected");
      setBotUsername(account.bot?.bot_username);
      setBotFirstName(account.bot?.bot_first_name);
      setFeedback(null);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleTestToken = async () => {
    if (!botToken.trim()) {
      setFeedback({
        type: "error",
        message: lang === "fa" ? "لطفاً توکن ربات تلگرام را وارد فرمایید." : "Please enter a Telegram bot token.",
      });
      return;
    }

    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/bot/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: botToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (lang === "fa" ? "توکن واردشده نامعتبر است." : "Invalid bot token."));
      }

      setBotUsername(data.bot_username);
      setBotFirstName(data.bot_first_name);
      setFeedback({
        type: "success",
        message:
          lang === "fa"
            ? `ربات تایید شد: @${data.bot_username} (${data.bot_first_name})`
            : `Bot verified: @${data.bot_username} (${data.bot_first_name})`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || (lang === "fa" ? "خطا در بررسی توکن ربات" : "Bot verification failed"),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/bot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: botToken.trim(),
          enabled,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save account bot config");
      }

      const b: AccountBotConfig = data.bot;
      account.bot = b;
      setStatus(b.status || "disconnected");
      setBotUsername(b.bot_username);
      setBotFirstName(b.bot_first_name);

      setFeedback({
        type: "success",
        message:
          lang === "fa"
            ? `تنظیمات ربات اختصاصی شماره ${account.phone} با موفقیت ذخیره و فعال شد!`
            : `Dedicated bot for ${account.phone} successfully updated!`,
      });

      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save bot settings",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>{lang === "fa" ? "ربات تلگرام اختصاصی شماره" : "Dedicated Telegram Bot"}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  {account.phone}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === "fa"
                  ? "کنترل ماژول‌های سلف و تبچی با کلیدهای شیشه‌ای رنگی Aiogram در چت تلگرام"
                  : "Control self and tabchi with Aiogram color-coded inline buttons in Telegram"}
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

        {/* Current status pill */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                status === "connected" && enabled
                  ? "bg-emerald-400 animate-ping"
                  : "bg-slate-600"
              }`}
            ></span>
            <span className="text-xs font-semibold text-slate-200">
              {lang === "fa" ? "وضعیت ربات این شماره:" : "Bot Status:"}
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                status === "connected" && enabled
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {status === "connected" && enabled
                ? lang === "fa"
                  ? "متصل و فعال 🟢"
                  : "Active 🟢"
                : lang === "fa"
                ? "غیرفعال ⚪"
                : "Disabled ⚪"}
            </span>
          </div>

          {botUsername && (
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 font-semibold"
            >
              <span>@{botUsername}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {lang === "fa" ? "توکن ربات تلگرام اختصاصی (از BotFather@):" : "Telegram Bot Token (from @BotFather):"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="1234567890:AAH_xxx..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                dir="ltr"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs font-mono placeholder:text-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={handleTestToken}
                disabled={testing || !botToken.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {testing ? "..." : lang === "fa" ? "تست توکن ⚡" : "Test Token"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === "fa"
                ? "هر شماره تلفن می‌تواند ربات تلگرام اختصاصی جداگانه داشته باشد تا مشتری از داخل تلگرام خود آن را استارت کند."
                : "Each phone number can have its own Telegram Bot for user remote control."}
            </p>
          </div>

          {/* Active switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">
                {lang === "fa" ? "فعال‌سازی سرویس ربات اختصاصی شماره" : "Enable Dedicated Bot Polling"}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === "fa"
                  ? "با فعال‌سازی، ربات به صورت دائمی به دستورات تلگرام پاسخ می‌دهد."
                  : "Bot worker will listen to updates and send Aiogram interactive buttons."}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Aiogram Color-Coded Buttons Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === "fa" ? "پیش‌نمایش کلیدهای رنگی Aiogram در تلگرام:" : "Aiogram Color-Coded Buttons Preview:"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold pt-1">
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-center flex items-center justify-center gap-1">
                <span>🟢</span>
                <span>روشن کردن ساعت سلف</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-center flex items-center justify-center gap-1">
                <span>🟣</span>
                <span>شروع ارسال تبچی</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-center flex items-center justify-center gap-1">
                <span>🔴</span>
                <span>توقف منشی / تبچی</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-center flex items-center justify-center gap-1">
                <span>🟡</span>
                <span>روزشمار اشتراک</span>
              </div>
              <div className="col-span-2 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-center flex items-center justify-center gap-1 font-mono">
                <span>🔑</span>
                <span>دریافت مشخصات ورود به پنل وب</span>
              </div>
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

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            {lang === "fa" ? "بستن" : "Close"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saving ? "..." : lang === "fa" ? "ذخیره و راه‌اندازی ربات شماره 🚀" : "Save & Start Bot"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
