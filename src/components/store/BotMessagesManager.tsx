import React, { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Eye,
  Info,
  Smile,
  Copy,
  Code,
  Sliders,
} from "lucide-react";
import { StoreBotMessages } from "../../types";
import { Language } from "../../utils/i18n";

interface BotMessagesManagerProps {
  messages?: StoreBotMessages;
  welcomeText?: string;
  rulesText?: string;
  lang: Language;
  onRefresh: () => void;
  showToast: (type: "success" | "error", text: string) => void;
}

const MESSAGE_KEYS: Array<{
  key: keyof StoreBotMessages;
  title: string;
  description: string;
  defaultVal: string;
}> = [
  {
    key: "welcome",
    title: "پیام شروع و خوش‌آمدگویی (/start)",
    description: "اولین پیامی که کاربر با زدن استارت یا بازگشت به منوی اصلی می‌بیند.",
    defaultVal: "👋 درود! به فروشگاه رسمی اکانت‌های سلف هوشمند و تبچی خوش آمدید.\n\nجهت مشاهده تعرفه‌ها و ثبت سفارش، از دکمه‌های زیر استفاده نمایید:",
  },
  {
    key: "help",
    title: "پیام راهنمای خرید و کار با ربات",
    description: "توضیحات و راهنمای ثبت سفارش که در دکمه آموزش و راهنما ارسال می‌شود.",
    defaultVal: "📖 <b>راهنمای ربات فروشگاهی:</b>\n\n۱. اشتراک مورد نظر خود را انتخاب کنید.\n۲. روش پرداخت (کارت به کارت یا ارز دیجیتال) را انتخاب نمایید.\n۳. فیش واریز را ارسال کنید تا شماره شما فوراً فعال گردد.",
  },
  {
    key: "rules",
    title: "قوانین و شرایط استفاده",
    description: "قوانین و مقررات خرید که کاربران قبل یا بعد از خرید مشاهده می‌کنند.",
    defaultVal: "📜 <b>قوانین و شرایط خرید:</b>\n\n• پس از تایید فیش واریزی، فرایند اتصال شماره به صورت خودکار در ربات آغاز می‌شود.\n• هرگونه اسپم یا ارسال فیش فیک منجر به مسدودسازی حساب خواهد شد.",
  },
  {
    key: "cardPayment",
    title: "پیام راهنمای پرداخت کارت به کارت",
    description: "دستورالعمل واریز شتابی که همراه مشخصات شماره کارت فرستاده می‌شود.",
    defaultVal: "💳 <b>راهنمای پرداخت کارت به کارت:</b>\n\nمبلغ فاکتور را به شماره کارت مشخص شده واریز کرده و تصویر فیش یا شماره پیگیری را ارسال نمایید.",
  },
  {
    key: "cryptoPayment",
    title: "پیام راهنمای پرداخت ارزی و کریپتو",
    description: "دستورالعمل انتقال تتر، تون یا ترون و ارسال کد هش تراکنش TXID.",
    defaultVal: "🪙 <b>راهنمای پرداخت ارزی:</b>\n\nمعادل ارزی را به آدرس کیف پول واریز کرده و کد هش TXID را ارسال نمایید.",
  },
  {
    key: "orderSubmitted",
    title: "پیام ثبت موفق رسید پرداختی",
    description: "پیامی که بلافاصله بعد از ارسال تصویر فیش یا کد پیگیری برای مشتری می‌رود.",
    defaultVal: "⏳ <b>رسید شما با موفقیت ثبت شد!</b>\n\nفیش شما جهت بررسی برای مدیریت ارسال شد. به محض تأیید، پیام فعال‌سازی برای شما ارسال می‌گردد.",
  },
  {
    key: "orderApproved",
    title: "پیام تأیید سفارش و شروع اتصال اکانت",
    description: "پیامی که پس از تایید فیش توسط ادمین برای مشتری ارسال شده و درخواست شماره می‌کند.",
    defaultVal: "✅ <b>سفارش شما تایید شد!</b>\n\nاشتراک شما فعال گردید. اکنون شماره خود را ارسال نمایید تا به ربات متصل شود.",
  },
  {
    key: "orderRejected",
    title: "پیام رد فیش پرداختی",
    description: "پیام اعلام عدم تأیید فیش همراه با دلیل اعلام‌شده توسط ادمین.",
    defaultVal: "❌ <b>سفارش شما تایید نشد.</b>\n\nعلت رد: اطلاعات واریزی نامعتبر است. لطفاً با پشتیبانی در ارتباط باشید.",
  },
  {
    key: "forceJoinAlert",
    title: "هشدار عضویت اجباری در کانال",
    description: "پیامی که به کاربران غیرعضو در کانال‌های اجباری نمایش داده می‌شود.",
    defaultVal: "🔒 <b>عضویت در کانال الزامی است!</b>\n\nبرای استفاده از ربات، لطفاً ابتدا در کانال‌های زیر عضو شوید و سپس دکمه «تایید عضویت» را بزنید:",
  },
  {
    key: "support",
    title: "پیام پشتیبانی و ارتباط با مدیریت",
    description: "اطلاعات تماس با آیدی ادمین، کانال اطلاع‌رسانی و ساعات پاسخگویی.",
    defaultVal: "📞 <b>ارتباط با پشتیبانی:</b>\n\nجهت راهنمایی و حل هرگونه مشکل با آیدی پشتیبانی در ارتباط باشید.",
  },
];

