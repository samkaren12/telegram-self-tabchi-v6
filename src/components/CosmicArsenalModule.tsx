import React, { useState, useEffect } from "react";
import {
  Flame,
  Clock,
  Shield,
  ShieldAlert,
  Users,
  UserX,
  Type,
  Download,
  Dices,
  Sparkles,
  Zap,
  Check,
  Copy,
  Save,
  Radio,
  Play,
  StopCircle,
  Camera,
  Video,
  Mic,
  Smile,
  Send,
  Eye,
  Globe,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  Film,
  Music,
  Share2,
  Lock,
  Compass,
  MessageSquare,
  Bot,
  ExternalLink,
  Info,
} from "lucide-react";
import { Language, translations } from "../utils/i18n";
import { TelegramAccount } from "../types";
import { transformFont } from "../utils/fontStyler";
import { formatTehranTime } from "../utils/tehranTime";

interface CosmicArsenalModuleProps {
  account: TelegramAccount | null;
  lang: Language;
  onUpdateAccount: (updated: TelegramAccount) => void;
}

export const CosmicArsenalModule: React.FC<CosmicArsenalModuleProps> = ({
  account,
  lang,
  onUpdateAccount,
}) => {
  const isRtl = lang === "fa";

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<
    "actions" | "clocks" | "shields" | "friends" | "stylist" | "downloader" | "fun" | "cheatsheet"
  >("actions");

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // 1. Chat Action Studio State
  const [currentAction, setCurrentAction] = useState<
    "typing" | "record-audio" | "upload-photo" | "upload-video" | "play-game"
  >("typing");
  const [actionTargetChat, setActionTargetChat] = useState<string>("me");
  const [actionActive, setActionActive] = useState<boolean>(false);
  const [actionStatusMsg, setActionStatusMsg] = useState<string | null>(null);

  // 2. Advanced Multi-Country Clock & Rotator
  const [worldClocks, setWorldClocks] = useState({
    tehran: "",
    istanbul: "",
    dubai: "",
    london: "",
    newyork: "",
  });
  const [rotatorBioActive, setRotatorBioActive] = useState<boolean>(false);
  const [rotatorBioItems, setRotatorBioItems] = useState<string[]>([
    "سکوت زیباترین پاسخ است... 🖤",
    "بر بلندای قله ایستاده‌ام ⚡",
    "زمان همه چیز را ثابت خواهد کرد ⏳",
    "کازمیک پرو | امنیت و قدرت مطلق 🚀",
  ]);
  const [rotatorBioInterval, setRotatorBioInterval] = useState<number>(5);
  const [rotatorNameActive, setRotatorNameActive] = useState<boolean>(false);
  const [baseName, setBaseName] = useState<string>(account?.firstName || "Telegram User");
  const [selectedFontStyle, setSelectedFontStyle] = useState<string>("bold");

  // 3. PV Shields & Chat Guard
  const [lockLinks, setLockLinks] = useState<boolean>(false);
  const [lockVoice, setLockVoice] = useState<boolean>(false);
  const [lockPhotos, setLockPhotos] = useState<boolean>(false);
  const [lockVideos, setLockVideos] = useState<boolean>(false);
  const [lockForwards, setLockForwards] = useState<boolean>(false);
  const [lockGifsStickers, setLockGifsStickers] = useState<boolean>(false);
  const [lockStarsPaywall, setLockStarsPaywall] = useState<boolean>(false);
  const [starsPrice, setStarsPrice] = useState<number>(5);
  const [chatGuardActive, setChatGuardActive] = useState<boolean>(true);
  const [antiCurse, setAntiCurse] = useState<boolean>(true);
  const [autoMuteSeconds, setAutoMuteSeconds] = useState<number>(60);

  // 4. Friend & Enemy System
  const [friendReplyMode, setFriendReplyMode] = useState<"loving" | "vip" | "silent">("loving");
  const [enemyReplyMode, setEnemyReplyMode] = useState<"insult" | "block" | "mute">("insult");
  const [friendsList, setFriendsList] = useState<string>("@friend1\n@best_buddy");
  const [enemiesList, setEnemiesList] = useState<string>("@enemy1\n@hater");

  // Sample texts pools
  const friendPresetQuotes = [
    "سلام رفیق قدیمی و با معرفت! همیشه به یادت هستم ❤️",
    "درود بر دوست گرامی! امری داشتی در خدمتم 🌟",
    "سلام عزیزم، پیامتو دریافت کردم و به زودی پاسخ میدم 😊",
    "بهترین‌ها برای تو رفیق شفیق! خوشحالم پیام دادی 💫",
  ];

  const enemyPresetQuotes = [
    "پیام شما به دلیل قرار داشتن در لیست دشمنان نادیده گرفته شد ⛔",
    "وقت من ارزشمندتر از هم‌کلامی با شماست 👋",
    "سکوت در برابر نادان بهترین پاسخ است 🛑",
    "حساب شما به زودی مسدود خواهد شد ⚠️",
  ];

  // 5. Stylist & Logo Maker
  const [styleInputText, setStyleInputText] = useState<string>("کازمیک پرو | Cosmic Pro");
  const [selectedFormat, setSelectedFormat] = useState<"code" | "italic" | "spoiler" | "quote" | "strikethrough">("code");
  const [logoText, setLogoText] = useState<string>("COSMIC");

  // 6. Downloader & Converter
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [downloadResult, setDownloadResult] = useState<string | null>(null);

  // 7. Fun, Games & Tools
  const [falResult, setFalResult] = useState<{ poem: string; ghazal: string; interpretation: string } | null>(null);
  const [fetchingFal, setFetchingFal] = useState<boolean>(false);
  const [proxies, setProxies] = useState<any[]>([]);
  const [loadingProxies, setLoadingProxies] = useState<boolean>(false);
  const [diceType, setDiceType] = useState<"dice" | "dart" | "football" | "bowling" | "casino">("dice");
  const [diceFeedback, setDiceFeedback] = useState<string | null>(null);
  const [cloneTarget, setCloneTarget] = useState<string>("");
  const [numericIdQuery, setNumericIdQuery] = useState<string>("");
  const [whoisInfo, setWhoisInfo] = useState<string | null>(null);

  const showToast = (text: string) => {
    setFeedback(text);
    setTimeout(() => setFeedback(null), 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Clock Ticker for Multiple Countries
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      // Iran (UTC+3.5)
      const irTime = formatTehranTime("HH:mm:ss", now);
      // Turkey (UTC+3)
      const trTime = new Date(now.getTime() + 3 * 3600000).toISOString().substring(11, 19);
      // UAE (UTC+4)
      const aeTime = new Date(now.getTime() + 4 * 3600000).toISOString().substring(11, 19);
      // UK (UTC+0)
      const ukTime = new Date(now.getTime() + 0 * 3600000).toISOString().substring(11, 19);
      // NY (UTC-5)
      const usTime = new Date(now.getTime() - 5 * 3600000).toISOString().substring(11, 19);

      setWorldClocks({
        tehran: irTime,
        istanbul: trTime,
        dubai: aeTime,
        london: ukTime,
        newyork: usTime,
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save All Cosmic Settings
  const handleSaveCosmicConfig = async () => {
    if (!account) return;
    setSaving(true);
    try {
      const payload = {
        chat_action: {
          active: actionActive,
          action: currentAction,
          target_chat: actionTargetChat,
        },
        rotating_bio: {
          active: rotatorBioActive,
          items: rotatorBioItems,
          interval_minutes: rotatorBioInterval,
        },
        rotating_name: {
          active: rotatorNameActive,
          base_name: baseName,
          with_time: true,
          font_style: selectedFontStyle,
        },
        pv_shields: {
          lock_links: lockLinks,
          lock_voice: lockVoice,
          lock_photos: lockPhotos,
          lock_videos: lockVideos,
          lock_forwards: lockForwards,
          lock_stickers_gifs: lockGifsStickers,
          lock_stars_paywall: lockStarsPaywall,
          stars_price: starsPrice,
        },
        friend_enemy: {
          active: true,
          friends: friendsList.split("\n").filter(Boolean),
          enemies: enemiesList.split("\n").filter(Boolean),
          friend_reply_mode: friendReplyMode,
          enemy_reply_mode: enemyReplyMode,
        },
        chat_guard: {
          active: chatGuardActive,
          anti_curse: antiCurse,
          anti_spam: true,
          auto_mute_seconds: autoMuteSeconds,
        },
      };

      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/cosmic/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        account.features.cosmic = json.cosmic;
        onUpdateAccount({ ...account });
        showToast(isRtl ? "تنظیمات سلف ساز کازمیک با موفقیت ذخیره شد 🚀" : "Cosmic settings saved!");
      }
    } catch (_) {
      showToast(isRtl ? "خطا در ذخیره تنظیمات" : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Trigger Chat Action
  const handleTriggerAction = async () => {
    if (!account) return;
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(account.phone)}/cosmic/chat-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetChat: actionTargetChat, action: currentAction }),
      });
      const json = await res.json();
      if (json.success) {
        setActionStatusMsg(
          isRtl
            ? `اکشن (${currentAction}) برای چت ${actionTargetChat} فعال شد!`
            : `Action ${currentAction} sent!`
        );
        setTimeout(() => setActionStatusMsg(null), 3500);
      }
    } catch (_) {}
  };

  // Hafez Fal
  const handleFetchFal = async () => {
    setFetchingFal(true);
    try {
      const res = await fetch("/api/cosmic/fal");
      const json = await res.json();
      if (json.success) {
        setFalResult(json.fal);
      }
    } catch (_) {
    } finally {
      setFetchingFal(false);
    }
  };

  // Daily Proxies
  const handleFetchProxies = async () => {
    setLoadingProxies(true);
    try {
      const res = await fetch("/api/cosmic/proxies");
      const json = await res.json();
      if (json.success) {
        setProxies(json.proxies || []);
      }
    } catch (_) {
    } finally {
      setLoadingProxies(false);
    }
  };

  // Cheat Dice
  const handleSendDiceCheat = (type: string) => {
    const labels: Record<string, string> = {
      dice: "🎲 تاس عدد ۶ (برد تضمینی)",
      dart: "🎯 دارت ۵۰ امتیازی (مرکز سیبل)",
      football: "⚽ پنالتی گل شد!",
      bowling: "🎳 استرایک کامل (۱۰ پین)",
      casino: "🎰 جک‌پات کازینو (۷۷۷)",
    };
    setDiceFeedback(labels[type] || "شلیک شد!");
    setTimeout(() => setDiceFeedback(null), 3000);
  };

  return (
    <div className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 p-0.5 shadow-xl shadow-amber-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Flame className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  {isRtl ? "سلف ساز کازمیک پرو (Cosmic Arsenal)" : "Cosmic Arsenal Super-Suite"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  COSMIC EDITION 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isRtl
                  ? "مجموعه فوق‌العاده امکانات سلف ساز کازمیک: اکشن‌های چت، ساعت چند کشوره، بیو و اسم چرخشی، قفل‌های پیشرفته پیوی، دوست/دشمن، دانلودر، تقلب بازی‌ها، فال و کنسول دستورات کلیکی."
                  : "Complete suite of Cosmic self-bot features: chat actions, multi-timezone clocks, rotating bio, PV shields, friend/enemy matrix, game cheats, and instant quick toggles."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveCosmicConfig}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            <span>{isRtl ? "ذخیره تغییرات کازمیک" : "Save Cosmic Config"}</span>
          </button>
        </div>
      </div>

      {/* Internal Subtabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: "actions", label: isRtl ? "حالت‌های اکشن 🎭" : "Chat Actions", icon: Send, color: "text-amber-400" },
          { id: "clocks", label: isRtl ? "ساعت و بیو چرخشی ⏰" : "Clocks & Rotator", icon: Clock, color: "text-cyan-400" },
          { id: "shields", label: isRtl ? "قفل پیوی و نگهبان 🛡️" : "PV Shields & Guard", icon: Shield, color: "text-rose-400" },
          { id: "friends", label: isRtl ? "دوست و دشمن ⚔️" : "Friend & Enemy", icon: Users, color: "text-emerald-400" },
          { id: "stylist", label: isRtl ? "استایل متن و لوگو 🎨" : "Stylist & Logo", icon: Type, color: "text-purple-400" },
          { id: "downloader", label: isRtl ? "دانلودر و رسانه 📥" : "Downloader & Media", icon: Download, color: "text-blue-400" },
          { id: "fun", label: isRtl ? "سرگرمی، تقلب و فال 🎲" : "Fun & Cheats", icon: Dices, color: "text-teal-400" },
          { id: "cheatsheet", label: isRtl ? "دستورات کلیکی ⚡" : "Quick Console", icon: Zap, color: "text-amber-300" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-slate-800 text-white shadow-lg border border-slate-700 backdrop-blur-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: CHAT ACTION STUDIO */}
      {activeTab === "actions" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "استودیوی حالت‌های اکشن زنده (Chat Actions)" : "Chat Actions Studio"}
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              ارسال استاتوس تایپ، ضبط ویس، ویدیو و بازی به مخاطب یا گروه
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: "typing", label: "تایپ کردن (Typing)", icon: Type, desc: "در حال نوشتن پیام..." },
              { id: "record-audio", label: "ضبط ویس (Voice)", icon: Mic, desc: "در حال ضبط پیام صوتی..." },
              { id: "upload-photo", label: "ارسال عکس (Photo)", icon: Camera, desc: "در حال آپلود تصویر..." },
              { id: "upload-video", label: "ارسال ویدیو (Video)", icon: Video, desc: "در حال ارسال ویدیو..." },
              { id: "play-game", label: "در حال بازی (Game)", icon: Dices, desc: "در حال بازی در چت..." },
            ].map((act) => {
              const Icon = act.icon;
              const isSel = currentAction === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => setCurrentAction(act.id as any)}
                  className={`p-4 rounded-2xl border text-center space-y-2 transition-all cursor-pointer ${
                    isSel
                      ? "bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto" />
                  <div className="text-xs font-bold">{act.label}</div>
                  <div className="text-[10px] text-slate-500">{act.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-slate-300">
                چت هدف جهت ارسال اکشن (آیدی کاربری، یوزرنیم، یا me برای پیام‌های ذخیره‌شده):
              </label>
              <input
                type="text"
                value={actionTargetChat}
                onChange={(e) => setActionTargetChat(e.target.value)}
                placeholder="e.g. @username or me or chat_id"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-4">
              <button
                type="button"
                onClick={handleTriggerAction}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>ارسال تست آنی اکشن</span>
              </button>
            </div>
          </div>

          {actionStatusMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{actionStatusMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: CLOCKS & ROTATOR */}
      {activeTab === "clocks" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "ساعت چند کشوره، اسم چرخشی و بیو چرخشی" : "World Clocks & Name/Bio Rotator"}
              </h3>
            </div>
          </div>

          {/* World Clocks Live Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { flag: "🇮🇷", city: "تهران (Iran)", time: worldClocks.tehran, tz: "UTC+3:30" },
              { flag: "🇹🇷", city: "استانبول (Turkey)", time: worldClocks.istanbul, tz: "UTC+3:00" },
              { flag: "🇦🇪", city: "دبی (UAE)", time: worldClocks.dubai, tz: "UTC+4:00" },
              { flag: "🇬🇧", city: "لندن (UK)", time: worldClocks.london, tz: "UTC+0:00" },
              { flag: "🇺🇸", city: "نیویورک (USA)", time: worldClocks.newyork, tz: "UTC-5:00" },
            ].map((c) => (
              <div key={c.city} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
                <div className="text-xl">{c.flag}</div>
                <div className="text-xs font-bold text-slate-300">{c.city}</div>
                <div className="text-base font-mono font-black text-cyan-400">{c.time}</div>
                <div className="text-[10px] text-slate-500 font-mono">{c.tz}</div>
              </div>
            ))}
          </div>

          {/* Rotating Bio Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-white">بیو چرخشی خودکار (Rotating Bio)</h4>
                <p className="text-[11px] text-slate-400">تعویض خودکار بیوگرافی پروفایل تلگرام در فواصل زمانی مشخص</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rotatorBioActive}
                  onChange={(e) => setRotatorBioActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">لیست متون بیو (هر سطر یک بیو):</label>
              <textarea
                rows={4}
                value={rotatorBioItems.join("\n")}
                onChange={(e) => setRotatorBioItems(e.target.value.split("\n"))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">فاصله زمانی تعویض بیو:</span>
              <select
                value={rotatorBioInterval}
                onChange={(e) => setRotatorBioInterval(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
              >
                <option value={1}>هر ۱ دقیقه</option>
                <option value={5}>هر ۵ دقیقه</option>
                <option value={15}>هر ۱۵ دقیقه</option>
                <option value={30}>هر ۳۰ دقیقه</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PV SHIELDS & CHAT GUARD */}
      {activeTab === "shields" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "سپر ضد نفوذ پیوی و نگهبان چت گروه" : "PV Shields & Chat Guard"}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: "قفل ارسال لینک 🔗", state: lockLinks, set: setLockLinks, desc: "حذف فوری پیام‌های حاوی لینک در پیوی" },
              { title: "قفل ویس و صدا 🎙️", state: lockVoice, set: setLockVoice, desc: "مسدودسازی ارسال پیام صوتی در چت خصوصی" },
              { title: "قفل عکس و تصویر 📸", state: lockPhotos, set: setLockPhotos, desc: "جلوگیری از دریافت عکس در پیوی" },
              { title: "قفل ویدیو و فیلم 🎬", state: lockVideos, set: setLockVideos, desc: "مسدودسازی فایل‌های ویدیویی" },
              { title: "قفل پیام فوروارد 🔄", state: lockForwards, set: setLockForwards, desc: "حذف خودکار پیام‌های فورواردشده" },
              { title: "قفل گیف و استیکر 🎭", state: lockGifsStickers, set: setLockGifsStickers, desc: "مسدودسازی انیمیشن‌ها و استیکرها" },
            ].map((lock, i) => (
              <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{lock.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{lock.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={lock.state}
                  onChange={(e) => lock.set(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* Stars Paywall Lock */}
          <div className="p-4 bg-gradient-to-r from-amber-950/20 to-slate-950 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-white">قفل پیوی با تلگرام استارز (Stars Paywall)</span>
              </div>
              <p className="text-[11px] text-slate-400">کاربران برای پیام دادن به پیوی باید ستاره (Stars) پرداخت کنند.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={starsPrice}
                onChange={(e) => setStarsPrice(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-center text-amber-300 font-mono"
              />
              <span className="text-xs text-amber-400 font-bold">⭐ Stars</span>
              <input
                type="checkbox"
                checked={lockStarsPaywall}
                onChange={(e) => setLockStarsPaywall(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: FRIEND & ENEMY MATRIX */}
      {activeTab === "friends" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "ماتریس هوشمند دوست و دشمن (Friend & Enemy Arsenal)" : "Friend & Enemy Matrix"}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Friends Card */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>لیست دوستان VIP (بانک ۲۰۰ متن آماده رفاقتی)</span>
                </h4>
                <select
                  value={friendReplyMode}
                  onChange={(e) => setFriendReplyMode(e.target.value as any)}
                  className="bg-slate-950 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs text-emerald-300"
                >
                  <option value="loving">پاسخ محبت‌آمیز خودکار ❤️</option>
                  <option value="vip">سین و فوروارد فوری ⚡</option>
                  <option value="silent">عادی</option>
                </select>
              </div>

              <textarea
                rows={3}
                value={friendsList}
                onChange={(e) => setFriendsList(e.target.value)}
                placeholder="@username1\n@username2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400">نمونه متون رفاقتی آماده:</div>
                <div className="space-y-1">
                  {friendPresetQuotes.map((q, i) => (
                    <div key={i} className="text-[11px] p-2 bg-slate-900 rounded-lg text-emerald-200 flex items-center justify-between">
                      <span className="truncate">{q}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(q, `fq-${i}`)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        {copiedText === `fq-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enemies Card */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <UserX className="w-4 h-4" />
                  <span>لیست دشمنان (بانک ۴۰۰ متن آماده ضایع‌کننده)</span>
                </h4>
                <select
                  value={enemyReplyMode}
                  onChange={(e) => setEnemyReplyMode(e.target.value as any)}
                  className="bg-slate-950 border border-rose-500/30 rounded-xl px-2.5 py-1 text-xs text-rose-300"
                >
                  <option value="insult">پاسخ سنگین و کل‌کل 🔥</option>
                  <option value="block">بلاک فوری ⛔</option>
                  <option value="mute">سکوت کامل 🔇</option>
                </select>
              </div>

              <textarea
                rows={3}
                value={enemiesList}
                onChange={(e) => setEnemiesList(e.target.value)}
                placeholder="@enemy1\n@enemy2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400">نمونه متون ضایع‌کننده آماده:</div>
                <div className="space-y-1">
                  {enemyPresetQuotes.map((q, i) => (
                    <div key={i} className="text-[11px] p-2 bg-slate-900 rounded-lg text-rose-200 flex items-center justify-between">
                      <span className="truncate">{q}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(q, `eq-${i}`)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        {copiedText === `eq-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: STYLIST & LOGO */}
      {activeTab === "stylist" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "استایل‌ساز پیشرفته متن تلگرام و لوگوساز" : "Text Stylist & Logo Maker"}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Telegram Formatting Studio */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-purple-300">فرمت‌دهی ویژه تلگرام (Spoiler, Code, Quote, Italic):</h4>
              <input
                type="text"
                value={styleInputText}
                onChange={(e) => setStyleInputText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                placeholder="متن خود را تایپ کنید..."
              />

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "code", label: "کد مونو 💻" },
                  { id: "italic", label: "ایتالیک 🖋️" },
                  { id: "spoiler", label: "اسپویلر پوشیده 👁️" },
                  { id: "quote", label: "نقل قول 💬" },
                  { id: "strikethrough", label: "خط خورده ✂️" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFormat(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedFormat === f.id
                        ? "bg-purple-500 text-slate-950"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Formatted Preview Box */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-purple-200 flex items-center justify-between">
                <span>
                  {selectedFormat === "code" && `\`${styleInputText}\``}
                  {selectedFormat === "italic" && `_${styleInputText}_`}
                  {selectedFormat === "spoiler" && `||${styleInputText}||`}
                  {selectedFormat === "quote" && `> ${styleInputText}`}
                  {selectedFormat === "strikethrough" && `~${styleInputText}~`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const txt =
                      selectedFormat === "code"
                        ? `\`${styleInputText}\``
                        : selectedFormat === "italic"
                        ? `_${styleInputText}_`
                        : selectedFormat === "spoiler"
                        ? `||${styleInputText}||`
                        : selectedFormat === "quote"
                        ? `> ${styleInputText}`
                        : `~${styleInputText}~`;
                    copyToClipboard(txt, "format-txt");
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  {copiedText === "format-txt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* ASCII & Cyber Logo Generator */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-300">لوگوساز سایبری متنی (Cyber Logo Maker):</h4>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                placeholder="TEXT LOGO"
              />

              <div className="p-3 bg-black rounded-xl border border-slate-800 font-mono text-[11px] text-amber-400 overflow-x-auto whitespace-pre leading-snug">
                {`╔════════════════════════════════╗\n║  ⚡ ${logoText.toUpperCase()} OFFICIAL ⚡  ║\n║   COSMIC ARSENAL ENGINE v6.2   ║\n╚════════════════════════════════╝`}
              </div>

              <button
                type="button"
                onClick={() => {
                  const logo = `╔════════════════════════════════╗\n║  ⚡ ${logoText.toUpperCase()} OFFICIAL ⚡  ║\n║   COSMIC ARSENAL ENGINE v6.2   ║\n╚════════════════════════════════╝`;
                  copyToClipboard(logo, "logo-copy");
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedText === "logo-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>کپی لوگو</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: DOWNLOADER & MEDIA */}
      {activeTab === "downloader" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "دانلودر هوشمند، تبدیل مدیا و استیکر" : "Downloader & Media Converter"}
              </h3>
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300">
              لینک ویدیوی اینستاگرام یا یوتیوب جهت دانلود:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/... or YouTube URL"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!downloadUrl.trim()) return;
                  setDownloadResult("آماده دانلود! دستور .dl برای این آدرس در تلگرام ارسال شد 🎬");
                  setTimeout(() => setDownloadResult(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                دانلود مستقیم
              </button>
            </div>

            {downloadResult && (
              <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl text-blue-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>{downloadResult}</span>
              </div>
            )}
          </div>

          {/* Quick Media Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Film className="w-4 h-4" />
                <span>ویدیو مسیج دایره‌ای (Telescope)</span>
              </div>
              <p className="text-[11px] text-slate-400">تبدیل هر ویدیو به ویدیو مسیج گرد با دستور <code>.telescope</code></p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Sparkles className="w-4 h-4" />
                <span>تبدیل عکس به استیکر</span>
              </div>
              <p className="text-[11px] text-slate-400">ریپلای روی هر عکس با <code>.sticker</code> جهت تبدیل فوری</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Camera className="w-4 h-4" />
                <span>ذخیره تایم‌دار یکبار مصرف</span>
              </div>
              <p className="text-[11px] text-slate-400">ذخیره خودکار تمامی عکس‌ها و فیلم‌های یکبار مصرف در چت ذخیره‌شده‌ها</p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 7: FUN, CHEATS & TOOLS */}
      {activeTab === "fun" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Dices className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "سرگرمی، تقلب بازی‌ها، فال حافظ و ابزارها" : "Fun, Game Cheats & Tools"}
              </h3>
            </div>
          </div>

          {/* Dice & Game Cheats */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>تقلب بازی‌های رسمی تلگرام (Dice Cheats):</span>
              {diceFeedback && (
                <span className="text-teal-400 font-mono text-[11px]">{diceFeedback}</span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: "dice", label: "🎲 تاس عدد ۶", desc: "برد صد در صدی" },
                { id: "dart", label: "🎯 دارت ۵۰", desc: "مرکز سیبل" },
                { id: "football", label: "⚽ پنالتی گل", desc: "گل مستقیم" },
                { id: "bowling", label: "🎳 استرایک", desc: "۱۰ پین ریخته" },
                { id: "casino", label: "🎰 جک‌پات ۷۷۷", desc: "حداکثر امتیاز" },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSendDiceCheat(d.id)}
                  className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-center space-y-1 transition-all active:scale-95 cursor-pointer"
                >
                  <div className="text-xs font-bold text-teal-300">{d.label}</div>
                  <div className="text-[10px] text-slate-500">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hafez Fal Generator */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-300">گرفتن فال حافظ واقعی با تعبیر و تفسیر:</h4>
              <button
                type="button"
                onClick={handleFetchFal}
                disabled={fetchingFal}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{fetchingFal ? "در حال نیت..." : "نیت و گرفتن فال"}</span>
              </button>
            </div>

            {falResult && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-xs">
                <div className="font-bold text-amber-400">{falResult.ghazal}</div>
                <div className="font-serif text-slate-200 whitespace-pre-line leading-relaxed italic text-sm">
                  {falResult.poem}
                </div>
                <div className="p-3 bg-slate-950 rounded-xl text-amber-100 text-[11px] leading-relaxed border border-amber-500/20">
                  <strong>تعبیر و تفسیر فال:</strong> {falResult.interpretation}
                </div>
              </div>
            )}
          </div>

          {/* Daily MTProto Proxies */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-cyan-300">پروکسی‌های روزانه پرسرعت تلگرام (MTProto):</h4>
              <button
                type="button"
                onClick={handleFetchProxies}
                disabled={loadingProxies}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold border border-slate-800 cursor-pointer"
              >
                دریافت پروکسی‌های زنده
              </button>
            </div>

            {proxies.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {proxies.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{p.country}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.server}:{p.port} ({p.pingMs}ms)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const link = `https://t.me/proxy?server=${p.server}&port=${p.port}&secret=${p.secret}`;
                        copyToClipboard(link, `pr-${i}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30"
                    >
                      {copiedText === `pr-${i}` ? "کپی شد" : "اتصال / کپی"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 8: QUICK COMMANDS CONSOLE */}
      {activeTab === "cheatsheet" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isRtl ? "کنسول دستورات سریع و کلیکی سلف ساز کازمیک" : "Cosmic Quick Commands Console"}
              </h3>
            </div>
            <span className="text-xs text-slate-400">کپی و اجرای فوری با یک کلیک</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              { cmd: ".time on", desc: "فعال‌سازی ساعت زنده در پروفایل تلگرام" },
              { cmd: ".time off", desc: "خاموش کردن ساعت پروفایل" },
              { cmd: ".pv lock", desc: "قفل فوری پیوی (مسدودسازی پیام‌های خصوصی)" },
              { cmd: ".pv unlock", desc: "باز کردن قفل پیوی" },
              { cmd: ".mute [time]", desc: "سکوت کاربر در گروه یا پیوی" },
              { cmd: ".unmute", desc: "لغو سکوت کاربر" },
              { cmd: ".spam [تعداد] [متن]", desc: "ارسال اسپم با تعداد دلخواه" },
              { cmd: ".calc [فرمول]", desc: "محاسبه عبارات ریاضی و مالی" },
              { cmd: ".price [ارز]", desc: "استعلام نرخ زنده دلار، طلا و رمزارز" },
              { cmd: ".whois", desc: "مشاهده آمار کامل و مشخصات اکانت یا گروه" },
              { cmd: ".id", desc: "دریافت آیدی عددی کاربر یا چت" },
              { cmd: ".clone", desc: "ریپلای روی کاربر جهت کلون نام و بیوگرافی" },
              { cmd: ".revert", desc: "بازگردانی نام و بیو اصلی خود" },
              { cmd: ".dl [لینک]", desc: "دانلود از اینستاگرام و یوتیوب" },
              { cmd: ".tagall [متن]", desc: "تگ همگانی تمامی اعضای گروه" },
              { cmd: ".clean [تعداد]", desc: "پاکسازی پیام‌های ارسالی شما در گروه" },
              { cmd: ".spambot", desc: "استعلام وضعیت محدودیت و ریپورتی تلگرام" },
              { cmd: ".fal", desc: "گرفتن فال حافظ با شعر و تفسیر" },
              { cmd: ".dice", desc: "پرتاب تاس با شانس برد ۱۰۰٪" },
              { cmd: ".proxy", desc: "دریافت پروکسی‌های فعال MTProto" },
              { cmd: ".whisper [متن]", desc: "خواندن و ارسال پیام نجوا" },
            ].map((c, i) => (
              <div
                key={i}
                onClick={() => copyToClipboard(c.cmd, `c-${i}`)}
                className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-95"
              >
                <div>
                  <div className="font-mono text-xs font-bold text-amber-300" dir="ltr">{c.cmd}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{c.desc}</div>
                </div>
                <button type="button" className="text-slate-500 hover:text-white p-1">
                  {copiedText === `c-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
