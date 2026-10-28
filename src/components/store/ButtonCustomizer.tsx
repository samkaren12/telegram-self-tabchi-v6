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
  {
    id: "warning",
    name: "Warning (زرد طلایی)",
    shortName: "زرد (Warning)",
    bg: "bg-amber-600/90 text-white border-amber-400/60 shadow-amber-500/20",
    indicator: "🟡",
  },
  {
    id: "default",
    name: "Default (خاکستری استاندارد)",
    shortName: "پیش‌فرض",
    bg: "bg-slate-700 text-slate-100 border-slate-600",
    indicator: "⚪",
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

const PREMIUM_EMOJI_PRESETS = [
  { label: "💎 الماس پرمیوم", id: "5368324170671202288" },
  { label: "🚀 موشک نئونی", id: "5445284980978621387" },
  { label: "⚡ صاعقه طلایی", id: "5456140674028019486" },
  { label: "🔥 آتش متحرک", id: "5424972470023104089" },
  { label: "👑 تاج VIP", id: "5357315181649076022" },
  { label: "✅ تیک سبز پرمیوم", id: "5206607081334906820" },
];

export function ButtonCustomizer({
  settings,
  categories,
  onRefresh,
  showToast,
}: ButtonCustomizerProps) {
  const { confirm } = useConfirm();
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

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
  }, [settings.customButtons]);

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
    setBtnCustomEmojiId("");
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

  const handleSaveButton = (e: React.FormEvent) => {
    e.preventDefault();
    if (!btnText.trim()) {
      showToast("error", "متن دکمه را وارد فرمایید.");
      return;
    }

    const newBtn: StoreCustomButton = {
      id: editingBtn ? editingBtn.id : `btn-${Date.now()}`,
      text: btnText.trim(),
      action: btnAction,
      targetCategoryId: btnAction === "buy_category" ? btnTargetCat : undefined,
      url: btnAction === "custom_url" ? btnTargetUrl.trim() : undefined,
      style: btnStyle,
      customEmojiId: btnCustomEmojiId.trim() || undefined,
      rowIndex: Number(btnRow) || 0,
      columnIndex: Number(btnCol) || 0,
      isActive: editingBtn ? editingBtn.isActive !== false : true,
    };

    if (editingBtn) {
      setCustomButtons(customButtons.map((b) => (b.id === editingBtn.id ? newBtn : b)));
      showToast("success", "دکمه ویرایش شد. برای اعمال در ربات روی «ذخیره تغییرات» بزنید.");
    } else {
      setCustomButtons([...customButtons, newBtn]);
      showToast("success", "دکمه جدید اضافه شد. برای اعمال در ربات روی «ذخیره تغییرات» بزنید.");
    }

    setBtnModalOpen(false);
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

    setCustomButtons(customButtons.filter((b) => b.id !== id));
    showToast("success", "دکمه از لیست حذف شد. برای اعمال نهایی ذخیره را بزنید.");
  };

  const handleToggleActive = (id: string) => {
    setCustomButtons(
      customButtons.map((b) =>
        b.id === id ? { ...b, isActive: b.isActive === false ? true : false } : b
      )
    );
  };

  const handleMoveButton = (index: number, direction: "up" | "down") => {
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

    // If both had identical row/col, enforce distinct ordering
    if (sorted[index].rowIndex === sorted[targetIdx].rowIndex && sorted[index].columnIndex === sorted[targetIdx].columnIndex) {
      sorted.forEach((btn, idx) => {
        btn.rowIndex = Math.floor(idx / 2);
        btn.columnIndex = idx % 2;
      });
    }

    setCustomButtons([...sorted]);
  };

  const handleQuickCycleColor = (id: string) => {
    const order: Array<StoreCustomButton["style"]> = ["success", "danger", "primary", "warning", "default"];
    setCustomButtons(
      customButtons.map((b) => {
        if (b.id !== id) return b;
        const idx = order.indexOf(b.style || "primary");
        const nextStyle = order[(idx + 1) % order.length];
        return { ...b, style: nextStyle };
      })
    );
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
        "تنظیمات کیبورد، رنگ‌های Aiogram (سبز، قرمز، آبی) و چیدمان دکمه‌ها با موفقیت در ربات ذخیره شد."
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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl shadow-cyan-950/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100">
              مدیریت حرفه‌ای دکمه‌ها، رنگ‌های Aiogram (سبز، قرمز، آبی) و ایموجی پرمیوم
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            نام دکمه‌ها را تغییر دهید، دکمه‌های دلخواه را حذف یا جابجا کنید، برای هر دکمه کیبورد باتن و شیشه‌ای رنگ Aiogram (سبز Success، قرمز Danger، آبی Primary) و ایموجی پرمیوم بگذارید، یا با یک کلیک به دکمه‌های پیش‌فرض برگردانید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
                  پیش‌نمایش زنده دکمه‌های رنگی ربات (Aiogram)
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {activePreviewRows.reduce((acc, r) => acc + r.length, 0)} دکمه فعال
              </span>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
              {activePreviewRows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${Math.min(row.length, 3)}, minmax(0, 1fr))` }}
                >
                  {row.map((b) => {
                    const st = AIOGRAM_STYLES.find((s) => s.id === b.style) || AIOGRAM_STYLES[2];
                    return (
                      <div
                        key={b.id}
                        className={`px-2.5 py-2 rounded-lg text-[11px] font-bold border text-center truncate flex items-center justify-center gap-1 shadow-sm ${st.bg}`}
                        title={`${b.text} (${st.shortName})`}
                      >
                        <span>{st.indicator}</span>
                        <span className="truncate">{b.text}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              {activePreviewRows.length === 0 && (
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
                  لیست دکمه‌های منوی ربات (ویرایش نام، حذف، ترتیب و رنگ Aiogram)
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  می‌توانید روی رنگ هر دکمه کلیک کنید تا بین سبز (Success)، قرمز (Danger) و آبی (Primary) تغییر کند، یا با فلش‌ها ترتیب را عوض کنید.
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => handleQuickCycleColor(btn.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${styleObj.bg}`}
                            title="کلیک برای تغییر سریع رنگ دکمه (سبز / قرمز / آبی / زرد)"
                          >
                            <span>{styleObj.indicator}</span>
                            <span>{styleObj.shortName}</span>
                          </button>
                          <span className="font-bold text-xs text-slate-100 truncate">
                            {btn.text}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300">
                            سطر {btn.rowIndex ?? 0} • ستون {btn.columnIndex ?? 0}
                          </span>
                          <span className="text-cyan-400 font-medium">
                            {ACTION_LABELS[btn.action] || btn.action}
                          </span>
                          {btn.customEmojiId && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono truncate max-w-[130px]">
                              💎 {btn.customEmojiId}
                            </span>
                          )}
                        </div>
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
                          <span>ویرایش</span>
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
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {editingBtn ? "ویرایش دکمه منوی ربات" : "افزودن دکمه جدید به ربات"}
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
                <div className="grid grid-cols-2 gap-2">
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
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  شناسه ایموجی پرمیوم تلگرام (Custom Emoji ID)
                </label>
                <input
                  type="text"
                  value={btnCustomEmojiId}
                  onChange={(e) => setBtnCustomEmojiId(e.target.value)}
                  placeholder="مثال: 5368324170671202288 (اختیاری)"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PREMIUM_EMOJI_PRESETS.map((pe) => (
                    <button
                      key={pe.id}
                      type="button"
                      onClick={() => setBtnCustomEmojiId(pe.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] border transition-all cursor-pointer ${
                        btnCustomEmojiId === pe.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-200 font-bold"
                          : "bg-slate-800/70 border-slate-700 text-slate-300 hover:border-amber-500/40"
                      }`}
                    >
                      {pe.label}
                    </button>
                  ))}
                  {btnCustomEmojiId && (
                    <button
                      type="button"
                      onClick={() => setBtnCustomEmojiId("")}
                      className="px-2 py-1 rounded-lg text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-300 cursor-pointer"
                    >
                      پاک کردن ایموجی پرمیوم
                    </button>
                  )}
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
    </div>
  );
}
