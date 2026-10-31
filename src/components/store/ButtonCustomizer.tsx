import React, { useState, useEffect } from "react";
import {
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Palette,
  LayoutGrid,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eye,
  EyeOff,
  Smartphone,
  Crown,
  ExternalLink,
  Copy,
  Send,
  Wand2,
} from "lucide-react";
import {
  StoreBotSettings,
  StoreButtonTheme,
  StoreCustomButton,
  StoreKeyboardMode,
  StoreCategory,
} from "../../types";
import { Language } from "../../utils/i18n";
import { useConfirm } from "../ui/ConfirmProvider";

interface ButtonCustomizerProps {
  settings: StoreBotSettings;
  categories: StoreCategory[];
  lang: Language;
  onRefresh: () => void;
  showToast: (type: "success" | "error", text: string) => void;
}

const AIOGRAM_STYLES = [
  {
    id: "success",
    name: "Success (سبز تأیید)",
    shortName: "سبز (Success)",
    bg: "bg-emerald-600/90 text-white border-emerald-400/60 shadow-emerald-500/20",
    indicator: "🟢",
  },
  {
    id: "danger",
    name: "Danger (قرمز هشدار)",
    shortName: "قرمز (Danger)",
    bg: "bg-rose-600/90 text-white border-rose-400/60 shadow-rose-500/20",
    indicator: "🔴",
  },
  {
    id: "primary",
    name: "Primary (آبی تلگرام)",
    shortName: "آبی (Primary)",
    bg: "bg-blue-600/90 text-white border-blue-400/60 shadow-blue-500/20",
    indicator: "🔵",
  },
];

const ACTION_LABELS: Record<string, string> = {
  buy_category: "🛍️ باز کردن دسته‌بندی خرید",
  manage_self_tabchi: "🎛 پنل مدیریت سلف و تبچی (درون ربات)",
  setup_personal_bot: "🤖 اتصال ربات شخصی (BotFather API)",
  spambot_checker: "🩺 چکر سلامت شماره (@SpamBot)",
  my_account: "👤 مشخصات من / حساب کاربری",
  my_orders: "📦 پیگیری سفارشات و اتصال شماره",
  discount_coupon: "🎁 ثبت کد تخفیف",
  support: "📞 ارتباط با پشتیبانی",
  help: "📋 نمایش همه تعرفه‌ها و پکیج‌ها",
  rules: "📖 راهنمای اتصال خودکار و قوانین",
  custom_url: "🔗 لینک خارجی (URL)",
};

export const PREMIUM_EMOJI_PRESETS = [
  { icon: "⚡", label: "⚡ آیکون رسمی تلگرام (Free Topic Icon • free=true)", id: "5309832892262654231", isFree: true },
  { icon: "✅", label: "✅ تیک سبز رسمی (Free Topic Icon • free=true)", id: "5357121491508928442", isFree: true },
  { icon: "💎", label: "💎 الماس آبی Aiogram (Inline/Reply Button Icon)", id: "5310076249404621168", isFree: true },
  { icon: "🔥", label: "🔥 آتش متحرک Aiogram (Inline/Reply Button Icon)", id: "5310169226856644648", isFree: true },
  { icon: "🔥", label: "🔥 ایموجی پرمیوم تلگرام (RestrictedEmoji)", id: "5368324170671202286", isFree: false },
  { icon: "⭐", label: "⭐ ستاره طلایی پرمیوم (RestrictedEmoji)", id: "5370869711888194012", isFree: false },
];

