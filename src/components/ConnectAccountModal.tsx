import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Copy,
  Terminal,
  Send,
  HelpCircle,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount } from "../types";

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onAccountConnected: (account: TelegramAccount) => void;
}

type AuthStep = "phone" | "code" | "2fa";
type ActiveTab = "phone" | "session";

const createDefaultFeatures = () => ({
  self_time: { active: true, format: "HH:mm", font_style: "bold" as const, original_last_name: null },
  auto_reply: { active: false, messages: [], delay_seconds: 1 },
  font: {
    active: false,
    style: "bold" as const,
    scopes: {
      self_time: true,
      manual_messages: true,
      auto_reply: true,
      mandatory_join: true,
      tabchi: true,
      remote_ui: false,
    },
  },
  tabchi: {
    active: false,
    message: "",
    interval_seconds: 4,
    repeat_rounds: 3,
    repeat_infinite: false,
    total_sent: 0,
    total_failed: 0,
    status: "idle" as const,
    target_mode: "all" as const,
    targets: [] as string[],
  },
  mandatory_join: { active: false, channels: [] },
  tools: { calculator_active: true, market_active: true },
  broadcast: {
    active: false,
    message: "",
    interval_seconds: 20,
    max_recipients: 50,
    status: "idle" as const,
    total_sent: 0,
    recipients: {},
  },
  keep_alive: true,
});

