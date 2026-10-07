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
  Search,
  Pause,
  Volume2,
  UserCheck,
  ShieldCheck,
  Database,
  Headphones,
  RefreshCw,
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
    | "actions"
    | "stalker"
    | "intelligence"
    | "music"
    | "voice"
    | "clocks"
    | "shields"
    | "friends"
    | "stylist"
    | "translator"
    | "downloader"
    | "fun"
    | "cheatsheet"
  >("actions");

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // 0. Samkaren Pro New State Features
  // Profile Stalker (فضول پروفایل)
  const [stalkerLoading, setStalkerLoading] = useState<boolean>(false);
  const [stalkerVisitors, setStalkerVisitors] = useState<any[]>([]);
  const [stalkerMsg, setStalkerMsg] = useState<string | null>(null);
  const [stalkerLastScan, setStalkerLastScan] = useState<string | null>(null);

  // Entity Intelligence (استخراج آیدی و اطلاعات)
  const [entityQuery, setEntityQuery] = useState<string>("");
  const [entityLoading, setEntityLoading] = useState<boolean>(false);
  const [entityResult, setEntityResult] = useState<any | null>(null);
  const [entityError, setEntityError] = useState<string | null>(null);
  const [accountDeepStats, setAccountDeepStats] = useState<any | null>(null);
  const [loadingDeepStats, setLoadingDeepStats] = useState<boolean>(false);

  // Music Search (سرچ آهنگ آنلاین)
  const [musicQuery, setMusicQuery] = useState<string>("");
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [musicLoading, setMusicLoading] = useState<boolean>(false);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // TTS & STT (متن به ویس و ویس به متن)
  const [ttsText, setTtsText] = useState<string>("");
  const [ttsRate, setTtsRate] = useState<number>(1);
  const [ttsPitch, setTtsPitch] = useState<number>(1);
  const [ttsSpeaking, setTtsSpeaking] = useState<boolean>(false);
  const [sttListening, setSttListening] = useState<boolean>(false);
  const [sttTranscript, setSttTranscript] = useState<string>("");

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

  // 6. Multi-Language Real-time Translator
  const [translateInput, setTranslateInput] = useState<string>("سلام روز بخیر، به سیستم اتوماسیون سلف تلگرام خوش آمدید!");
  const [translateFrom, setTranslateFrom] = useState<string>("auto");
  const [translateTo, setTranslateTo] = useState<string>("en");
  const [translateResult, setTranslateResult] = useState<string | null>(null);
  const [translating, setTranslating] = useState<boolean>(false);

  const handleTranslate = async (customText?: string, customTo?: string, customFrom?: string) => {
    const textToUse = customText !== undefined ? customText : translateInput;
    const targetToUse = customTo !== undefined ? customTo : translateTo;
    const sourceToUse = customFrom !== undefined ? customFrom : translateFrom;

    if (!textToUse || !textToUse.trim()) {
      showToast("لطفاً متن مورد نظر جهت ترجمه را وارد فرمایید.");
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToUse.trim(),
          to: targetToUse,
          from: sourceToUse === "auto" ? undefined : sourceToUse,
        }),
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        setTranslateResult(data.translatedText);
        showToast("ترجمه با موفقیت انجام شد 🌐");
      } else {
        throw new Error(data.message || "خطا در برقراری ارتباط با سرور ترجمه");
      }
    } catch (err: any) {
      showToast(err.message || "خطا در ترجمه متن");
    } finally {
      setTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    const oldFrom = translateFrom === "auto" ? "fa" : translateFrom;
    const oldTo = translateTo;
    setTranslateFrom(oldTo);
    setTranslateTo(oldFrom);
    if (translateResult) {
      setTranslateInput(translateResult);
      setTranslateResult(translateInput);
    }
  };

  // 7. Downloader & Converter
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

        // Trigger real live backend rotators
        fetch("/api/cosmic/rotator/bio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: account.phone,
            active: rotatorBioActive,
            items: rotatorBioItems,
            intervalMinutes: rotatorBioInterval,
          }),
        }).catch(() => {});

        fetch("/api/cosmic/rotator/name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: account.phone,
            active: rotatorNameActive,
            baseName,
            fontStyle: selectedFontStyle,
          }),
        }).catch(() => {});

        showToast(isRtl ? "تنظیمات سلف ساز سام‌کارن پرو با موفقیت ذخیره شد 🚀" : "Samkaren Pro settings saved!");
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

  // Profile Stalker Fetcher
  const handleFetchVisitors = async () => {
    if (!account?.phone) return;
    setStalkerLoading(true);
    setStalkerMsg(null);
    try {
      const res = await fetch(`/api/cosmic/profile-stalker?phone=${encodeURIComponent(account.phone)}`);
      const data = await res.json();
      if (data.success) {
        setStalkerVisitors(data.visitors || []);
        setStalkerLastScan(data.scanTimestamp || new Date().toISOString());
        if (data.message) setStalkerMsg(data.message);
      } else {
        setStalkerMsg(data.message || "خطا در دریافت لیست بازدیدکنندگان");
      }
    } catch (e: any) {
      setStalkerMsg("خطای ارتباط با سرور تلگرام");
    } finally {
      setStalkerLoading(false);
    }
  };

  // Entity Intelligence Lookup
  const handleLookupEntity = async () => {
    if (!account?.phone || !entityQuery.trim()) return;
    setEntityLoading(true);
    setEntityError(null);
    setEntityResult(null);
    try {
      const res = await fetch(
        `/api/cosmic/entity-info?phone=${encodeURIComponent(account.phone)}&query=${encodeURIComponent(
          entityQuery.trim()
        )}`
      );
      const data = await res.json();
      if (data.success) {
        setEntityResult(data);
      } else {
        setEntityError(data.message || "نهاد یا شناسه تلگرام یافت نشد.");
      }
    } catch (e: any) {
      setEntityError(e?.message || "خطای ارتباط با سرور تلگرام");
    } finally {
      setEntityLoading(false);
    }
  };

  // Deep Account Stats Fetcher
  const handleFetchDeepAccountStats = async () => {
    if (!account?.phone) return;
    setLoadingDeepStats(true);
    try {
      const res = await fetch(`/api/cosmic/account-stats?phone=${encodeURIComponent(account.phone)}`);
      const data = await res.json();
      if (data.success) {
        setAccountDeepStats(data.stats);
      }
    } catch (_) {
    } finally {
      setLoadingDeepStats(false);
    }
  };

  // Music Search Engine
  const handleSearchMusic = async () => {
    if (!musicQuery.trim()) return;
    setMusicLoading(true);
    try {
      const res = await fetch(`/api/cosmic/music-search?q=${encodeURIComponent(musicQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setMusicTracks(data.tracks || []);
      }
    } catch (_) {
    } finally {
      setMusicLoading(false);
    }
  };

  const handleTogglePlayMusic = (track: any) => {
    if (audioPlayer) {
      audioPlayer.pause();
    }
    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
      setAudioPlayer(null);
      return;
    }
    if (!track.previewUrl) {
      showToast(isRtl ? "پیش‌نمایش صوتی برای این موزیک در دسترس نیست" : "No preview audio available");
      return;
    }
    const audio = new Audio(track.previewUrl);
    audio.play().catch(() => {});
    audio.onended = () => {
      setPlayingTrackId(null);
      setAudioPlayer(null);
    };
    setAudioPlayer(audio);
    setPlayingTrackId(track.id);
  };

  // Text to Speech (TTS)
  const handleSpeakText = (textToSpeak?: string) => {
    const text = textToSpeak || ttsText;
    if (!text.trim()) {
      showToast(isRtl ? "متنی برای تبدیل به ویس وارد نشده است." : "Please enter text to speak");
      return;
    }
    if (!("speechSynthesis" in window)) {
      showToast(isRtl ? "مرورگر شما از تبدیل صوت پشتیبانی نمی‌کند." : "Browser does not support SpeechSynthesis");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;
    utterance.onstart = () => setTtsSpeaking(true);
    utterance.onend = () => setTtsSpeaking(false);
    utterance.onerror = () => setTtsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    showToast(isRtl ? "پخش ویس صوتی آغاز شد 🎙️" : "Speaking text...");
  };

  // Voice to Text (STT)
  const handleToggleSTT = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast(isRtl ? "مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند." : "Speech recognition not supported");
      return;
    }
    if (sttListening) {
      setSttListening(false);
      return;
    }
    try {
      const recognition = new SpeechRec();
      recognition.lang = isRtl ? "fa-IR" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onstart = () => setSttListening(true);
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSttTranscript(transcript);
        setTtsText(transcript);
      };
      recognition.onerror = () => setSttListening(false);
      recognition.onend = () => setSttListening(false);
      recognition.start();
    } catch (_) {
      setSttListening(false);
    }
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
                  {isRtl ? "سلف ساز سام‌کارن پرو (Samkaren Pro) | ابرسلف کازمیک" : "Samkaren Pro Super-Suite (Cosmic Edition)"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  SAMKAREN PRO EDITION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {isRtl
                  ? "مجموعه فوق‌العاده امکانات سلف سام‌کارن پرو: فضول‌گیر پروفایل، استخراج هوشمند آیدی، سرچ آهنگ زنده، متن به ویس، ساعت چند کشوره، بیو و اسم چرخشی، قفل‌های پیوی، دوست/دشمن و دستورات کلیکی."
                  : "Complete suite of Samkaren Pro & Cosmic self features: profile stalker, ID & entity resolver, live music search, text-to-speech, multi-clocks, rotating bio/name, PV shields, and cheat console."}
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
            <span>{isRtl ? "ذخیره تغییرات سام‌کارن پرو" : "Save Samkaren Pro Config"}</span>
          </button>
        </div>
      </div>

      {/* Internal Subtabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: "actions", label: isRtl ? "حالت‌های اکشن 🎭" : "Chat Actions", icon: Send, color: "text-amber-400" },
          { id: "stalker", label: isRtl ? "فضول‌گیر پروفایل 🕵️‍♂️" : "Profile Stalker", icon: Eye, color: "text-cyan-400" },
          { id: "intelligence", label: isRtl ? "استخراج آیدی و اطلاعات 🔍" : "ID Intelligence", icon: Search, color: "text-violet-400" },
          { id: "music", label: isRtl ? "سرچ آهنگ 🎵" : "Music Search", icon: Music, color: "text-rose-400" },
          { id: "voice", label: isRtl ? "متن به ویس و صوتی 🎙️" : "TTS & Voice", icon: Mic, color: "text-emerald-400" },
          { id: "clocks", label: isRtl ? "ساعت و بیو چرخشی ⏰" : "Clocks & Rotator", icon: Clock, color: "text-cyan-400" },
          { id: "shields", label: isRtl ? "قفل پیوی و نگهبان 🛡️" : "PV Shields & Guard", icon: Shield, color: "text-rose-400" },
          { id: "friends", label: isRtl ? "دوست و دشمن ⚔️" : "Friend & Enemy", icon: Users, color: "text-emerald-400" },
          { id: "stylist", label: isRtl ? "استایل متن و لوگو 🎨" : "Stylist & Logo", icon: Type, color: "text-purple-400" },
          { id: "translator", label: isRtl ? "مترجم چندزبانه 🌐" : "Translator", icon: Globe, color: "text-emerald-400" },
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

      {/* SUBTAB: PROFILE STALKER (فضول پروفایل) */}
      {activeTab === "stalker" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  <span>{isRtl ? "فضول‌گیر پروفایل و تعاملات ۲۴ ساعت اخیر" : "Profile Stalker & 24h Interactions"}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    REAL-TIME
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? "مشاهده تمامی افرادی که در ۲۴ ساعت گذشته به پیوی شما سر زده‌اند، پیام دادند یا تعامل داشته‌اند."
                    : "Real inspection of Telegram users who visited your PV, messaged you, or interacted in the past 24 hours."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFetchVisitors}
              disabled={stalkerLoading}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${stalkerLoading ? "animate-spin" : ""}`} />
              <span>{isRtl ? "اسکن زنده تعاملات پیوی" : "Scan Recent Visitors"}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-400 block">{isRtl ? "کل تعاملات شناسایی‌شده" : "Total Interactions"}</span>
              <span className="text-lg font-black text-white font-mono">{stalkerVisitors.length}</span>
            </div>
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-400 block">{isRtl ? "پیام‌های خوانده‌نشده" : "Unread Messages"}</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {stalkerVisitors.filter((v) => v.unreadCount > 0).length}
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-400 block">{isRtl ? "کاربران پرمیوم" : "Premium Users"}</span>
              <span className="text-lg font-black text-violet-400 font-mono">
                {stalkerVisitors.filter((v) => v.isPremium).length}
              </span>
            </div>
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-400 block">{isRtl ? "وضعیت سشن" : "Session State"}</span>
              <span className="text-xs font-bold text-cyan-400">
                {account?.isOnline ? (isRtl ? "آنلاین و متصل 🟢" : "Online") : (isRtl ? "آفلاین ⚪" : "Offline")}
              </span>
            </div>
          </div>

          {stalkerMsg && (
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{stalkerMsg}</span>
            </div>
          )}

          {/* Visitors List */}
          {stalkerVisitors.length === 0 ? (
            <div className="p-8 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center space-y-3">
              <Eye className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-300">
                {isRtl ? "هنوز بازدیدی برای نمایش واکشی نشده است" : "No visitors scanned yet"}
              </div>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                {isRtl
                  ? "روی دکمه «اسکن زنده تعاملات پیوی» در بالا کلیک کنید تا تمام گفتگوها و مراجعین ۲۴ ساعت گذشته مستقیماً از تلگرام بررسی و لیست شوند."
                  : "Click 'Scan Recent Visitors' above to inspect all dialogs and visitors from the last 24 hours."}
              </p>
              <button
                type="button"
                onClick={handleFetchVisitors}
                disabled={stalkerLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                {isRtl ? "اجرای اولین اسکن" : "Run First Scan"}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{isRtl ? `لیست مراجعین (${stalkerVisitors.length} نفر):` : `Visitor list (${stalkerVisitors.length}):`}</span>
                {stalkerLastScan && (
                  <span>
                    {isRtl ? "آخرین بررسی:" : "Last scan:"} {new Date(stalkerLastScan).toLocaleTimeString(isRtl ? "fa-IR" : "en-US")}
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {stalkerVisitors.map((vis, idx) => (
                  <div
                    key={vis.id || idx}
                    className="p-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-sm flex-shrink-0">
                        {vis.name ? vis.name.slice(0, 1) : "?"}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{vis.name}</span>
                          {vis.username && (
                            <span className="text-[11px] text-cyan-400 font-mono">{vis.username}</span>
                          )}
                          {vis.isPremium && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              ⭐️ Premium
                            </span>
                          )}
                          {vis.unreadCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {vis.unreadCount} پیام جدید
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap font-mono">
                          <span>آیدی: {vis.id}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-amber-400/90">{vis.interactionType}</span>
                          <span className="text-slate-500">•</span>
                          <span>{new Date(vis.timestamp).toLocaleTimeString(isRtl ? "fa-IR" : "en-US")}</span>
                        </div>

                        {vis.lastMessagePreview && (
                          <p className="text-[11px] text-slate-300/80 italic font-sans line-clamp-1">
                            «{vis.lastMessagePreview}»
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(vis.id);
                          showToast(isRtl ? `شناسه ${vis.id} کپی شد!` : "ID copied");
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                        title={isRtl ? "کپی شناسه عددی" : "Copy ID"}
                      >
                        <Copy className="w-3 h-3" />
                        <span>{isRtl ? "کپی آیدی" : "Copy ID"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const warningMsg = `⛔ اخطار: ورود شما به پیوی ثبت گردید. لطفاً از ارسال پیام‌های غیرکاری خودداری نمایید.`;
                          navigator.clipboard.writeText(warningMsg);
                          showToast(isRtl ? "متن اخطار کپی شد!" : "Warning text copied");
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] text-rose-300 flex items-center gap-1 transition-colors"
                        title={isRtl ? "کپی اخطار پیوی" : "Copy warning"}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{isRtl ? "اخطار" : "Warn"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: ID & ENTITY INTELLIGENCE (استخراج آیدی و اطلاعات) */}
      {activeTab === "intelligence" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {isRtl ? "استخراج هوشمند آیدی و مشخصات (اطلاعات کامل)" : "ID & Entity Intelligence Engine"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? "استعلام آیدی عددی کاربر، آیدی گروه، مالک اصلی گروه، آیدی کانال، و آمار کامل اکانت شما."
                    : "Extract numeric user ID, group ID, group owner/creator, channel ID, and deep account stats."}
                </p>
              </div>
            </div>
          </div>

          {/* Lookup Input */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              {isRtl
                ? "ورود یوزرنیم، لینک، شناسه عددی، یا کلمه me برای اکانت خودتان:"
                : "Enter @username, numeric ID, t.me link, or 'me':"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={entityQuery}
                onChange={(e) => setEntityQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookupEntity()}
                placeholder="e.g. @durov, -100123456789, t.me/telegram, me"
                dir="ltr"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500 font-mono"
              />
              <button
                type="button"
                onClick={handleLookupEntity}
                disabled={entityLoading}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-600/20"
              >
                <Search className={`w-3.5 h-3.5 ${entityLoading ? "animate-spin" : ""}`} />
                <span>{isRtl ? "استعلام فوری" : "Lookup"}</span>
              </button>
            </div>

            {entityError && (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{entityError}</span>
              </div>
            )}
          </div>

          {/* Lookup Result Display */}
          {entityResult && (
            <div className="p-5 bg-slate-950 rounded-2xl border border-violet-500/40 space-y-4 shadow-xl shadow-violet-500/5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40 uppercase">
                    {entityResult.entityType}
                  </span>
                  <h4 className="text-sm font-bold text-white">{entityResult.title}</h4>
                </div>
                {entityResult.username && (
                  <span className="text-xs text-violet-400 font-mono">{entityResult.username}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? "شناسه عددی کامل (Numeric ID):" : "Numeric ID:"}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">{entityResult.numericId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(entityResult.numericId);
                        showToast(isRtl ? "آیدی کپی شد!" : "ID copied");
                      }}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? "نوع ساختار:" : "Type:"}</span>
                  <span className="text-xs font-bold text-slate-200">
                    {entityResult.entityType === "channel"
                      ? "کانال رسمی / عمومی"
                      : entityResult.entityType === "supergroup"
                      ? "سوپرگروه تلگرام"
                      : entityResult.entityType === "group"
                      ? "گروه معمولی"
                      : entityResult.isBot
                      ? "ربات تلگرام (Bot)"
                      : "کاربر حقیقی تلگرام"}
                  </span>
                </div>

                {entityResult.participantsCount !== null && (
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">{isRtl ? "تعداد اعضا / مخاطبین:" : "Members count:"}</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {entityResult.participantsCount.toLocaleString()} نفر
                    </span>
                  </div>
                )}

                {entityResult.creator !== undefined && (
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">{isRtl ? "وضعیت مالکیت (Creator):" : "Ownership:"}</span>
                    <span className="text-xs font-bold text-amber-300">
                      {entityResult.creator ? "شما سازنده/مالک اصلی هستید ✅" : "کاربر عادی / ادمین"}
                    </span>
                  </div>
                )}

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? "اعتبارسنجی و نشان‌ها:" : "Badges:"}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entityResult.isVerified && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300">
                        تیک آبی رسمی ✓
                      </span>
                    )}
                    {entityResult.isPremium && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300">
                        پرمیوم ⭐️
                      </span>
                    )}
                    {entityResult.isScam && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300">
                        اسکم / کلاهبرداری ⚠️
                      </span>
                    )}
                    {!entityResult.isVerified && !entityResult.isPremium && !entityResult.isScam && (
                      <span className="text-xs text-slate-500">استاندارد</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deep Account Stats Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200">
                  {isRtl ? "آمار و اطلاعات جامع اکانت متصل شما (Account Deep Stats):" : "Deep Account Stats:"}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleFetchDeepAccountStats}
                disabled={loadingDeepStats}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${loadingDeepStats ? "animate-spin" : ""}`} />
                <span>{isRtl ? "بروزرسانی آمار اکانت" : "Refresh Stats"}</span>
              </button>
            </div>

            {accountDeepStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? "کل دیالوگ‌ها" : "Dialogs"}</span>
                  <span className="text-base font-bold font-mono text-cyan-300">{accountDeepStats.dialogsCount}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? "گروه‌ها" : "Groups"}</span>
                  <span className="text-base font-bold font-mono text-blue-300">{accountDeepStats.groupsCount}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? "کانال‌ها" : "Channels"}</span>
                  <span className="text-base font-bold font-mono text-violet-300">{accountDeepStats.channelsCount}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block">{isRtl ? "دیتاسنتر (DC)" : "Data Center"}</span>
                  <span className="text-base font-bold font-mono text-emerald-300">DC {accountDeepStats.dcId || 2}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? "برای مشاهده تفکیک دیالوگ‌ها، گروه‌ها، کانال‌ها و دیتاسنتر اکانت روی دکمه بروزرسانی کلیک کنید."
                    : "Click Refresh Stats to fetch deep account breakdown."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: MUSIC SEARCH ENGINE (سرچ آنلاین موزیک) */}
      {activeTab === "music" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {isRtl ? "جستجوی آنلاین آهنگ و پخش زنده (Music Search)" : "Online Music Search & Player"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? "جستجوی میلیون‌ها قطعه موسیقی ایرانی و جهانی، پخش استریم باکیفیت و دریافت مشخصات آهنگ."
                    : "Search millions of Persian & international songs, stream live preview, and download."}
                </p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 block">
              {isRtl ? "نام ترانه، خواننده یا آلبوم را وارد کنید:" : "Enter song name, artist, or album:"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={musicQuery}
                onChange={(e) => setMusicQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchMusic()}
                placeholder={isRtl ? "مثال: شادمهر عقیلی، معین، یاس، Coldplay..." : "e.g. Shadmehr, Coldplay, Adele..."}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleSearchMusic}
                disabled={musicLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Search className={`w-3.5 h-3.5 ${musicLoading ? "animate-spin" : ""}`} />
                <span>{isRtl ? "سرچ موزیک" : "Search"}</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-slate-500">{isRtl ? "پیشنهادات سریع:" : "Quick picks:"}</span>
              {["شادمهر عقیلی", "محسن چاوشی", "یاس", "Homayoun Shajarian", "Coldplay", "The Weeknd"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setMusicQuery(term);
                    fetch(`/api/cosmic/music-search?q=${encodeURIComponent(term)}`)
                      .then((r) => r.json())
                      .then((d) => d.success && setMusicTracks(d.tracks || []));
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Music Results Grid */}
          {musicTracks.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 px-1">
                {isRtl ? `نتایج جستجو (${musicTracks.length} قطعه پیدا شد):` : `Search results (${musicTracks.length}):`}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {musicTracks.map((t) => {
                  const isPlaying = playingTrackId === t.id;
                  const mins = Math.floor((t.durationSeconds || 0) / 60);
                  const secs = (t.durationSeconds || 0) % 60;
                  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                        isPlaying
                          ? "bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-500/10"
                          : "bg-slate-950/80 hover:bg-slate-900 border-slate-800"
                      }`}
                    >
                      {t.artwork ? (
                        <img
                          src={t.artwork}
                          alt={t.title}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                          <Music className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-white truncate" title={t.title}>
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{t.artist}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          {t.album && <span className="truncate max-w-[120px]">{t.album}</span>}
                          <span>•</span>
                          <span>{timeFormatted}</span>
                          {t.releaseYear && <span>• {t.releaseYear}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {t.previewUrl && (
                          <button
                            type="button"
                            onClick={() => handleTogglePlayMusic(t)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              isPlaying
                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse"
                                : "bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white"
                            }`}
                            title={isPlaying ? "توقف پخش" : "پخش پیش‌نمایش"}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const info = `🎵 آهنگ: ${t.title}\n🎤 خواننده: ${t.artist}\n💿 آلبوم: ${t.album || "-"}`;
                            navigator.clipboard.writeText(info);
                            showToast(isRtl ? "مشخصات آهنگ کپی شد!" : "Track info copied");
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors"
                          title="کپی مشخصات"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: VOICE & TTS (متن به ویس و ویس به متن) */}
      {activeTab === "voice" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  {isRtl ? "استودیوی تبدیل متن به ویس و گفتار به متن" : "Text-to-Speech & Speech-to-Text Studio"}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl
                    ? "تبدیل هر متن به پیام صوتی ویس با لهجه طبیعی و تبدیل صدای ضبط‌شده به متن تایپ شده."
                    : "Generate natural voice audio from text, and transcribe recorded microphone speech to text."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Text to Voice (TTS) */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs pb-1 border-b border-slate-800/80">
                <Volume2 className="w-4 h-4" />
                <span>{isRtl ? "۱. تبدیل متن به ویس (Text to Speech)" : "1. Text to Speech"}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  {isRtl ? "متن دلخواه جهت تبدیل به پیام صوتی:" : "Enter text to convert to voice:"}
                </label>
                <textarea
                  rows={4}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder={
                    isRtl
                      ? "متن خود را اینجا بنویسید (مثال: درود، پیام شما دریافت شد. در اسرع وقت پاسخ خواهم داد...)"
                      : "Type text here to convert to voice..."
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{isRtl ? "سرعت پخش صدا:" : "Speech Rate:"}</span>
                    <span className="font-mono text-emerald-400">{ttsRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{isRtl ? "زیر و بمی صدا (Pitch):" : "Voice Pitch:"}</span>
                    <span className="font-mono text-emerald-400">{ttsPitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSpeakText()}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg ${
                    ttsSpeaking
                      ? "bg-rose-500 text-white animate-pulse shadow-rose-500/20"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{ttsSpeaking ? (isRtl ? "درحال پخش صدا..." : "Speaking...") : (isRtl ? "پخش زنده ویس صوتی" : "Speak Voice")}</span>
                </button>

                {ttsSpeaking && (
                  <button
                    type="button"
                    onClick={() => {
                      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                      setTtsSpeaking(false);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                  >
                    {isRtl ? "توقف" : "Stop"}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Speech to Text (STT) */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs pb-1 border-b border-slate-800/80">
                <Mic className="w-4 h-4" />
                <span>{isRtl ? "۲. تبدیل ویس و گفتار به متن (Speech to Text)" : "2. Speech to Text"}</span>
              </div>

              <div className="text-center py-4 space-y-3">
                <button
                  type="button"
                  onClick={handleToggleSTT}
                  className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                    sttListening
                      ? "bg-rose-500 text-white animate-bounce shadow-rose-500/40"
                      : "bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40"
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </button>

                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200">
                    {sttListening
                      ? (isRtl ? "درحال شنیدن صدای شما... صحبت کنید" : "Listening... speak now")
                      : (isRtl ? "برای شروع ضبط صدا کلیک کنید" : "Click to start recording voice")}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isRtl ? "پشتیبانی از زبان فارسی و انگلیسی" : "Supports Persian & English"}
                  </div>
                </div>
              </div>

              {sttTranscript && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold block">{isRtl ? "متن تشخیص داده‌شده:" : "Transcribed Text:"}</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{sttTranscript}</p>
                  <div className="flex justify-end gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sttTranscript);
                        showToast(isRtl ? "متن کپی شد!" : "Text copied");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isRtl ? "کپی متن" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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

      {/* SUBTAB: MULTI-LANGUAGE TRANSLATOR */}
      {activeTab === "translator" && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {isRtl ? "مترجم هوشمند و زنده چندزبانه (Multi-Language Translator)" : "Real-time Multi-Language Translator"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    ۴۵+ زبان زنده
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRtl
                    ? "ترجمه آنی هر متن به بیش از ۴۵ زبان زنده دنیا با موتور هوشمند، امکان کپی و دستور اختصاصی تلگرام (.tr)."
                    : "Instant translation to 45+ world languages with auto-detection, one-click copy, and .tr self command."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
              <span className="text-emerald-400 font-bold">دستور سلف:</span>
              <span>.tr &lt;کد_زبان&gt; &lt;متن&gt;</span>
            </div>
          </div>

          {/* Language Selector Bar with Swap Button */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">زبان مبدا:</label>
              <select
                value={translateFrom}
                onChange={(e) => setTranslateFrom(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="auto">🌐 تشخیص خودکار زبان</option>
                <option value="fa">🇮🇷 فارسی</option>
                <option value="en">🇬🇧 انگلیسی</option>
                <option value="ar">🇸🇦 عربی</option>
                <option value="tr">🇹🇷 ترکی استانبولی</option>
                <option value="de">🇩🇪 آلمانی</option>
                <option value="fr">🇫🇷 فرانسوی</option>
                <option value="ru">🇷🇺 روسی</option>
                <option value="es">🇪🇸 اسپانیایی</option>
                <option value="it">🇮🇹 ایتالیایی</option>
                <option value="zh">🇨🇳 چینی</option>
                <option value="ja">🇯🇵 ژاپنی</option>
                <option value="ko">🇰🇷 کره‌ای</option>
                <option value="hi">🇮🇳 هندی</option>
                <option value="ur">🇵🇰 اردو</option>
                <option value="nl">🇳🇱 هلندی</option>
                <option value="pt">🇵🇹 پرتغالی</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSwapLanguages}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="جابجایی زبان مبدا و مقصد"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <label className="text-xs font-bold text-slate-400 whitespace-nowrap">زبان مقصد:</label>
              <select
                value={translateTo}
                onChange={(e) => setTranslateTo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="en">🇬🇧 انگلیسی (English)</option>
                <option value="fa">🇮🇷 فارسی (Persian)</option>
                <option value="ar">🇸🇦 عربی (Arabic)</option>
                <option value="tr">🇹🇷 ترکی استانبولی (Turkish)</option>
                <option value="de">🇩🇪 آلمانی (German)</option>
                <option value="fr">🇫🇷 فرانسوی (French)</option>
                <option value="ru">🇷🇺 روسی (Russian)</option>
                <option value="es">🇪🇸 اسپانیایی (Spanish)</option>
                <option value="it">🇮🇹 ایتالیایی (Italian)</option>
                <option value="zh">🇨🇳 چینی (Chinese)</option>
                <option value="ja">🇯🇵 ژاپنی (Japanese)</option>
                <option value="ko">🇰🇷 کره‌ای (Korean)</option>
                <option value="hi">🇮🇳 هندی (Hindi)</option>
                <option value="ur">🇵🇰 اردو (Urdu)</option>
                <option value="nl">🇳🇱 هلندی (Dutch)</option>
                <option value="pt">🇵🇹 پرتغالی (Portuguese)</option>
                <option value="sv">🇸🇪 سوئدی (Swedish)</option>
                <option value="az">🇦🇿 آذربایجانی (Azerbaijani)</option>
                <option value="ku">☀️ کردی (Kurdish)</option>
              </select>
            </div>
          </div>

          {/* Translation Input & Output Boxes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>متن اولیه برای ترجمه:</span>
                <span className="text-[10px] text-slate-500 font-mono">{translateInput.length} کاراکتر</span>
              </div>
              <textarea
                value={translateInput}
                onChange={(e) => setTranslateInput(e.target.value)}
                placeholder="متن خود را اینجا بنویسید یا کپی کنید..."
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setTranslateInput("")}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  پاک کردن متن
                </button>

                <button
                  type="button"
                  onClick={() => handleTranslate()}
                  disabled={translating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Globe className={`w-4 h-4 ${translating ? "animate-spin" : ""}`} />
                  <span>{translating ? "درحال ترجمه هوشمند..." : "ترجمه آنی متن 🌐"}</span>
                </button>
              </div>
            </div>

            {/* Output Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>نتیجه ترجمه ({translateTo.toUpperCase()}):</span>
                </span>
                {translateResult && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(translateResult, "tr-copy")}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {copiedText === "tr-copy" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === "tr-copy" ? "کپی شد!" : "کپی ترجمه"}</span>
                  </button>
                )}
              </div>

              <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 min-h-[120px] flex flex-col justify-between text-xs">
                {translateResult ? (
                  <div className="text-slate-100 font-medium whitespace-pre-wrap leading-relaxed">
                    {translateResult}
                  </div>
                ) : (
                  <div className="text-slate-600 text-center my-auto flex flex-col items-center gap-2">
                    <Globe className="w-8 h-8 opacity-20" />
                    <span>متن مورد نظرتان را وارد کرده و دکمه «ترجمه آنی متن» را بزنید.</span>
                  </div>
                )}

                {translateResult && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>موتور پردازش: ترجمه چندزبانه زنده</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(translateResult, "tr-copy")}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>کپی سریع</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Preset Samples */}
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-2.5">
            <span className="text-xs font-bold text-slate-400">نمونه عبارات سریع جهت تست و استفاده:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { text: "سلام روز بخیر، به اکانت رسمی من خوش آمدید!", to: "en", label: "فارسی به انگلیسی 🇬🇧" },
                { text: "Hello! Thank you for contacting me, I will reply shortly.", to: "fa", label: "انگلیسی به فارسی 🇮🇷" },
                { text: "مرحباً يا صديقي، أتمنى لك يوماً سعيداً وجميلاً.", to: "fa", label: "عربی به فارسی 🇮🇷" },
                { text: "Harika bir gün dilerim, nasılsınız?", to: "fa", label: "ترکی به فارسی 🇮🇷" },
                { text: "امیدوارم روز فوق‌العاده‌ای داشته باشید رفیق!", to: "ar", label: "فارسی به عربی 🇸🇦" },
                { text: "Best regards and have a great time!", to: "tr", label: "انگلیسی به ترکی 🇹🇷" },
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranslateInput(sample.text);
                    setTranslateTo(sample.to);
                    setTranslateFrom("auto");
                    handleTranslate(sample.text, sample.to, "auto");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{sample.label}:</span>
                  <span className="text-slate-500 font-normal truncate max-w-[160px]">"{sample.text}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Telegram Self Chat Shortcut Guide */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-950 to-slate-950 border border-cyan-500/20 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-200">
                نحوه استفاده از مترجم مستقیم در چت‌های تلگرام با اکانت سلف:
              </div>
              <p className="text-slate-400 leading-relaxed">
                هنگامی که اکانت سلف شما فعال است، کافیست در هر پیوی، گروه یا چتی دستور <code>.tr en سلام چطوری</code> را بفرستید تا سلف پیام شما را ویرایش کرده و ترجمه انگلیسی آن را قرار دهد.
                همچنین می‌توانید روی هر پیامی ریپلای بزنید و فقط <code>.tr fa</code> یا <code>.tr en</code> یا <code>.tr ar</code> بفرستید تا فوراً پیام ریپلای‌شده ترجمه شود!
              </p>
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