function ensureButtonTextHasVisibleEmoji(rawText: string, emojiChar?: string): string {
  const clean = String(rawText || "").trim();
  if (!clean) return `${emojiChar || "💎"} دکمه`;
  const hasLeadingEmoji = /^[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(clean);
  if (hasLeadingEmoji) return clean;
  return `${emojiChar || "💎"} ${clean}`;
}

export function ButtonCustomizer({
  settings,
  categories,
  onRefresh,
  showToast,
}: ButtonCustomizerProps) {
  const { confirm } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [sendingOwnerMenu, setSendingOwnerMenu] = useState(false);
  const [ownerIdInput, setOwnerIdInput] = useState<string>(
    String(settings.ownerTelegramId || "")
  );
  const [webPanelUrl, setWebPanelUrl] = useState<string>(
    typeof window !== "undefined" ? `${window.location.origin}/?portal=store-admin` : "/?portal=store-admin"
  );
  const [quickEmojiPickerBtnId, setQuickEmojiPickerBtnId] = useState<string | null>(null);
  const [previewAdminOpen, setPreviewAdminOpen] = useState(false);
  const [syncingEmojis, setSyncingEmojis] = useState(false);
  const [testingLiveEmoji, setTestingLiveEmoji] = useState(false);
  const [sendingAiogramMenu, setSendingAiogramMenu] = useState(false);
  const [aiogramModalOpen, setAiogramModalOpen] = useState(false);
  const [aiogramCodeInfo, setAiogramCodeInfo] = useState<{
    aiogramInstalled: boolean;
    aiogramVersion: string;
    engineMode: string;
    pythonCode: string;
  } | null>(null);
  const [liveTestResult, setLiveTestResult] = useState<{
    success: boolean;
    telegramReturnedEmojiOnButton: boolean;
    diagnosis: string;
    freeIconIdUsed?: string;
    premiumIconIdUsed?: string;
    telegramErrorDescription?: string;
  } | null>(null);
  const [packUrlInput, setPackUrlInput] = useState("");
  const [discoveredServerEmojis, setDiscoveredServerEmojis] = useState<
    Array<{ id: string; emoji: string; setName?: string; isFree?: boolean }>
  >([]);
  const [emojiStatus, setEmojiStatus] = useState<{
    ok: boolean;
    reason?: string;
    description?: string;
    telegramReturnedEmojiInMarkup?: boolean;
  } | null>(null);

  // Settings state
  const [keyboardMode, setKeyboardMode] = useState<StoreKeyboardMode>(
    settings.keyboardMode || "hybrid"
  );
  const [buttonTheme, setButtonTheme] = useState<StoreButtonTheme>(
    settings.buttonTheme || "aiogram_colored"
  );
  const [buttonAiogramStyle, setButtonAiogramStyle] = useState<string>(
    settings.buttonAiogramStyle || "primary"
  );
  const [keyboardColumns, setKeyboardColumns] = useState<number>(
    settings.keyboardColumns || 2
  );
  const [replyKeyboardColumns, setReplyKeyboardColumns] = useState<number>(
    settings.replyKeyboardColumns || 2
  );
  const [allowSwitch, setAllowSwitch] = useState<boolean>(
    settings.allowCustomerKeyboardSwitch !== false
  );

  // Labels
  const [labels, setLabels] = useState({
    buySelf: settings.buttonLabels?.buySelf || "💎 خرید اکانت سلف زمان‌دار",
    buyTabchi: settings.buttonLabels?.buyTabchi || "🚀 خرید اکانت تبچی تبلیغاتی",
    buyCombo: settings.buttonLabels?.buyCombo || "⚡ پکیج VIP (سلف + تبچی)",
    plansCatalog: settings.buttonLabels?.plansCatalog || "🛍️ تعرفه‌ها و لیست پکیج‌ها",
    myOrders: settings.buttonLabels?.myOrders || "📦 پیگیری سفارشات من",
    myAccount: settings.buttonLabels?.myAccount || "👤 مشخصات من / حساب کاربری",
    support: settings.buttonLabels?.support || "📞 پشتیبانی و راهنما",
    helpGuide: settings.buttonLabels?.helpGuide || "📖 آموزش اتصال خودکار",
    applyDiscount: settings.buttonLabels?.applyDiscount || "🎁 ثبت کد تخفیف",
    switchKeyboard: settings.buttonLabels?.switchKeyboard || "🔄 تغییر حالت کیبورد",
  });

  // Custom Buttons
  const [customButtons, setCustomButtons] = useState<StoreCustomButton[]>(
    settings.customButtons && settings.customButtons.length > 0 ? settings.customButtons : []
  );

  useEffect(() => {
    if (settings.customButtons) {
      setCustomButtons(settings.customButtons);
    }
    setOwnerIdInput(String(settings.ownerTelegramId || ""));
  }, [settings.customButtons, settings.ownerTelegramId]);

  useEffect(() => {
    fetch("/api/store-bot/admin-credentials")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.webPanelUrl) {
          let url = String(json.webPanelUrl);
          if (
            typeof window !== "undefined" &&
            (url.includes("localhost") || url.includes("127.0.0.1")) &&
            !window.location.origin.includes("localhost")
          ) {
            try {
              const parsed = new URL(url);
              url = `${window.location.origin}${parsed.pathname}${parsed.search}`;
            } catch (_) {
              url = `${window.location.origin}/?portal=store-admin`;
            }
          }
          setWebPanelUrl(url);
        }
      })
      .catch(() => {});

    fetch("/api/store-bot/custom-emoji-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success) {
          if (Array.isArray(json.discoveredEmojis)) {
            setDiscoveredServerEmojis(json.discoveredEmojis);
          }
          if (json.status) {
            setEmojiStatus(json.status);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Add / Edit Button modal
  const [btnModalOpen, setBtnModalOpen] = useState(false);
  const [editingBtn, setEditingBtn] = useState<StoreCustomButton | null>(null);

  const [btnText, setBtnText] = useState("");
  const [btnAction, setBtnAction] = useState<StoreCustomButton["action"]>("buy_category");
  const [btnTargetCat, setBtnTargetCat] = useState("self");
  const [btnTargetUrl, setBtnTargetUrl] = useState("");
  const [btnStyle, setBtnStyle] = useState<StoreCustomButton["style"]>("success");
  const [btnCustomEmojiId, setBtnCustomEmojiId] = useState("");
  const [btnRow, setBtnRow] = useState(0);
  const [btnCol, setBtnCol] = useState(0);

  const openAddButtonModal = () => {
    setEditingBtn(null);
    setBtnText("💎 دکمه سفارشی جدید");
    setBtnAction("buy_category");
    setBtnTargetCat(categories[0]?.id || "self");
    setBtnTargetUrl("");
    setBtnStyle("success");
    setBtnCustomEmojiId(discoveredServerEmojis[0]?.id || "5309832892262654231");
    const maxRow = customButtons.reduce((max, b) => Math.max(max, b.rowIndex || 0), 0);
    setBtnRow(customButtons.length > 0 ? maxRow + 1 : 0);
    setBtnCol(0);
    setBtnModalOpen(true);
  };

  const openEditButtonModal = (b: StoreCustomButton) => {
    setEditingBtn(b);
    setBtnText(b.text);
    setBtnAction(b.action);
    setBtnTargetCat(b.targetCategoryId || "self");
    setBtnTargetUrl(b.url || "");
    setBtnStyle(b.style || "primary");
    setBtnCustomEmojiId(b.customEmojiId || "");
    setBtnRow(b.rowIndex || 0);
    setBtnCol(b.columnIndex || 0);
    setBtnModalOpen(true);
  };

  const persistButtonsImmediately = async (nextButtons: StoreCustomButton[], toastMsg?: string) => {
    setCustomButtons(nextButtons);
    try {
      await fetch("/api/store-bot/custom-buttons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buttons: nextButtons }),
      });
      if (toastMsg) showToast("success", toastMsg);
      onRefresh();
    } catch (_) {}
  };

  const handleQuickAssignPremiumEmoji = async (btnId: string, emojiId: string, emojiLabel?: string) => {
    const matchedPreset =
      discoveredServerEmojis.find((e) => e.id === emojiId) ||
      PREMIUM_EMOJI_PRESETS.find((p) => p.id === emojiId);
    const iconChar = (matchedPreset as any)?.emoji || (matchedPreset as any)?.icon || "💎";
    const nextList = customButtons.map((b) =>
      b.id === btnId
        ? {
            ...b,
            text: emojiId ? ensureButtonTextHasVisibleEmoji(b.text, iconChar) : b.text,
            customEmojiId: emojiId || undefined,
          }
        : b
    );
    setQuickEmojiPickerBtnId(null);
    await persistButtonsImmediately(
      nextList,
      emojiId
        ? `ایموجی پرمیوم (${emojiLabel || emojiId}) روی دکمه فعال شد ✨`
        : "ایموجی پرمیوم از روی دکمه برداشته شد."
    );
  };

  const handleSyncRealTelegramEmojis = async () => {
    setSyncingEmojis(true);
    try {
      const res = await fetch("/api/store-bot/sync-custom-emojis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packUrlOrName: packUrlInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "خطا در همگام‌سازی ایموجی‌های پرمیوم از تلگرام");
      }
      if (Array.isArray(json.customButtons)) {
        setCustomButtons(json.customButtons);
      }
      if (Array.isArray(json.discoveredEmojis)) {
        setDiscoveredServerEmojis(json.discoveredEmojis);
      }
      if (json.emojiStatus) {
        setEmojiStatus(json.emojiStatus);
      }
      showToast(
        "success",
        json.message || "ایموجی‌های پرمیوم واقعی از سرور تلگرام دریافت و روی دکمه‌ها تنظیم شدند!"
      );
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSyncingEmojis(false);
    }
  };

  const handleAutoAssignPremiumEmojisToAll = async () => {
    const verifiedPool =
      discoveredServerEmojis.length > 0
        ? discoveredServerEmojis
        : PREMIUM_EMOJI_PRESETS.map((p) => ({ id: p.id, emoji: p.icon, isFree: p.isFree }));
    const nextList = customButtons.map((b, idx) => {
      const picked = verifiedPool[idx % verifiedPool.length] || { id: "5309832892262654231", emoji: "⚡" };
      return {
        ...b,
        text: ensureButtonTextHasVisibleEmoji(b.text, picked.emoji),
        customEmojiId: picked.id,
      };
    });
    await persistButtonsImmediately(
      nextList,
      "✨ شناسه‌های معتبر ایموجی تلگرام (Aiogram & Free Topic Icons) روی تمام دکمه‌های ربات ست شدند!"
    );
  };

  const handleSendViaPythonAiogram = async () => {
    setSendingAiogramMenu(true);
    setLiveTestResult(null);
    try {
      const res = await fetch("/api/store-bot/send-via-aiogram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: ownerIdInput.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || json.error || "خطا در ارسال با موتور پایتون Aiogram");
      }
      setLiveTestResult({
        success: true,
        telegramReturnedEmojiOnButton: Boolean(json.telegram_returned_emoji_on_button),
        diagnosis: json.diagnosis || "منو با موتور پایتون Aiogram ارسال شد.",
      });
      showToast("success", "🐍 منوی ربات با کتابخانه پایتون Aiogram (InlineKeyboardBuilder & KeyboardBuilder) به تلگرام ارسال شد!");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSendingAiogramMenu(false);
    }
  };

  const handleOpenAiogramCodeModal = async () => {
    setAiogramModalOpen(true);
    try {
      const res = await fetch("/api/store-bot/aiogram-code");
      const json = await res.json();
      if (json?.success) {
        setAiogramCodeInfo({
          aiogramInstalled: Boolean(json.aiogramInstalled),
          aiogramVersion: json.aiogramVersion || "3.25.0",
          engineMode: json.engineMode || "aiogram-v3-botapi-9.4",
          pythonCode: json.pythonCode || "",
        });
      }
    } catch (_) {}
  };

  const handleTestLiveEmojiInTelegram = async () => {
    setTestingLiveEmoji(true);
    setLiveTestResult(null);
    try {
      const res = await fetch("/api/store-bot/test-custom-emoji-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: ownerIdInput.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok && !json.diagnosis) {
        throw new Error(json.message || "خطا در اجرای تست زنده ایموجی در تلگرام");
      }
      setLiveTestResult(json);
      if (json.telegramReturnedEmojiOnButton) {
        showToast("success", "✅ تلگرام فیلد icon_custom_emoji_id را روی دکمه تأیید و رندر کرد!");
      } else {
        showToast("error", json.diagnosis || "تلگرام فیلد icon_custom_emoji_id را از روی دکمه حذف کرد (بررسی نتیجه تست).");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setTestingLiveEmoji(false);
    }
  };

  const handleSaveOwnerIdQuick = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/store-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerTelegramId: ownerIdInput.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          "success",
          ownerIdInput.trim()
            ? `آیدی عددی مالک (${ownerIdInput.trim()}) ثبت شد! اکنون دکمه «👑 پنل مدیریت» و ورود به پنل تحت وب برای مالک در ربات فعال است.`
            : "آیدی عددی مالک بروزرسانی شد."
        );
        onRefresh();
      } else {
        showToast("error", json.message || "خطا در ذخیره آیدی مالک");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendAdminPanelToTelegram = async () => {
    if (!ownerIdInput.trim()) {
      showToast("error", "لطفاً ابتدا آیدی عددی مالک ربات را وارد نمایید.");
      return;
    }
    setSendingOwnerMenu(true);
    try {
      await fetch("/api/store-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerTelegramId: ownerIdInput.trim() }),
      });
      const res = await fetch("/api/store-bot/send-admin-panel-to-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerTelegramId: ownerIdInput.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        onRefresh();
      } else {
        showToast("error", json.message || "خطا در ارسال به تلگرام مالک");
      }
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSendingOwnerMenu(false);
    }
  };

  const handleSaveButton = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!btnText.trim()) {
      showToast("error", "متن دکمه را وارد فرمایید.");
      return;
    }

    const cleanId = btnCustomEmojiId.trim();
    const matchedPreset =
      discoveredServerEmojis.find((em) => em.id === cleanId) ||
      PREMIUM_EMOJI_PRESETS.find((p) => p.id === cleanId);
    const iconChar = (matchedPreset as any)?.emoji || (matchedPreset as any)?.icon || "💎";

    const newBtn: StoreCustomButton = {
      id: editingBtn ? editingBtn.id : `btn-${Date.now()}`,
      text: ensureButtonTextHasVisibleEmoji(btnText.trim(), iconChar),
      action: btnAction,
      targetCategoryId: btnAction === "buy_category" ? btnTargetCat : undefined,
      url: btnAction === "custom_url" ? btnTargetUrl.trim() : undefined,
      style: btnStyle === "success" || btnStyle === "danger" || btnStyle === "primary" ? btnStyle : "primary",
      customEmojiId: cleanId || undefined,
      rowIndex: Number(btnRow) || 0,
      columnIndex: Number(btnCol) || 0,
      isActive: editingBtn ? editingBtn.isActive !== false : true,
    };

    const nextList = editingBtn
      ? customButtons.map((b) => (b.id === editingBtn.id ? newBtn : b))
      : [...customButtons, newBtn];

    setBtnModalOpen(false);
    await persistButtonsImmediately(
      nextList,
      editingBtn
        ? "دکمه ویرایش شد و به صورت زنده در کیبورد ربات اعمال گردید."
        : "دکمه جدید اضافه شد و به صورت زنده در کیبورد ربات اعمال گردید."
    );
  };

  const handleDeleteButton = async (id: string) => {
    const ok = await confirm({
      title: "حذف دکمه از منوی ربات",
      message: "آیا مطمئن هستید که می‌خواهید این دکمه را حذف کنید؟ (هر زمان بخواهید می‌توانید با دکمه بازگردانی پیش‌فرض، دکمه‌های اصلی را برگردانید)",
      confirmText: "بله، حذف کن",
      cancelText: "انصراف",
      variant: "danger",
    });
    if (!ok) return;

    const nextList = customButtons.filter((b) => b.id !== id);
    await persistButtonsImmediately(nextList, "دکمه حذف شد و منوی ربات بروزرسانی گردید.");
  };

  const handleToggleActive = async (id: string) => {
    const nextList = customButtons.map((b) =>
      b.id === id ? { ...b, isActive: b.isActive === false ? true : false } : b
    );
    await persistButtonsImmediately(nextList);
  };

  const handleMoveButton = async (index: number, direction: "up" | "down") => {
    const sorted = [...customButtons].sort((a, b) => {
      if ((a.rowIndex || 0) !== (b.rowIndex || 0)) return (a.rowIndex || 0) - (b.rowIndex || 0);
      return (a.columnIndex || 0) - (b.columnIndex || 0);
    });
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap positions
    const tempRow = sorted[index].rowIndex;
    const tempCol = sorted[index].columnIndex;
    sorted[index] = {
      ...sorted[index],
      rowIndex: sorted[targetIdx].rowIndex,
      columnIndex: sorted[targetIdx].columnIndex,
    };
    sorted[targetIdx] = {
      ...sorted[targetIdx],
      rowIndex: tempRow,
      columnIndex: tempCol,
    };

    if (sorted[index].rowIndex === sorted[targetIdx].rowIndex && sorted[index].columnIndex === sorted[targetIdx].columnIndex) {
      sorted.forEach((btn, idx) => {
        btn.rowIndex = Math.floor(idx / 2);
        btn.columnIndex = idx % 2;
      });
    }

    await persistButtonsImmediately([...sorted]);
  };

  const handleQuickCycleColor = async (id: string) => {
    const order: Array<StoreCustomButton["style"]> = ["success", "danger", "primary"];
    const nextList = customButtons.map((b) => {
      if (b.id !== id) return b;
      const cur = b.style === "success" || b.style === "danger" || b.style === "primary" ? b.style : "primary";
      const idx = order.indexOf(cur);
      const nextStyle = order[(idx + 1) % order.length];
      return { ...b, style: nextStyle };
    });
    await persistButtonsImmediately(nextList, "رنگ دکمه در کیبورد ربات بروزرسانی شد.");
  };

  const handleResetToDefaults = async () => {
    const ok = await confirm({
      title: "بازگردانی به دکمه‌ها و تنظیمات پیش‌فرض",
      message:
        "آیا می‌خواهید تمام دکمه‌های ربات فروشگاهی (خرید سلف، تبچی، مشخصات من، مدیریت سلف و تبچی، ربات شخصی و چکر سلامت شماره) با چیدمان و رنگ‌بندی استاندارد اولیه بازگردانی شوند؟",
      confirmText: "بله، بازگردانی به حالت پیش‌فرض",
      cancelText: "انصراف",
      variant: "danger",
    });
    if (!ok) return;

    setResetting(true);
    try {
      const res = await fetch("/api/store-bot/reset-buttons", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "خطا در بازگردانی دکمه‌های پیش‌فرض");
      }
      if (Array.isArray(json.customButtons)) {
        setCustomButtons(json.customButtons);
      }
      showToast("success", json.message || "دکمه‌های پیش‌فرض با موفقیت بازگردانی و فعال شدند!");
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/store-bot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerTelegramId: ownerIdInput.trim(),
          keyboardMode,
          buttonTheme,
          buttonAiogramStyle: buttonAiogramStyle as any,
          keyboardColumns: keyboardColumns as any,
          replyKeyboardColumns: replyKeyboardColumns as any,
          allowCustomerKeyboardSwitch: allowSwitch,
          buttonLabels: labels,
          customButtons,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "خطا در ذخیره چیدمان دکمه‌ها");
      }

      showToast(
        "success",
        "تنظیمات کیبورد، ایموجی‌های پرمیوم، آیدی مالک و دکمه‌ها با موفقیت در ربات ذخیره شد."
      );
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Sort buttons by rowIndex & columnIndex for display & preview
  const sortedButtons = [...customButtons].sort((a, b) => {
    if ((a.rowIndex || 0) !== (b.rowIndex || 0)) return (a.rowIndex || 0) - (b.rowIndex || 0);
    return (a.columnIndex || 0) - (b.columnIndex || 0);
  });

  // Group active buttons by row for live preview
  const activePreviewRows = (() => {
    const active = sortedButtons.filter((b) => b.isActive !== false);
    const map = new Map<number, StoreCustomButton[]>();
    for (const b of active) {
      const r = b.rowIndex ?? 0;
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(b);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map((entry) => entry[1]);
  })();

  const allAvailableEmojiPresets = (() => {
    const map = new Map<string, { icon: string; label: string; id: string; isFree?: boolean }>();
    for (const em of discoveredServerEmojis) {
      if (em?.id && !map.has(em.id)) {
        map.set(em.id, {
          icon: em.emoji || "✨",
          label: `${em.emoji || "✨"} ${em.isFree ? "Free Icon" : "Premium"} (${em.id.slice(-4)})`,
          id: em.id,
          isFree: em.isFree,
        });
      }
    }
    for (const p of PREMIUM_EMOJI_PRESETS) {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    }
    return Array.from(map.values());
  })();

  const getPresetEmojiById = (emojiId?: string) => {
    if (!emojiId) return null;
    const foundServer = discoveredServerEmojis.find((e) => e.id === emojiId);
    if (foundServer) {
      return {
        icon: foundServer.emoji || "✨",
        label: `${foundServer.emoji || "✨"} (${emojiId.slice(-4)})`,
        id: emojiId,
      };
    }
    return PREMIUM_EMOJI_PRESETS.find((p) => p.id === emojiId) || {
      icon: "✨",
      label: `پرمیوم (${emojiId.slice(-4)})`,
      id: emojiId,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl shadow-cyan-950/10">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <LayoutGrid className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100">
              مدیریت دکمه‌ها، ایموجی‌های پرمیوم تلگرام و دکمه پنل مدیریت مالک
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              پشتیبانی از Telegram Premium Emoji ✨
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            برای هر دکمه ربات فروشگاهی (شیشه‌ای و کیبوردی) ایموجی پرمیوم متحرک تلگرام و رنگ Aiogram انتخاب کنید، و آیدی عددی مالک ربات را ثبت نمایید تا دکمه «👑 پنل مدیریت» به همراه پنل مدیریت تحت وب برای مالک فعال شود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleAutoAssignPremiumEmojisToAll}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            title="ست کردن خودکار ایموجی‌های پرمیوم متحرک روی تمامی دکمه‌های ربات"
          >
            <Wand2 className="w-4 h-4 text-purple-300" />
            <span>افزودن خودکار ایموجی پرمیوم به همه دکمه‌ها</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={resetting || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {resetting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            بازگردانی دکمه‌های پیش‌فرض
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            ذخیره تغییرات دکمه‌ها و کیبورد
          </button>
        </div>
      </div>

      {/* Dedicated Owner Numeric ID & Web Management Panel Card */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-rose-950/40 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-lg shadow-amber-500/10">
              <Crown className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black text-white">
                  تنظیم آیدی عددی مالک ربات و دکمه «👑 پنل مدیریت» (پنل تحت وب مدیریت ربات)
                </h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    ownerIdInput.trim()
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  }`}
                >
                  {ownerIdInput.trim() ? `فعال برای آیدی: ${ownerIdInput.trim()}` : "آیدی عددی مالک هنوز وارد نشده"}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                وقتی آیدی عددی مالک ربات را در کادر زیر وارد کنید، در منوی ربات تلگرام فقط برای مالک دکمه ویژه <strong className="text-amber-300">«👑 پنل مدیریت»</strong> نمایش داده می‌شود. به محض زدن این دکمه در تلگرام، دکمه <strong className="text-cyan-300">«🌐 ورود به پنل تحت وب مدیریت ربات»</strong> باز می‌شود تا مالک بتواند کل ربات را تحت وب مدیریت کند!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href={webPanelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>باز کردن پنل تحت وب مدیریت ربات</span>
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(webPanelUrl);
                showToast("success", "لینک مستقیم پنل تحت وب مدیریت ربات کپی شد!");
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>کپی لینک وب‌پنل</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80 items-end">
          <div className="lg:col-span-6">
            <label className="block text-xs font-bold text-amber-200 mb-1.5">
              آیدی عددی اکانت تلگرام مالک ربات (Numeric Telegram User ID):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ownerIdInput}
                onChange={(e) => setOwnerIdInput(e.target.value)}
                placeholder="مثال: 654321987 (می‌توانید چند آیدی را با ویرگول جدا کنید)"
                dir="ltr"
                className="flex-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:border-amber-400 outline-none"
              />
              <button
                type="button"
                onClick={handleSaveOwnerIdQuick}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت آیدی مالک</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSendAdminPanelToTelegram}
              disabled={sendingOwnerMenu}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {sendingOwnerMenu ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Send className="w-4 h-4 text-emerald-400" />
              )}
              <span>ارسال تست دکمه «👑 پنل مدیریت» به تلگرام مالک</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telegram Premium Custom Emoji Sync & Owner Premium Requirement Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-cyan-950/40 border border-purple-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black text-white">
                  همگام‌سازی ایموجی‌های پرمیوم تلگرام روی دکمه‌ها (icon_custom_emoji_id)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40">
                  {discoveredServerEmojis.length > 0
                    ? `${discoveredServerEmojis.length} ایموجی رسمی تأییدشده`
                    : "آماده همگام‌سازی از سرور تلگرام"}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-amber-300">نکته مهم قوانین تلگرام:</strong> طبق محدودیت رسمی Bot API تلگرام، برای نمایش ایموجی‌های پرمیوم متحرک روی دکمه‌های شیشه‌ای و کیبوردی،{" "}
                <strong className="text-white underline decoration-amber-400">
                  اکانت تلگرامی که توکن ربات را در @BotFather ساخته است (مالک ربات) باید اشتراک تلگرام پرمیوم (Telegram Premium) فعال داشته باشد
                </strong>{" "}
                و شناسه ۱۹ رقمی ایموجی نیز باید در سرور تلگرام معتبر باشد.
              </p>
              <p className="text-[11px] text-cyan-300 leading-relaxed">
                💡 <strong>ترفند سریع:</strong> همچنین می‌توانید هر ایموجی پرمیوم دلخواهی را مستقیماً در تلگرام برای ربات بفرستید؛ ربات خودکار کد ۱۹ رقمی واقعی آن را استخراج کرده و با ۱ کلیک روی دکمه دلخواه شما ست می‌کند!
              </p>
            </div>
          </div>

          {emojiStatus && emojiStatus.reason === "owner_premium_required" && (
            <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs max-w-md">
              ⚠️ تلگرام اعلام کرد اکانت سازنده این ربات در @BotFather فاقد اشتراک Telegram Premium است؛ بنابراین تلگرام دکمه‌ها را با رنگ Aiogram نمایش می‌دهد اما ایموجی متحرک داخل دکمه را مخفی می‌کند.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80 items-end">
          <div className="lg:col-span-7">
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              لینک پک ایموجی پرمیوم تلگرام (اختیاری - مثال: https://t.me/addemoji/RestrictedEmoji):
            </label>
            <input
              type="text"
              value={packUrlInput}
              onChange={(e) => setPackUrlInput(e.target.value)}
              placeholder="لینک پک t.me/addemoji/... یا نام پک یا شناسه ۱۹ رقمی (خالی بگذارید = پک رسمی تلگرام)"
              dir="ltr"
              className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-200 focus:border-purple-400 outline-none"
            />
          </div>
          <div className="lg:col-span-5 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSyncRealTelegramEmojis}
              disabled={syncingEmojis}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {syncingEmojis ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>دریافت ایموجی‌های رسمی (Aiogram Sync)</span>
            </button>

            <button
              type="button"
              onClick={handleSendViaPythonAiogram}
              disabled={sendingAiogramMenu}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              title="ارسال منوی ربات با کتابخانه پایتون Aiogram v3.25 (InlineKeyboardBuilder & KeyboardButton)"
            >
              {sendingAiogramMenu ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>🐍 ارسال با پایتون Aiogram</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAiogramCodeModal}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="مشاهده کد پایتون Aiogram v3 برای دکمه‌های رنگی و ایموجی پرمیوم"
            >
              <span>💻 کد Aiogram</span>
            </button>

            <button
              type="button"
              onClick={handleTestLiveEmojiInTelegram}
              disabled={testingLiveEmoji}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              title="ارسال پیام تست به تلگرام مالک و بررسی مستقیم پاسخ سرور تلگرام (result.reply_markup)"
            >
              {testingLiveEmoji ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>🧪 تست زنده</span>
            </button>
          </div>
        </div>

        {liveTestResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              liveTestResult.telegramReturnedEmojiOnButton
                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-200"
                : "bg-amber-950/50 border-amber-500/50 text-amber-200"
            }`}
          >
            <div className="font-black flex items-center justify-between">
              <span>📊 نتیجه تست مستقیم سرور تلگرام (بررسی فیلد icon_custom_emoji_id روی دکمه):</span>
              <span className="font-mono text-[10px]">
                {liveTestResult.telegramReturnedEmojiOnButton ? "ACTIVE ✅" : "STRIPPED BY TELEGRAM ⚠️"}
              </span>
            </div>
            <p className="leading-relaxed">{liveTestResult.diagnosis}</p>
          </div>
        )}

        {discoveredServerEmojis.length > 0 && (
          <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
            <div className="text-[11px] text-slate-400 font-semibold">
              ایموجی‌های تأییدشده توسط سرور تلگرام — شامل <span className="text-emerald-300">Free Topic Icons (free=true)</span> و <span className="text-purple-300">emojiGroupPremium</span> (کلیک برای کپی شناسه):
            </div>
            <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto">
              {discoveredServerEmojis.slice(0, 36).map((em) => (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(em.id);
                    showToast("success", `شناسه ایموجی (${em.id}) کپی شد!`);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                    em.isFree
                      ? "bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 text-emerald-200"
                      : "bg-slate-950 hover:bg-purple-950/60 border-slate-800 hover:border-purple-500/50 text-slate-200"
                  }`}
                  title={`کپی شناسه ${em.id} (${em.isFree ? "documentAttributeCustomEmoji.free = true" : "Premium"})`}
                >
                  <span className="text-sm">{em.emoji || "✨"}</span>
                  <span className="font-mono text-[10px] opacity-85">{em.id.slice(-6)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Keyboards Configuration & Live Telegram Preview */}
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl space-y-4 shadow-lg">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              تنظیمات ساختاری کیبورد و رنگ‌بندی
            </h4>

            {/* Keyboard Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                حالت نمایش دکمه‌ها در ربات
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setKeyboardMode("inline")}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    keyboardMode === "inline"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  شیشه‌ای (Inline)
                </button>
                <button
                  type="button"
                  onClick={() => setKeyboardMode("reply")}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    keyboardMode === "reply"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  کیبورد باتن (Reply)
                </button>
                <button
                  type="button"
                  onClick={() => setKeyboardMode("hybrid")}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    keyboardMode === "hybrid"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  هر دو (Hybrid)
                </button>
              </div>
            </div>

            {/* Theme / Aiogram Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                تم کلی دکمه‌های ربات
              </label>
              <select
                value={buttonTheme}
                onChange={(e) => setButtonTheme(e.target.value as any)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="aiogram_colored">
                  استایل رنگی Aiogram (سبز Success، قرمز Danger، آبی Primary)
                </option>
                <option value="cyber_neon">تم سایبر نئون (Cyber Neon 💎)</option>
                <option value="galaxy_purple">تم کهکشانی بنفش (Galaxy Purple 🔮)</option>
                <option value="luxury_gold">تم طلایی سلطنتی (Luxury Gold 👑)</option>
                <option value="crypto_cyan">تم کریپتویی فیروزه‌ای (Crypto Cyan 💠)</option>
                <option value="emerald_matrix">تم سبز ماتریکس (Emerald Matrix 🟢)</option>
                <option value="fire_red">تم قرمز آتشین (Fire Red 🔥)</option>
              </select>
            </div>

            {/* Default Aiogram Style for primary action */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رنگ پیش‌فرض Aiogram برای دکمه‌های سیستمی
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AIOGRAM_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setButtonAiogramStyle(st.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                      st.bg
                    } ${buttonAiogramStyle === st.id ? "ring-2 ring-white shadow-lg" : "opacity-75"}`}
                  >
                    <span className="truncate">{st.shortName}</span>
                    <span>{st.indicator}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ستون‌های شیشه‌ای
                </label>
                <select
                  value={keyboardColumns}
                  onChange={(e) => setKeyboardColumns(Number(e.target.value))}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value={1}>۱ دکمه در هر سطر</option>
                  <option value={2}>۲ دکمه در هر سطر (پیش‌فرض)</option>
                  <option value={3}>۳ دکمه در هر سطر</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ستون‌های کیبورد باتن
                </label>
                <select
                  value={replyKeyboardColumns}
                  onChange={(e) => setReplyKeyboardColumns(Number(e.target.value))}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value={1}>۱ دکمه در هر سطر</option>
                  <option value={2}>۲ دکمه در هر سطر</option>
                  <option value={3}>۳ دکمه در هر سطر</option>
                </select>
              </div>
            </div>

            {/* Customer Keyboard Switch */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-300">
                اجازه تغییر حالت کیبورد توسط مشتری در ربات
              </span>
              <input
                type="checkbox"
                checked={allowSwitch}
                onChange={(e) => setAllowSwitch(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Live Telegram Bot Keyboard Preview */}
          <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100">
                  پیش‌نمایش زنده دکمه‌های ربات و پنل مدیریت
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {activePreviewRows.reduce((acc, r) => acc + r.length, 0)} دکمه فعال
              </span>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
              {!previewAdminOpen ? (
                <>
                  {activePreviewRows.map((row, rIdx) => (
                    <div
                      key={rIdx}
                      className="grid gap-1.5"
                      style={{ gridTemplateColumns: `repeat(${Math.min(row.length, 3)}, minmax(0, 1fr))` }}
                    >
                      {row.map((b) => {
                        const st = AIOGRAM_STYLES.find((s) => s.id === b.style) || AIOGRAM_STYLES[2];
                        const pe = getPresetEmojiById(b.customEmojiId);
                        const isAdminBtn = b.text && b.text.includes("پنل مدیریت");
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              if (isAdminBtn) {
                                setPreviewAdminOpen(true);
                              } else {
                                showToast("success", `پیش‌نمایش کلیک روی دکمه: «${b.text}»`);
                              }
                            }}
                            className={`px-2.5 py-2 rounded-lg text-[11px] font-bold border text-center truncate flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95 ${st.bg}`}
                            title={`${b.text} ${pe ? `• ایموجی پرمیوم: ${pe.id}` : ""}`}
                          >
                            {pe ? (
                              <span className="inline-flex items-center justify-center px-1 py-0.2 rounded bg-amber-400/25 border border-amber-300/50 text-[10px] animate-pulse">
                                {pe.icon}
                              </span>
                            ) : (
                              <span>{st.indicator}</span>
                            )}
                            <span className="truncate">{b.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  {/* Owner Admin Button Preview */}
                  <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-amber-300/90 px-1">
                      <span>دکمه اختصاصی مالک ربات ({ownerIdInput.trim() || "آیدی مالک"}):</span>
                      <span className="font-mono">فقط برای مالک</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewAdminOpen(true)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-black border bg-rose-600/90 hover:bg-rose-500 text-white border-rose-400/70 shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span className="px-1 rounded bg-amber-400/30 border border-amber-300/50 animate-pulse">👑</span>
                      <span>👑 پنل مدیریت (کلیک برای تست)</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2.5 p-1 animate-in fade-in">
                  <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-3 text-[11px] space-y-1.5 text-slate-200">
                    <div className="font-black text-amber-300 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>👑 پنل اختصاصی مدیریت ربات فروشگاه</span>
                    </div>
                    <p className="text-slate-300 text-[10px] leading-relaxed">
                      مالک محترم ({ownerIdInput.trim() || "Admin"}) خوش آمدید! لینک مستقیم پنل تحت وب مدیریت ربات آماده است:
                    </p>
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-cyan-300 break-all" dir="ltr">
                      {webPanelUrl}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <a
                      href={webPanelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        showToast("success", "پنل تحت وب مدیریت ربات آماده است (شما هم‌اکنون در پنل تحت وب حضور دارید).");
                      }}
                      className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border border-emerald-400 flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>🌐 باز کردن پنل تحت وب مدیریت ربات</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(webPanelUrl);
                        showToast("success", "لینک مستقیم ورود ۱-کلیکی پنل مدیریت تحت وب کپی شد!");
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 font-bold text-[11px] border border-cyan-500/40 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>کپی لینک مستقیم پنل تحت وب</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewAdminOpen(false)}
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                  >
                    🔙 بازگشت به پیش‌نمایش منوی اصلی
                  </button>
                </div>
              )}

              {activePreviewRows.length === 0 && !previewAdminOpen && (
                <div className="text-center py-4 text-xs text-slate-500">
                  هیچ دکمه‌ای فعال نیست. روی «بازگردانی دکمه‌های پیش‌فرض» کلیک کنید.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center & Right Column: Custom Buttons & Live Layout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Buttons Manager */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  لیست دکمه‌های منوی ربات (انتخاب ۱-کلیکی ایموجی پرمیوم، رنگ Aiogram و ترتیب)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  روی دکمه «✨ ایموجی پرمیوم» هر کارت بزنید تا از گالری ایموجی‌های پرمیوم تلگرام برای آن دکمه آیکون متحرک انتخاب کنید.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openAddButtonModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن دکمه جدید
                </button>
              </div>
            </div>

            {/* Custom Buttons Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedButtons.map((btn, index) => {
                const styleObj =
                  AIOGRAM_STYLES.find((s) => s.id === btn.style) || AIOGRAM_STYLES[2];
                const isBtnActive = btn.isActive !== false;
                const currentEmojiObj = getPresetEmojiById(btn.customEmojiId);
                const isEmojiPickerOpen = quickEmojiPickerBtnId === btn.id;

                return (
                  <div
                    key={btn.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                      isBtnActive
                        ? "bg-slate-950/80 border-slate-800/90 hover:border-cyan-500/40"
                        : "bg-slate-950/30 border-slate-800/40 opacity-55"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleQuickCycleColor(btn.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${styleObj.bg}`}
                            title="کلیک برای تغییر سریع رنگ دکمه (سبز / قرمز / آبی)"
                          >
                            <span>{styleObj.indicator}</span>
                            <span>{styleObj.shortName}</span>
                          </button>
                          <span className="font-bold text-xs text-slate-100 truncate">
                            {btn.text}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">
                            سطر {btn.rowIndex ?? 0} • ستون {btn.columnIndex ?? 0}
                          </span>
                          <span className="text-cyan-400 font-medium">
                            {ACTION_LABELS[btn.action] || btn.action}
                          </span>
                        </div>

                        {/* Quick Premium Emoji Badge & Toggle */}
                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickEmojiPickerBtnId(isEmojiPickerOpen ? null : btn.id)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                              btn.customEmojiId
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
                            }`}
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>
                              {currentEmojiObj
                                ? `ایموجی پرمیوم: ${currentEmojiObj.icon} (${btn.customEmojiId?.slice(-4)})`
                                : "✨ انتخاب ایموجی پرمیوم"}
                            </span>
                          </button>

                          {btn.customEmojiId && (
                            <button
                              type="button"
                              onClick={() => handleQuickAssignPremiumEmoji(btn.id, "")}
                              className="px-1.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] cursor-pointer"
                              title="حذف ایموجی پرمیوم از این دکمه"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Inline 1-Click Premium Emoji Gallery Drawer */}
                        {isEmojiPickerOpen && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-900/95 border border-amber-500/40 space-y-2 animate-in fade-in">
                            <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                              <span>انتخاب ۱-کلیکی ایموجی پرمیوم تلگرام:</span>
                              <button
                                type="button"
                                onClick={() => setQuickEmojiPickerBtnId(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                بستن ✕
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-36 overflow-y-auto">
                              {allAvailableEmojiPresets.map((pe) => (
                                <button
                                  key={pe.id}
                                  type="button"
                                  onClick={() =>
                                    handleQuickAssignPremiumEmoji(btn.id, pe.id, pe.label)
                                  }
                                  className={`px-2 py-1 rounded-lg text-[10px] text-right truncate border transition-all cursor-pointer ${
                                    btn.customEmojiId === pe.id
                                      ? "bg-amber-500 text-slate-950 font-black border-amber-300"
                                      : "bg-slate-950 text-slate-200 border-slate-800 hover:border-amber-500/50"
                                  }`}
                                >
                                  {pe.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveButton(index, "up")}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition-colors cursor-pointer"
                          title="انتقال به بالا"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveButton(index, "down")}
                          disabled={index === sortedButtons.length - 1}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition-colors cursor-pointer"
                          title="انتقال به پایین"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(btn.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            isBtnActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-900 text-slate-500 border border-slate-800"
                          }`}
                          title="فعال یا مخفی کردن دکمه"
                        >
                          {isBtnActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isBtnActive ? "فعال" : "مخفی"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditButtonModal(btn)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>ویرایش کامل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteButton(btn.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="حذف دکمه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedButtons.length === 0 && (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  همه دکمه‌های سفارشی حذف شده‌اند. می‌توانید دکمه جدید بسازید یا دکمه‌های پیش‌فرض را برگردانید:
                </p>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  بازگردانی دکمه‌های پیش‌فرض ربات
                </button>
              </div>
            )}
          </div>

          {/* Button Text Labels Customizer */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              عناوین پایه دکمه‌های سیستمی
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">دکمه خرید سلف</label>
                <input
                  type="text"
                  value={labels.buySelf}
                  onChange={(e) => setLabels({ ...labels, buySelf: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">دکمه خرید تبچی</label>
                <input
                  type="text"
                  value={labels.buyTabchi}
                  onChange={(e) => setLabels({ ...labels, buyTabchi: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">دکمه پکیج ترکیبی VIP</label>
                <input
                  type="text"
                  value={labels.buyCombo}
                  onChange={(e) => setLabels({ ...labels, buyCombo: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">دکمه کاتالوگ پکیج‌ها</label>
                <input
                  type="text"
                  value={labels.plansCatalog}
                  onChange={(e) => setLabels({ ...labels, plansCatalog: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">دکمه پیگیری سفارشات</label>
                <input
                  type="text"
                  value={labels.myOrders}
                  onChange={(e) => setLabels({ ...labels, myOrders: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">دکمه مشخصات من / حساب کاربری</label>
                <input
                  type="text"
                  value={labels.myAccount}
                  onChange={(e) => setLabels({ ...labels, myAccount: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add/Edit Custom Button */}
      {btnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {editingBtn ? "ویرایش دکمه و ایموجی پرمیوم" : "افزودن دکمه جدید با ایموجی پرمیوم"}
              </h4>
              <button
                onClick={() => setBtnModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveButton} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام و متن روی دکمه *
                </label>
                <input
                  type="text"
                  value={btnText}
                  onChange={(e) => setBtnText(e.target.value)}
                  placeholder="مثال: 🎛 مدیریت سلف و تبچی"
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عملکرد دکمه هنگام کلیک مشتری
                </label>
                <select
                  value={btnAction}
                  onChange={(e) => setBtnAction(e.target.value as any)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="buy_category">🛍️ باز کردن دسته‌بندی خرید (سلف / تبچی / VIP)</option>
                  <option value="manage_self_tabchi">🎛 پنل مدیریت سلف و تبچی درون ربات</option>
                  <option value="setup_personal_bot">🤖 اتصال ربات شخصی مشتری (@BotFather API)</option>
                  <option value="spambot_checker">🩺 چکر سلامت شماره و تست @SpamBot تلگرام</option>
                  <option value="my_account">👤 مشخصات من / حساب کاربری و اشتراک</option>
                  <option value="my_orders">📦 پیگیری سفارشات و اتصال خودکار شماره</option>
                  <option value="discount_coupon">🎁 ثبت کد تخفیف</option>
                  <option value="support">📞 ارتباط با پشتیبانی</option>
                  <option value="help">📋 نمایش کل تعرفه‌ها و لیست پکیج‌ها</option>
                  <option value="rules">📖 راهنمای اتصال خودکار و قوانین</option>
                  <option value="custom_url">🔗 باز کردن لینک خارجی (URL)</option>
                </select>
              </div>

              {btnAction === "buy_category" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    دسته‌بندی هدف
                  </label>
                  <select
                    value={btnTargetCat}
                    onChange={(e) => setBtnTargetCat(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || "📁"} {c.title}
                      </option>
                    ))}
                    <option value="all">🛍️ همه پلن‌ها و تعرفه‌ها</option>
                  </select>
                </div>
              )}

              {btnAction === "custom_url" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    آدرس اینترنتی لینک (URL)
                  </label>
                  <input
                    type="url"
                    value={btnTargetUrl}
                    onChange={(e) => setBtnTargetUrl(e.target.value)}
                    placeholder="https://t.me/your_channel"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 text-left"
                  />
                </div>
              )}

              {/* Aiogram Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رنگ دکمه در کیبورد باتن و شیشه‌ای (Aiogram Style)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AIOGRAM_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setBtnStyle(st.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                        st.bg
                      } ${btnStyle === st.id ? "ring-2 ring-white shadow-md" : "opacity-75"}`}
                    >
                      <span className="truncate">{st.shortName}</span>
                      <span>{st.indicator}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Placement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    شماره سطر (Row)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={btnRow}
                    onChange={(e) => setBtnRow(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    شماره ستون (Column)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    value={btnCol}
                    onChange={(e) => setBtnCol(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Premium Emoji ID */}
              <div className="space-y-2 bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    ایموجی پرمیوم تلگرام روی دکمه (icon_custom_emoji_id)
                  </label>
                  {btnCustomEmojiId && (
                    <button
                      type="button"
                      onClick={() => setBtnCustomEmojiId("")}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                    >
                      حذف ایموجی پرمیوم ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={btnCustomEmojiId}
                  onChange={(e) => setBtnCustomEmojiId(e.target.value)}
                  placeholder="شناسه ۱۹ رقمی ایموجی پرمیوم (مثال: 5368324170671202288)"
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                />
                <div className="text-[10px] text-slate-400">
                  یا یکی از ایموجی‌های پرمیوم متحرک آماده زیر را با ۱ کلیک انتخاب کنید:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 max-h-40 overflow-y-auto pr-1">
                  {allAvailableEmojiPresets.map((pe) => (
                    <button
                      key={pe.id}
                      type="button"
                      onClick={() => {
                        setBtnCustomEmojiId(pe.id);
                        setBtnText((prev) => ensureButtonTextHasVisibleEmoji(prev, pe.icon));
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] text-right truncate border transition-all cursor-pointer ${
                        btnCustomEmojiId === pe.id
                          ? "bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-sm"
                          : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-amber-500/40"
                      }`}
                    >
                      {pe.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBtnModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  {editingBtn ? "ثبت تغییرات دکمه" : "افزودن دکمه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Python Aiogram v3 Code & Engine Status */}
      {aiogramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🐍</span>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    موتور و کد پایتون Aiogram v3.25+ (Telegram Bot API 9.4)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    ساخت دکمه‌های رنگی و ایموجی‌های پرمیوم با <code className="text-cyan-300">InlineKeyboardBuilder</code>، <code className="text-cyan-300">ReplyKeyboardBuilder</code> و <code className="text-amber-300">icon_custom_emoji_id</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiogramModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                  Aiogram Engine: {aiogramCodeInfo?.aiogramVersion || "3.25.0"}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  server/aiogram_bot_engine.py
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (aiogramCodeInfo?.pythonCode) {
                      navigator.clipboard.writeText(aiogramCodeInfo.pythonCode);
                      showToast("success", "کد پایتون Aiogram کپی شد!");
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی کد پایتون Aiogram</span>
                </button>
              </div>
            </div>

            <pre
              dir="ltr"
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[55vh] leading-relaxed"
            >
              {aiogramCodeInfo?.pythonCode || "# در حال تولید کد پایتون Aiogram از روی دکمه‌های فعلی شما..."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