export const ConnectAccountModal: React.FC<ConnectAccountModalProps> = ({
  isOpen,
  onClose,
  lang,
  onAccountConnected,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<ActiveTab>("phone");
  const [step, setStep] = useState<AuthStep>("phone");

  // Step 1: Phone
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showAdvancedApi, setShowAdvancedApi] = useState(false);
  const [customApiId, setCustomApiId] = useState("");
  const [customApiHash, setCustomApiHash] = useState("");

  // Step 2: Code
  const [sessionId, setSessionId] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [isCodeViaApp, setIsCodeViaApp] = useState(true);
  const [resendTimer, setResendTimer] = useState(60);

  // Step 3: 2FA
  const [twoFaPassword, setTwoFaPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFaHint, setTwoFaHint] = useState("");

  // Tab 2: StringSession
  const [sessionString, setSessionString] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "code" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // Reset modal state
  const handleClose = () => {
    setStep("phone");
    setPhoneNumber("");
    setPhoneCode("");
    setTwoFaPassword("");
    setSessionId("");
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  // Step 1: Send verification code to phone
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      setError(lang === "fa" ? "لطفاً شماره تلفن را وارد کنید." : "Please enter phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telegram/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          apiId: customApiId ? Number(customApiId) : undefined,
          apiHash: customApiHash ? customApiHash.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در ارسال کد تایید.");
      }

      setSessionId(data.sessionId);
      setIsCodeViaApp(Boolean(data.isCodeViaApp));
      setResendTimer(data.timeout || 60);
      setStep("code");
      setSuccessMsg(
        data.message ||
          (lang === "fa"
            ? `کد تایید ارسال شد (${data.isCodeViaApp ? "برنامه تلگرام" : "پیامک"}).`
            : "Verification code sent.")
      );
    } catch (err: any) {
      setError(err.message || "خطا در ارتباط با سرور تلگرام.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanCode = phoneCode.trim();
    if (!cleanCode) {
      setError(lang === "fa" ? "لطفاً کد تایید ۵ رقمی را وارد کنید." : "Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telegram/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          phoneCode: cleanCode,
        }),
      });

      const data = await res.json();

      if (data.requires2FA) {
        // Two-Step Verification is active on this account!
        setTwoFaHint(data.hint || "");
        setStep("2fa");
        setSuccessMsg(data.message || (lang === "fa" ? "رمز دو مرحله‌ای لازم است." : "2FA password required."));
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "کد تایید نامعتبر است.");
      }

      // Login Complete!
      setSuccessMsg(lang === "fa" ? "حساب با موفقیت متصل شد!" : "Account connected successfully!");
      if (data.user) {
        onAccountConnected({
          phone: data.user.phone,
          userId: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          username: data.user.username,
          sessionString: data.sessionString,
          connectedAt: new Date().toISOString(),
          isOnline: true,
          features: createDefaultFeatures(),
        });
      }

      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      setError(err.message || "خطا در بررسی کد تایید.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify 2FA password
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!twoFaPassword.trim()) {
      setError(lang === "fa" ? "لطفاً رمز دو مرحله‌ای را وارد کنید." : "Please enter your 2FA password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telegram/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          password: twoFaPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "رمز دو مرحله‌ای اشتباه است.");
      }

      setSuccessMsg(lang === "fa" ? "تایید دو مرحله‌ای موفقیت‌آمیز بود! حساب متصل شد." : "2FA verified! Connected.");
      if (data.user) {
        onAccountConnected({
          phone: data.user.phone,
          userId: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          username: data.user.username,
          sessionString: data.sessionString,
          connectedAt: new Date().toISOString(),
          isOnline: true,
          features: createDefaultFeatures(),
        });
      }

      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      setError(err.message || "خطا در تایید رمز دو مرحله‌ای.");
    } finally {
      setLoading(false);
    }
  };

  // Tab 2: Direct session import
  const handleImportSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!sessionString.trim()) {
      setError(lang === "fa" ? "لطفاً رشته سشن را وارد کنید." : "Please paste session string.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/telegram/auth/import-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionString: sessionString.trim(),
          apiId: customApiId ? Number(customApiId) : undefined,
          apiHash: customApiHash ? customApiHash.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "خطا در اتصال به سشن.");
      }

      setSuccessMsg(lang === "fa" ? "سشن با موفقیت متصل گردید!" : "Session connected successfully!");
      if (data.user) {
        onAccountConnected({
          phone: data.user.phone,
          userId: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          username: data.user.username,
          sessionString: data.sessionString,
          connectedAt: new Date().toISOString(),
          isOnline: true,
          features: createDefaultFeatures(),
        });
      }

      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      setError(err.message || "خطا در بررسی سشن تلگرام.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                {t.authModal.title}
              </h3>
              <p className="text-xs text-slate-400">
                {step === "phone"
                  ? lang === "fa"
                    ? "ارسال کد تایید تلگرام"
                    : "Request MTProto Login Code"
                  : step === "code"
                  ? lang === "fa"
                    ? "ورود کد دریافتی"
                    : "Enter Verification Code"
                  : lang === "fa"
                  ? "رمز عبور دو مرحله‌ای (2FA)"
                  : "Two-Step Verification"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers (only in Step 1) */}
        {step === "phone" && (
          <div className="flex border-b border-slate-800/80 bg-slate-950/30 p-1">
            <button
              onClick={() => setActiveTab("phone")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "phone"
                  ? "bg-slate-800 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.authModal.phoneTab}
            </button>
            <button
              onClick={() => setActiveTab("session")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "session"
                  ? "bg-slate-800 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.authModal.sessionTab}
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* TAB 1: PHONE NUMBER LOGIN */}
          {activeTab === "phone" && (
            <>
              {/* STEP 1: PHONE INPUT */}
              {step === "phone" && (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t.authModal.phoneLabel}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={t.authModal.phonePlaceholder}
                        dir="ltr"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-center tracking-wider"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                      {t.authModal.phoneHelp}
                    </p>
                  </div>

                  {/* Advanced API ID / API Hash toggle */}
                  <div className="border-t border-slate-800/80 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedApi(!showAdvancedApi)}
                      className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        {t.authModal.advancedApi}
                      </span>
                      {showAdvancedApi ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showAdvancedApi && (
                      <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                        <p className="text-[11px] text-slate-400">
                          {t.authModal.apiHelp}
                        </p>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            {t.authModal.apiIdLabel}
                          </label>
                          <input
                            type="text"
                            value={customApiId}
                            onChange={(e) => setCustomApiId(e.target.value)}
                            placeholder="2496 (Telegram Android Default)"
                            dir="ltr"
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            {t.authModal.apiHashLabel}
                          </label>
                          <input
                            type="text"
                            value={customApiHash}
                            onChange={(e) => setCustomApiHash(e.target.value)}
                            placeholder="8da85b0d5bfe62527e5b244c209159c3"
                            dir="ltr"
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-98"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.authModal.sendingCode}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t.authModal.sendCodeBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFICATION CODE INPUT */}
              {step === "code" && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  {/* Delivery notification box */}
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm flex items-start gap-2.5">
                    <Send className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                    <div>
                      <p className="font-semibold text-slate-100 mb-0.5">
                        {isCodeViaApp ? t.authModal.codeSentToApp : t.authModal.codeSentToSms}
                      </p>
                      <p className="text-xs text-slate-400 font-mono" dir="ltr">
                        {phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t.authModal.codeLabel}
                    </label>
                    <input
                      type="text"
                      maxLength={7}
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder={t.authModal.codePlaceholder}
                      dir="ltr"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 font-mono text-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-center tracking-[0.3em]"
                      autoFocus
                    />
                  </div>

                  {/* Resend button & timer */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setPhoneCode("");
                      }}
                      className="text-cyan-400 hover:underline"
                    >
                      {lang === "fa" ? "ویرایش شماره" : "Change number"}
                    </button>

                    {resendTimer > 0 ? (
                      <span className="font-mono">
                        {t.authModal.resendIn} {resendTimer} {t.authModal.seconds}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendCode}
                        className="text-cyan-400 hover:underline font-semibold"
                      >
                        {t.authModal.resendCode}
                      </button>
                    )}
                  </div>

                  {/* Verify button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-98"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.authModal.verifying}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t.authModal.verifyBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: 2FA PASSWORD INPUT */}
              {step === "2fa" && (
                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-100 mb-0.5">
                        {t.authModal.twoFaTitle}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {t.authModal.twoFaDesc}
                      </p>
                      {twoFaHint && (
                        <p className="text-xs text-amber-400/90 font-medium mt-1">
                          {t.authModal.twoFaHint} <span className="font-mono">{twoFaHint}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {t.authModal.passwordLabel}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={twoFaPassword}
                        onChange={(e) => setTwoFaPassword(e.target.value)}
                        placeholder={t.authModal.passwordPlaceholder}
                        dir="ltr"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Verify 2FA button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-98"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.authModal.verifying2Fa}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>{t.authModal.verify2FaBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* TAB 2: STRING SESSION IMPORT */}
          {activeTab === "session" && (
            <form onSubmit={handleImportSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.authModal.sessionLabel}
                </label>
                <textarea
                  rows={4}
                  value={sessionString}
                  onChange={(e) => setSessionString(e.target.value)}
                  placeholder={t.authModal.sessionPlaceholder}
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {lang === "fa"
                    ? "می‌توانید رشته نشست تولید شده توسط Telethon یا GramJS را مستقیماً اینجا جای‌گذاری نمایید."
                    : "Paste any valid StringSession string generated via Telethon or GramJS."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === "fa" ? "درحال اتصال..." : "Connecting..."}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{t.authModal.importSessionBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/40 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>MTProto DC Gateway: 24/7 Online</span>
          <span>Security: End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
};
