import React, { useState } from "react";
import {
  X,
  Sparkles,
  HelpCircle,
  Phone,
  Clock,
  Radio,
  ShoppingBag,
  Terminal,
  ShieldCheck,
  Send,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  Globe,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Language } from "../utils/i18n";

export type HelpSectionId =
  | "accounts"
  | "self"
  | "tabchi"
  | "store"
  | "system"
  | "ssl"
  | "broadcast";

interface VisualHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialSection?: HelpSectionId;
}

export const VisualHelpModal: React.FC<VisualHelpModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialSection = "accounts",
}) => {
  const [activeSection, setActiveSection] = useState<HelpSectionId>(initialSection);

  // Sync initialSection whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const sections: {
    id: HelpSectionId;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    borderColor: string;
    badge: string;
  }[] = [
    {
      id: "accounts",
      title: "اتصال شماره و اکانت‌ها",
      subtitle: "لاگین MTProto و کد ۵ رقمی",
      icon: Phone,
      color: "text-emerald-400 bg-emerald-500/10",
      borderColor: "border-emerald-500/40",
      badge: "گام ۱: ورود",
    },
    {
      id: "self",
      title: "سلف و منشی هوشمند",
      subtitle: "ساعت روی نام، فونت، نرخ طلا/ارز",
      icon: Clock,
      color: "text-emerald-400 bg-emerald-500/10",
      borderColor: "border-emerald-500/40",
      badge: "دستیار اکانت",
    },
    {
      id: "tabchi",
      title: "تبچی و ارسال انبوه گروهی",
      subtitle: "ارسال ۲۴ ساعته با آنتی‌فلود",
      icon: Radio,
      color: "text-rose-400 bg-rose-500/10",
      borderColor: "border-rose-500/40",
      badge: "تبلیغات چرخه‌ای",
    },
    {
      id: "store",
      title: "ربات فروشگاهی و دکمه رنگی",
      subtitle: "فروش کانفیگ و پلن با ۷ تم رنگی",
      icon: ShoppingBag,
      color: "text-emerald-400 bg-emerald-500/10",
      borderColor: "border-emerald-500/40",
      badge: "کسب درآمد",
    },
    {
      id: "system",
      title: "ترمینال سرور و sudo selfandtabchi",
      subtitle: "منوی عددی ۱ تا ۹ لینوکس",
      icon: Terminal,
      color: "text-rose-400 bg-rose-500/10",
      borderColor: "border-rose-500/40",
      badge: "کنترل سرور",
    },
    {
      id: "ssl",
      title: "دامنه و گواهی امنیتی SSL",
      subtitle: "اتصال دامنه و HTTPS رایگان",
      icon: Globe,
      color: "text-emerald-400 bg-emerald-500/10",
      borderColor: "border-emerald-500/40",
      badge: "امنیت HTTPS",
    },
    {
      id: "broadcast",
      title: "ارسال همگانی پی‌وی (PM)",
      subtitle: "اطلاع‌رسانی به چت‌های خصوصی",
      icon: Send,
      color: "text-rose-400 bg-rose-500/10",
      borderColor: "border-rose-500/40",
      badge: "پی‌وی کست",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-gradient-to-br from-[#020604] via-[#051109] to-[#0a0204] border-2 border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        dir="rtl"
      >
        {/* Top Header with Cyber Glow */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-500/30 bg-black/60 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-emerald-500/15 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-rose-500/15 to-transparent pointer-events-none"></div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  راهنمای تصویری و خودمونی بخش‌ها
                </h3>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  آموزش گام‌به‌گام
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                توضیحات خیلی راحت، شفاف و کاربردی درباره نحوه کار هر ماژول
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-all z-10"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Navigation Tabs (Responsive with Scroll) */}
        <div className="flex items-center gap-2 p-3 bg-black/40 border-b border-emerald-500/20 overflow-x-auto scrollbar-none">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-emerald-400"}`} />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-200">
          {/* SECTION: ACCOUNTS */}
          {activeSection === "accounts" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>رفیق، چطور اکانت تلگرامتو با چند کلیک وصل کنی؟</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  سلام! اینجا قلب تپنده پنله. شما شماره اکانتت رو با کد کشور (مثلاً <code className="text-emerald-400 font-mono font-bold">+989123456789</code>) وارد می‌کنی. تلگرام یه کد ۵ رقمی برات می‌فرسته. کد رو که بزنی، سشن رسمی رمزنگاری‌شده در سرور ذخیره میشه و حتی اگه سیستم یا گوشیت خاموش بشه، اکانت به صورت ۲۴/۷ فعال می‌مونه!
                </p>
              </div>

              {/* Visual Steps Mockup */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2 relative">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ۱
                  </div>
                  <h4 className="font-bold text-xs text-white">وارد کردن شماره تلفن</h4>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400" dir="ltr">
                    +98 912 345 6789
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    شماره رو کامل با + و کد کشور بنویس و دکمه دریافت کد رو بزن.
                  </p>
                </div>

                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2 relative">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ۲
                  </div>
                  <h4 className="font-bold text-xs text-white">دریافت کد ۵ رقمی</h4>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-400 text-center tracking-widest" dir="ltr">
                    [ 8 · 4 · 2 · 9 · 1 ]
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    کد مستقیماً در اپلیکیشن تلگرام یا پیامک برات میاد. اون رو تایپ کن.
                  </p>
                </div>

                <div className="bg-black/60 border border-rose-500/30 rounded-2xl p-4 space-y-2 relative">
                  <div className="w-7 h-7 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center">
                    ۳
                  </div>
                  <h4 className="font-bold text-xs text-white">رمز دومرحله‌ای ۲FA (اختیاری)</h4>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-500/30 text-[11px] font-mono text-rose-400 text-center" dir="ltr">
                    •••••••• (Hint: my_pass)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    اگه تایید دومرحله‌ای داری، پنل راهنمای رمز (Hint) رو هم نشونت میده تا راحت وارد کنی.
                  </p>
                </div>
              </div>

              {/* Pro Tips Card */}
              <div className="bg-gradient-to-r from-rose-950/40 via-black to-emerald-950/40 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-rose-300">فوت و فن طلایی برای اینکه اکانتت نسوزه:</span>
                  <p className="text-slate-300 leading-relaxed">
                    اگه اکانتت شماره مجازیه یا تازه ساختی، اول بزار ۱ یا ۲ روز فقط ساعت پروفایل روش روشن باشه و تبچی خیلی سنگین نزن. تلگرام به اکانت‌های باسابقه کاری نداره و به راحتی روزی هزاران پیام می‌فرستن!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: SELF SUITE */}
          {activeSection === "self" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>سلف چیه و چطور اکانتت رو تبدیل به ربات هوشمند شخصی می‌کنه؟</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  ماژول سلف روی خود اکانتت سوار میشه و کارهای خفنی انجام میده: ساعت زنده روی نام پروفایلت می‌اندازه، به کسایی که در پی‌وی پیام میدن پاسخ هوشمند میده، قفل عضویت اجباری کانال داره و حتی توی هر چتی محاسبات ریاضی یا قیمت دلار و بیت‌کوین رو درجا استعلام می‌کنه!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>ساعت زنده روی پروفایل با ۷ استایل فونت</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[10px]">پیش‌نمایش نام اکانت:</div>
                    <div className="text-emerald-400 font-bold text-sm">Ali [ 𝟏𝟒:𝟐𝟓 ] ✨</div>
                    <div className="text-cyan-400 text-[11px]">فونت‌ها: Bold, Monospace, Gothic, Sans و...</div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    هر دقیقه ساعت نام اکانتت خودکار بروز میشه بدون اینکه دیسکانکت بشه.
                  </p>
                </div>

                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>منشی هوشمند و قفل کانال</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="text-rose-400 text-[11px] font-bold">⛔ اول عضو کانال من شو تا پیام بدم!</div>
                    <div className="text-slate-300 text-[11px]">«سلام رفیق! فعلاً آنلاین نیستم، پیامت رو دیدم جواب میدم.»</div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    تا طرف در کانالت عضو نشه، منشی جواب نمیده؛ این یعنی جذب ممبر رایگان و خودکار!
                  </p>
                </div>

                <div className="bg-black/60 border border-rose-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>ماشین‌حساب چت و استعلام ارز</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1" dir="ltr">
                    <div className="text-slate-400 text-[10px]">تایپ در هر چتی:</div>
                    <div className="text-emerald-400">=1250 * 18 - 450 ➔ 22,050</div>
                    <div className="text-cyan-400">قیمت دلار / btc ➔ قیمت لحظه‌ای زنده</div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    در هر گروه یا پی‌وی اینارو بفرستی، سلف آنی جواب ریاضی یا قیمت دلار رو درج می‌کنه.
                  </p>
                </div>

                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Terminal className="w-4 h-4" />
                    <span>کنترل با پیام‌های ذخیره شده (Saved Messages)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[10px]">در چت Saved Messages اکانت بفرست:</div>
                    <div className="text-emerald-400 font-bold">/self on &nbsp;|&nbsp; /clock on &nbsp;|&nbsp; /status</div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    حتی بدون باز کردن مرورگر، از داخل تلگرام تمام تنظیمات رو کنترل کن!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: TABCHI */}
          {activeSection === "tabchi" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-rose-400 font-black text-sm mb-2">
                  <Flame className="w-4 h-4" />
                  <span>تبچی چیست و چطور مثل ساعت ۲۴/۷ تبلیغ می‌فرسته؟</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  تبچی ابزار ارسال خودکار و دوره‌ای پیام تبلیغاتی به سوپرگروه‌ها و گروه‌های تلگرامه. در این نسخه، هوش ضد اسپم (Anti-Flood AI) قرار داده شده تا بین ارسال‌ها مکث بزنه و تلگرام اکانت رو جریمه نکنه.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-black/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    ۱
                  </div>
                  <h4 className="font-bold text-xs text-white">تنظیم متن تبلیغ</h4>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    «خرید بهترین کانفیگ و پلن پرسرعت با تخفیف ویژه...»
                  </div>
                  <p className="text-[11px] text-slate-400">
                    متن جذاب خودت رو به همراه لینک کانال یا آیدی پشتیبانی بنویس.
                  </p>
                </div>

                <div className="bg-black/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                    ۲
                  </div>
                  <h4 className="font-bold text-xs text-white">انتخاب مقصد ارسال</h4>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
                    <div className="text-emerald-400 font-bold">✔ تمام سوپرگروه‌ها</div>
                    <div className="text-slate-400">یا لیست گروه‌های منتخب</div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    می‌تونی بگی به تمام گروه‌هایی که عضوه بفرسته یا فقط به یه لیست خاص.
                  </p>
                </div>

                <div className="bg-black/60 border border-rose-500/30 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center">
                    ۳
                  </div>
                  <h4 className="font-bold text-xs text-white">تکرار چرخه‌ای و تاخیر</h4>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-400" dir="ltr">
                    Delay: 45s ~ 90s
                  </div>
                  <p className="text-[11px] text-slate-400">
                    تاخیر متغیر بذار تا الگوریتم‌های تلگرام پیام‌ها رو به عنوان انسان تشخیص بدن.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">
                    کنترل از تلگرام: در Saved Messages بنویس <code className="bg-slate-900 px-2 py-0.5 rounded text-white">/tabchi start</code> یا <code className="bg-slate-900 px-2 py-0.5 rounded text-white">/tabchi stop</code>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: STORE BOT */}
          {activeSection === "store" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>فروشگاه تلگرامی با دکمه‌های رنگی چیه و چطور کار می‌کنه؟</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  با این بخش، شما یه ربات تلگرامی اختصاصی فروش پلن و کانفیگ بالا میاری. مشتری‌ها وارد ربات میشن، پلن‌های سلف یا تبچی رو انتخاب می‌کنن، فیش کارت‌به‌کارت یا کریپتو می‌فرستن و شما در پنل با یک کلیک تایید می‌کنی!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-xs text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>۷ تم رنگی خیره‌کننده دکمه‌ها</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">💎 نئون سایبری</div>
                    <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300">🔮 کهکشان بنفش</div>
                    <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300">🔴 آتشین رد (Fire)</div>
                    <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300">👑 طلایی لاکچری</div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    دکمه‌های ربات با اموجی‌ها و استایل‌های شیک تلگرام نمایش داده میشن.
                  </p>
                </div>

                <div className="bg-black/60 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
                  <h4 className="font-bold text-xs text-cyan-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>سوئیچ فوری بین دکمه شیشه‌ای و کیبورد لمسی</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    کاربر توی ربات با زدن دکمه <b>«سوئیچ کیبورد»</b> می‌تونه انتخاب کنه منو بصورت دکمه‌های شیشه‌ای (Inline) زیر پیام باشه، یا کیبورد پایین صفحه (Reply Keyboard)!
                  </p>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-cyan-400 font-mono">
                    حالت پیش‌فرض: Hybrid (هوشمند و دوگانه)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: SYSTEM TERMINAL */}
          {activeSection === "system" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-rose-400 font-black text-sm mb-2">
                  <Terminal className="w-4 h-4" />
                  <span>دستیار خط فرمان لینوکس: فقط بزن sudo selfandtabchi !</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  وقتی با SSH یا نرم‌افزار ترمینال (PuTTY/Termius) به سرورت وصل میشی، نیازی به حفظ کردن دستورات پیچیده لینوکس نداری! فقط کافیه عبارت <code className="bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">sudo selfandtabchi</code> رو تایپ کنی تا منوی زیر باز بشه:
                </p>
              </div>

              <div className="bg-black/80 border-2 border-emerald-500/40 rounded-2xl p-4 font-mono text-xs space-y-2 text-slate-300 shadow-[0_0_30px_rgba(16,185,129,0.15)]" dir="ltr">
                <div className="text-emerald-400 font-bold">$ sudo selfandtabchi</div>
                <div className="text-cyan-400">---------------------------------------------------------</div>
                <div className="text-slate-100 font-bold">[1] Start / Restart  ➔ راه اندازی مجدد و آزادسازی پورت</div>
                <div className="text-slate-100 font-bold">[2] Stop Service     ➔ توقف موقت پروسه ها</div>
                <div className="text-emerald-300 font-bold">[3] Update Script    ➔ آپدیت و بیلد خودکار به آخرین نسخه</div>
                <div className="text-cyan-300 font-bold">[4] Set Domain       ➔ تنظیم و چنج کردن دامنه سرور</div>
                <div className="text-emerald-300 font-bold">[5] Issue SSL        ➔ گرفتن گواهی SSL رایگان روی IP یا دامنه</div>
                <div className="text-blue-300 font-bold">[6] Auto-Renew       ➔ فعال سازی دیمن تمدید خودکار گواهی</div>
                <div className="text-yellow-300 font-bold">[7] Live Logs        ➔ مشاهده لاگ های زنده اکانت ها</div>
                <div className="text-purple-300 font-bold">[8] Change Password  ➔ تغییر رمز عبور مالک</div>
                <div className="text-rose-400 font-bold">[9] Uninstall        ➔ حذف کامل و بدون ردپا از سرور</div>
                <div className="text-slate-400 font-bold">[0] Exit             ➔ خروج</div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                💡 این دستور به صورت فایل باینری سیستم در <code className="text-emerald-400 font-mono">/usr/local/bin/selfandtabchi</code> نصب شده و از هر پوشه‌ای در لینوکس قابل اجراست.
              </p>
            </div>
          )}

          {/* SECTION: SSL & DOMAIN */}
          {activeSection === "ssl" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-2">
                  <Globe className="w-4 h-4" />
                  <span>چطور سرور رو روی دامنه خودمون بندازیم و قفل سبز HTTPS بگیریم؟</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  خیلی راحت! برای اینکه بدون فیلتر یا با آدرس شیک دامنه مثل <code className="text-emerald-400 font-mono font-bold">panel.yourdomain.com</code> به پنل وصل بشی، این ۳ مرحله ساده رو انجام بده:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-black/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    ۱
                  </div>
                  <h4 className="font-bold text-xs text-white">ثبت رکورد A در کلودفلر</h4>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-400" dir="ltr">
                    Type: A | Name: panel<br />IPv4: YOUR_SERVER_IP
                  </div>
                  <p className="text-[11px] text-slate-400">
                    توی کلودفلر یا هاستینگی که دامنه داری، یه رکورد A با آی‌پی سرورت بساز.
                  </p>
                </div>

                <div className="bg-black/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    ۲
                  </div>
                  <h4 className="font-bold text-xs text-white">وارد کردن دامنه در پنل</h4>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400" dir="ltr">
                    panel.mydomain.com
                  </div>
                  <p className="text-[11px] text-slate-400">
                    در پنل یا با زدن گزینه ۴ توی <code className="text-emerald-400">sudo selfandtabchi</code> دامنه رو وارد کن.
                  </p>
                </div>

                <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    ۳
                  </div>
                  <h4 className="font-bold text-xs text-white">دریافت SSL با یک کلیک</h4>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-bold">
                    🔒 صادر شد: Let's Encrypt
                  </div>
                  <p className="text-[11px] text-slate-400">
                    روی پورت امن ۳۴۴۳ با آدرس <code className="text-emerald-400">https://...</code> پنل با قفل سبز باز میشه!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PM BROADCAST */}
          {activeSection === "broadcast" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-rose-400 font-black text-sm mb-2">
                  <Send className="w-4 h-4" />
                  <span>ارسال همگانی پی‌وی (Private Broadcast) چیست؟</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  شاید بخوای به تمام کسایی که تا حالا به اکانتت پیام دادن، یه پیام اطلاعیه مهم یا تخفیف ویژه بفرستی. این ماژول لیست تمام گفتگوهای خصوصی رو استخراج می‌کنه و تک‌تک با رعایت وقفه ایمن، پیام رو به پی‌وی‌شون ارسال می‌کنه.
                </p>
              </div>

              <div className="p-4 bg-black/60 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>محافظت از اکانت با دکمه توقف اضطراری</span>
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  هنگام ارسال همگانی، شمارنده زنده تعداد ارسال‌های موفق و ناموفق رو نشون میده. هر لحظه حس کردی کافیه، دکمه قرمز «توقف فوری» رو می‌زنی و فرآیند همون لحظه متوقف میشه.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-emerald-500/30 bg-black/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>طراحی شده با تم های‌تک هکری و دستیار هوشمند ۲۴ ساعته</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all active:scale-95"
          >
            متوجه شدم، بزن بریم! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