export function BotMessagesManager({
  messages,
  welcomeText,
  rulesText,
  lang,
  onRefresh,
  showToast,
}: BotMessagesManagerProps) {
  const [selectedKey, setSelectedKey] = useState<keyof StoreBotMessages>("welcome");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<StoreBotMessages>({
    welcome: messages?.welcome || welcomeText || MESSAGE_KEYS[0].defaultVal,
    help: messages?.help || MESSAGE_KEYS[1].defaultVal,
    rules: messages?.rules || rulesText || MESSAGE_KEYS[2].defaultVal,
    cardPayment: messages?.cardPayment || MESSAGE_KEYS[3].defaultVal,
    cryptoPayment: messages?.cryptoPayment || MESSAGE_KEYS[4].defaultVal,
    orderSubmitted: messages?.orderSubmitted || MESSAGE_KEYS[5].defaultVal,
    orderApproved: messages?.orderApproved || MESSAGE_KEYS[6].defaultVal,
    orderRejected: messages?.orderRejected || MESSAGE_KEYS[7].defaultVal,
    forceJoinAlert: messages?.forceJoinAlert || MESSAGE_KEYS[8].defaultVal,
    support: messages?.support || MESSAGE_KEYS[9].defaultVal,
  });

  const activeDef = MESSAGE_KEYS.find((k) => k.key === selectedKey) || MESSAGE_KEYS[0];
  const currentVal = formData[selectedKey] || "";

  const handleChange = (val: string) => {
    setFormData({ ...formData, [selectedKey]: val });
  };

  const insertTag = (openTag: string, closeTag: string) => {
    const next = `${currentVal} ${openTag}متن${closeTag}`;
    handleChange(next);
  };

  const insertVariable = (varName: string) => {
    handleChange(`${currentVal} {${varName}}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/store-bot/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formData }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "خطا در ذخیره متون پیام‌ها");
      }

      // Also sync welcomeText and rulesText in main settings
      await fetch("/api/store-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcomeText: formData.welcome,
          rulesText: formData.rules,
        }),
      });

      showToast("success", "متون و قالب پیام‌های ربات با موفقیت ذخیره و در تلگرام اعمال شد.");
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-cyan-950/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100">
              ویرایشگر و زیباسازی متون ربات تلگرام
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            تمامی متون، پیام‌های خطا، اعلان‌های تایید فیش، راهنما و قوانین ربات را شخصی‌سازی کرده و از تگ‌های فرمت‌دهی HTML و ایموجی‌های پرمیوم استفاده کنید.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          ذخیره تمامی پیام‌های ربات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Message Types List */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-xl space-y-1.5 shadow-lg">
          <span className="text-xs font-bold text-slate-400 block px-3 py-2 border-b border-slate-800 mb-2">
            بخش‌های قابل ویرایش ربات:
          </span>

          {MESSAGE_KEYS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedKey(item.key)}
              className={`w-full p-3 rounded-xl text-right transition-all flex flex-col gap-0.5 border ${
                selectedKey === item.key
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-md"
                  : "bg-slate-950/40 border-transparent text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <span className="font-bold text-xs">{item.title}</span>
              <span className="text-[10px] text-slate-500 truncate">
                {item.description}
              </span>
            </button>
          ))}
        </div>

        {/* Right Side: Message Editor & Live Telegram Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editor Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  {activeDef.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {activeDef.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleChange(activeDef.defaultVal)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
              >
                بازنشانی به متن پیش‌فرض
              </button>
            </div>

            {/* Quick Tag Inserters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">تگ‌های HTML:</span>
              <button
                type="button"
                onClick={() => insertTag("<b>", "</b>")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700"
              >
                بولد (Bold)
              </button>
              <button
                type="button"
                onClick={() => insertTag("<i>", "</i>")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs italic text-slate-200 border border-slate-700"
              >
                ایتالیک (Italic)
              </button>
              <button
                type="button"
                onClick={() => insertTag("<code>", "</code>")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-400 border border-slate-700"
              >
                کد یک‌خطی (Code)
              </button>
              <button
                type="button"
                onClick={() => insertTag("<pre>", "</pre>")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-400 border border-slate-700"
              >
                باکس متنی (Pre)
              </button>
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={currentVal}
                onChange={(e) => handleChange(e.target.value)}
                rows={7}
                placeholder="متن پیام را وارد کنید..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-100 font-sans leading-relaxed focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            {/* Quick Variable Inserters */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">متغیرهای پویا:</span>
              {["orderId", "planTitle", "price", "username", "firstName", "phone"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-emerald-400 border border-emerald-500/30"
                >
                  {`{${v}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-lg space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              پیش‌نمایش زنده در چت تلگرام (Live Telegram Chat View)
            </span>

            {/* Simulated Telegram Chat Bubble */}
            <div className="p-4 rounded-2xl bg-[#17212b] border border-[#232e3c] max-w-lg text-xs text-slate-100 font-sans shadow-xl leading-relaxed whitespace-pre-wrap">
              <div
                dangerouslySetInnerHTML={{
                  __html: currentVal
                    ? currentVal
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/&lt;b&gt;/g, "<b>")
                        .replace(/&lt;\/b&gt;/g, "</b>")
                        .replace(/&lt;i&gt;/g, "<i>")
                        .replace(/&lt;\/i&gt;/g, "</i>")
                        .replace(/&lt;code&gt;/g, "<code style='background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px;'>")
                        .replace(/&lt;\/code&gt;/g, "</code>")
                        .replace(/&lt;pre&gt;/g, "<pre style='background:rgba(255,255,255,0.05);padding:6px;border-radius:6px;overflow-x:auto;'>")
                        .replace(/&lt;\/pre&gt;/g, "</pre>")
                    : "<i>(متن خالی است)</i>",
                }}
              />
              <div className="text-[10px] text-slate-500 text-left mt-2">
                {new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })} ✓✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
