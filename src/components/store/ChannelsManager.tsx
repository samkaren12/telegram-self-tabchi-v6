import React, { useState } from "react";
import {
  Radio,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  Sparkles,
  Info,
} from "lucide-react";
import { StoreBotSettings, StoreMandatoryChannel } from "../../types";
import { Language } from "../../utils/i18n";
import { useConfirm } from "../ui/ConfirmProvider";

interface ChannelsManagerProps {
  settings: StoreBotSettings;
  lang: Language;
  onRefresh: () => void;
  showToast: (type: "success" | "error", text: string) => void;
}

export function ChannelsManager({
  settings,
  lang,
  onRefresh,
  showToast,
}: ChannelsManagerProps) {
  const { confirm } = useConfirm();

  // Mandatory Channels state
  const [forceJoinChannel, setForceJoinChannel] = useState(Boolean(settings.forceJoinChannel));
  const [channels, setChannels] = useState<StoreMandatoryChannel[]>(
    settings.mandatoryChannels && settings.mandatoryChannels.length > 0
      ? settings.mandatoryChannels
      : settings.channelUsername
      ? [
          {
            id: "default-channel",
            username: settings.channelUsername,
            title: "کانال اطلاع‌رسانی اصلی",
            isActive: true,
          },
        ]
      : []
  );

  // New channel form
  const [newUsername, setNewUsername] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newInviteLink, setNewInviteLink] = useState("");

  // Reports Channel state
  const [reportsEnabled, setReportsEnabled] = useState(Boolean(settings.reportsChannelEnabled));
  const [reportsChannelId, setReportsChannelId] = useState(settings.reportsChannelId || "");

  // Status & Testing
  const [testingChannel, setTestingChannel] = useState(false);
  const [testingReports, setTestingReports] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Add mandatory channel
  const handleAddChannel = () => {
    if (!newUsername.trim()) {
      showToast("error", "آیدی یا لینک کانال را وارد کنید.");
      return;
    }
    const cleanUser = newUsername.trim().startsWith("@") || newUsername.trim().startsWith("-100")
      ? newUsername.trim()
      : `@${newUsername.trim()}`;

    const newChan: StoreMandatoryChannel = {
      id: `chan-${Date.now()}`,
      username: cleanUser,
      title: newTitle.trim() || cleanUser,
      inviteLink: newInviteLink.trim() || undefined,
      isActive: true,
    };

    setChannels([...channels, newChan]);
    setNewUsername("");
    setNewTitle("");
    setNewInviteLink("");
    showToast("success", "کانال به لیست موقت اضافه شد. برای اعمال روی دکمه ذخیره کلیک کنید.");
  };

  const handleRemoveChannel = async (id: string) => {
    const ok = await confirm({
      title: "حذف کانال عضویت اجباری",
      message: "آیا مطمئن هستید که می‌خواهید این کانال را از لیست عضویت اجباری حذف کنید؟",
      confirmText: "بله، حذف کن",
      cancelText: "انصراف",
      danger: true,
    });
    if (!ok) return;

    setChannels(channels.filter((c) => c.id !== id));
  };

  const handleToggleChannel = (id: string) => {
    setChannels(
      channels.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  // Test Channel connection via API
  const handleTestChannel = async (channelId: string) => {
    setTestingChannel(true);
    try {
      const res = await fetch("/api/store-bot/channels/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: channelId }),
      });
      const json = await res.json();
      if (json.valid) {
        showToast(
          "success",
          `✅ کانال «${json.chatTitle}» تأیید شد. (اعضا: ${json.memberCount || "نامشخص"} نفر | وضعیت ادمین ربات: ${
            json.isBotAdmin ? "🟢 ادمین است" : "⚠️ ربات هنوز ادمین نیست"
          })`
        );
      } else {
        showToast("error", json.error || "خطا در برقراری ارتباط با کانال.");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setTestingChannel(false);
    }
  };

  // Test Send Purchase Report to Reports Channel
  const handleTestSendReport = async () => {
    if (!reportsChannelId.trim()) {
      showToast("error", "ابتدا آیدی یا چت‌آیدی کانال گزارشات را وارد و ذخیره کنید.");
      return;
    }

    setTestingReports(true);
    try {
      // First save reports config
      await fetch("/api/store-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportsChannelEnabled: true,
          reportsChannelId: reportsChannelId.trim(),
        }),
      });

      const res = await fetch("/api/store-bot/channels/test-report", {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "✅ پیام گزارش تستی با پوشش حریم خصوصی به کانال گزارشات ارسال گردید!");
      } else {
        showToast("error", json.message || "خطا در ارسال گزارش به کانال.");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setTestingReports(false);
    }
  };

  // Save All Settings
  const handleSaveAll = async () => {
    setSavingSettings(true);
    try {
      // 1. Save settings
      const settingsRes = await fetch("/api/store-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceJoinChannel,
          mandatoryChannels: channels,
          reportsChannelEnabled: reportsEnabled,
          reportsChannelId: reportsChannelId.trim(),
        }),
      });
      const settingsJson = await settingsRes.json();
      if (!settingsRes.ok || settingsJson.success === false) {
        throw new Error(settingsJson.message || "خطا در ذخیره تنظیمات کانال‌ها");
      }

      showToast("success", "تنظیمات کانال‌های عضویت اجباری و گزارشات خرید با موفقیت ذخیره گردید.");
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save action floating bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-cyan-950/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100">
              مدیریت کانال‌های عضویت اجباری و کانال گزارشات خرید
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            قفل عضویت اجباری در کانال‌ها برای ربات، و کانال ارسال خودکار گزارشات خرید با ماسک کردن و پوشش حریم خصوصی آیدی مشتریان را از اینجا مدیریت کنید.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={savingSettings}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
        >
          {savingSettings ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          ذخیره تمامی تغییرات کانال‌ها
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: MANDATORY CHANNEL JOIN */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-base font-bold text-slate-100">
                  قفل عضویت اجباری (Force Join)
                </h4>
                <p className="text-[11px] text-slate-400">
                  کاربر تا قبل از عضویت در این کانال‌ها امکان استفاده از ربات را نخواهد داشت
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setForceJoinChannel(!forceJoinChannel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                forceJoinChannel
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {forceJoinChannel ? "🟢 قفل فعال است" : "🔴 قفل خاموش است"}
            </button>
          </div>

          {/* Add Channel Form */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              افزودن کانال جدید به لیست عضویت اجباری
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  آیدی یا چت‌آیدی کانال *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="مثال: @my_channel یا -100123456789"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  عنوان نمایشی کانال
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: کانال رسمی اخبار سلف"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                لینک دعوت کانال (اختیاری برای کانال‌های خصوصی)
              </label>
              <input
                type="text"
                value={newInviteLink}
                onChange={(e) => setNewInviteLink(e.target.value)}
                placeholder="https://t.me/+AbCdEfGhIjKlMnOp"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono text-left"
              />
            </div>

            <button
              type="button"
              onClick={handleAddChannel}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن به لیست کانال‌ها
            </button>
          </div>

          {/* Channels List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300">
              کانال‌های ثبت‌شده ({channels.length} کانال):
            </span>

            {channels.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                هیچ کانالی در لیست ثبت نشده است. از فرم بالا کانال اضافه کنید.
              </div>
            ) : (
              channels.map((chan) => (
                <div
                  key={chan.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-200">
                        {chan.title || chan.username}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        {chan.username}
                      </span>
                    </div>
                    {chan.inviteLink && (
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        {chan.inviteLink}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTestChannel(chan.username)}
                      disabled={testingChannel}
                      className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[11px] font-semibold border border-cyan-500/30 transition-colors"
                      title="بررسی وضعیت دسترسی ربات در این کانال"
                    >
                      تست ربات
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleChannel(chan.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        chan.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {chan.isActive ? "فعال" : "خاموش"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveChannel(chan.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-300">
            <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <p>
              توجه: برای اینکه ربات بتواند عضویت کاربران را بررسی کند، باید ربات فروشگاه خود را در کانال‌های فوق عضو و به عنوان ادمین (Administrator) با دسترسی Invite Users اضافه فرمایید.
            </p>
          </div>
        </div>

        {/* SECTION 2: PURCHASE REPORTS CHANNEL */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-base font-bold text-slate-100">
                  کانال گزارشات خرید (Purchase Reports)
                </h4>
                <p className="text-[11px] text-slate-400">
                  ارسال آنی پیام تایید خرید به کانال با حفظ حریم خصوصی خریدار
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReportsEnabled(!reportsEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                reportsEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {reportsEnabled ? "🟢 ارسال گزارشات فعال" : "🔴 غیرفعال"}
            </button>
          </div>

          {/* Reports Channel Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                آیدی یا چت‌آیدی کانال گزارشات *
              </label>
              <input
                type="text"
                value={reportsChannelId}
                onChange={(e) => setReportsChannelId(e.target.value)}
                placeholder="مثال: @my_store_reports یا -100987654321"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                ربات را ادمین کانال فوق با دسترسی ارسال پیام (Post Messages) نمایید.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestSendReport}
              disabled={testingReports || !reportsChannelId}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {testingReports ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              ارسال پیام تست زنده به کانال گزارشات
            </button>
          </div>

          {/* Privacy Masking Live Preview */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              پیش‌نمایش ظاهر گزارش و پوشش حریم خصوصی (Privacy Masking)
            </span>

            <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs font-mono text-slate-300 space-y-1.5 shadow-inner leading-relaxed">
              <div className="text-cyan-400 font-bold font-sans">
                📢 گزارش ثبت خرید موفق جدید
              </div>
              <div className="text-slate-600">━━━━━━━━━━━━━━━━━━━━</div>
              <div>
                👤 <b>خریدار:</b> <code>علیرضا م***</code> (@al***ev)
              </div>
              <div>
                💎 <b>پکیج:</b> اکانت سلف زمان‌دار (۱ ماهه VIP)
              </div>
              <div>
                💰 <b>مبلغ پرداختی:</b> ۹۹,۰۰۰ تومان (1.5 USDT)
              </div>
              <div>
                💳 <b>روش پرداخت:</b> کارت به کارت شتاب
              </div>
              <div>
                ⏰ <b>زمان خرید:</b> ۱۴۰۵/۰۲/۱۴ - ساعت ۱۸:۳۲
              </div>
              <div className="text-slate-600">━━━━━━━━━━━━━━━━━━━━</div>
              <div className="text-emerald-400 font-sans text-[11px] italic">
                ✨ تحویل آنی و اتصال خودکار توسط ربات رسمی فروشگاه
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              * آیدی و شماره موبایل خریدار به صورت هوشمند ماسک می‌شود تا امنیت و محرمانگی هویت خریداران کاملاً حفظ گردد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
