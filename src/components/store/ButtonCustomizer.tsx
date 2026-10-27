import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Palette,
  LayoutGrid,
  Layers,
  Smile,
  RefreshCw,
  ExternalLink,
  ChevronDown,
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
  { id: "primary", name: "Primary (آبی تلگرام)", bg: "bg-blue-600 text-white border-blue-500", indicator: "🔵" },
  { id: "success", name: "Success (سبز تأیید)", bg: "bg-emerald-600 text-white border-emerald-500", indicator: "🟢" },
  { id: "danger", name: "Danger (قرمز هشدار)", bg: "bg-rose-600 text-white border-rose-500", indicator: "🔴" },
  { id: "warning", name: "Warning (زرد توجه)", bg: "bg-amber-600 text-white border-amber-500", indicator: "🟡" },
  { id: "default", name: "Default (خاکستری تیره)", bg: "bg-slate-700 text-slate-100 border-slate-600", indicator: "⚪" },
];

export function ButtonCustomizer({
  settings,
  categories,
  lang,
  onRefresh,
  showToast,
}: ButtonCustomizerProps) {
  const { confirm } = useConfirm();
  const [saving, setSaving] = useState(false);

  // Settings state
  const [keyboardMode, setKeyboardMode] = useState<StoreKeyboardMode>(settings.keyboardMode || "inline");
  const [buttonTheme, setButtonTheme] = useState<StoreButtonTheme>(settings.buttonTheme || "aiogram_colored");
  const [buttonAiogramStyle, setButtonAiogramStyle] = useState<string>(settings.buttonAiogramStyle || "primary");
  const [keyboardColumns, setKeyboardColumns] = useState<number>(settings.keyboardColumns || 2);
  const [replyKeyboardColumns, setReplyKeyboardColumns] = useState<number>(settings.replyKeyboardColumns || 2);
  const [allowSwitch, setAllowSwitch] = useState<boolean>(settings.allowCustomerKeyboardSwitch !== false);

  // Labels
  const [labels, setLabels] = useState({
    buySelf: settings.buttonLabels?.buySelf || "💎 خرید اکانت سلف زمان‌دار",
    buyTabchi: settings.buttonLabels?.buyTabchi || "🚀 خرید اکانت تبچی تبلیغاتی",
    buyCombo: settings.buttonLabels?.buyCombo || "⚡ پکیج VIP (سلف + تبچی)",
    plansCatalog: settings.buttonLabels?.plansCatalog || "🛍️ تعرفه‌ها و لیست پکیج‌ها",
    myOrders: settings.buttonLabels?.myOrders || "📦 پیگیری سفارشات من",
    myAccount: settings.buttonLabels?.myAccount || "👤 حساب کاربری و اشتراک",
    support: settings.buttonLabels?.support || "📞 پشتیبانی و راهنما",
    helpGuide: settings.buttonLabels?.helpGuide || "📖 آموزش اتصال به پنل",
    applyDiscount: settings.buttonLabels?.applyDiscount || "🎁 ثبت کد تخفیف",
    switchKeyboard: settings.buttonLabels?.switchKeyboard || "🔄 تغییر حالت کیبورد",
  });

  // Custom Buttons
  const [customButtons, setCustomButtons] = useState<StoreCustomButton[]>(
    settings.customButtons && settings.customButtons.length > 0 ? settings.customButtons : []
  );

  // Add / Edit Button modal
  const [btnModalOpen, setBtnModalOpen] = useState(false);
  const [editingBtn, setEditingBtn] = useState<StoreCustomButton | null>(null);

  const [btnText, setBtnText] = useState("");
  const [btnAction, setBtnAction] = useState<any>("buy_category");
  const [btnTargetCat, setBtnTargetCat] = useState("self");
  const [btnTargetUrl, setBtnTargetUrl] = useState("");
  const [btnStyle, setBtnStyle] = useState<any>("primary");
  const [btnCustomEmojiId, setBtnCustomEmojiId] = useState("");
  const [btnRow, setBtnRow] = useState(0);
  const [btnCol, setBtnCol] = useState(0);

  const openAddButtonModal = () => {
    setEditingBtn(null);
    setBtnText("💎 اکانت ویژه جدید");
    setBtnAction("buy_category");
    setBtnTargetCat(categories[0]?.id || "self");
    setBtnTargetUrl("");
    setBtnStyle("success");
    setBtnCustomEmojiId("");
    setBtnRow(Math.floor(customButtons.length / 2));
    setBtnCol(customButtons.length % 2);
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
      isActive: true,
    };

    if (editingBtn) {
      setCustomButtons(customButtons.map((b) => (b.id === editingBtn.id ? newBtn : b)));
    } else {
      setCustomButtons([...customButtons, newBtn]);
    }

    setBtnModalOpen(false);
    showToast("success", "دکمه به لیست دکمه‌های کیبورد اضافه شد. برای اعمال ذخیره نهایی را بزنید.");
  };

  const handleDeleteButton = async (id: string) => {
    const ok = await confirm({
      title: "حذف دکمه",
      message: "آیا مطمئن هستید که می‌خواهید این دکمه را حذف کنید؟",
      confirmText: "بله، حذف کن",
      cancelText: "انصراف",
      variant: "danger",
    });
    if (!ok) return;

    setCustomButtons(customButtons.filter((b) => b.id !== id));
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

      showToast("success", "تنظیمات کیبورد، استایل aiogram و دکمه‌های سفارشی با موفقیت ذخیره شد.");
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
            <LayoutGrid className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-100">
              شخصی‌سازی دکمه‌ها، استایل‌های Aiogram و ایموجی پرمیوم
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            رنگ دکمه‌ها با استاندارد Aiogram (primary, success, danger, warning)، نحوه چیدمان در سطرها و ستون‌ها، نام دکمه‌ها و ایموجی‌های پرمیوم تلگرام را به طور کامل تنظیم کنید.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          ذخیره تغییرات دکمه‌ها و کیبورد
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Keyboards Configuration */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl space-y-4 shadow-lg">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            تنظیمات ساختاری کیبورد
          </h4>

          {/* Keyboard Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              حالت پیش‌فرض منوی ربات
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setKeyboardMode("inline")}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
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
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
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
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  keyboardMode === "hybrid"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                ترکیبی (Hybrid)
              </button>
            </div>
          </div>

          {/* Theme / Aiogram Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              تم و استایل دکمه‌های ربات
            </label>
            <select
              value={buttonTheme}
              onChange={(e) => setButtonTheme(e.target.value as any)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="aiogram_colored">استایل رنگی پیشرفته Aiogram (Primary, Success, Danger)</option>
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
              رنگ پیش‌فرض Aiogram برای دکمه‌های اصلی
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AIOGRAM_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setButtonAiogramStyle(st.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${
                    st.bg
                  } ${buttonAiogramStyle === st.id ? "ring-2 ring-white shadow-lg" : "opacity-75"}`}
                >
                  <span className="truncate">{st.name.split(" ")[0]}</span>
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
                ستون‌های کیبورد پایین
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
              اجازه تغییر حالت کیبورد توسط مشتری در چت
            </span>
            <input
              type="checkbox"
              checked={allowSwitch}
              onChange={(e) => setAllowSwitch(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded"
            />
          </div>
        </div>

        {/* Center & Right Column: Custom Buttons & Live Layout */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Buttons Manager */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  چیدمان اختصاصی دکمه‌ها و ایموجی‌های پرمیوم
                </h4>
                <p className="text-[11px] text-slate-400">
                  دکمه‌های سفارشی بسازید، سطر و ستون آن را تعیین کرده و رنگ aiogram مشخص کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddButtonModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن دکمه جدید
              </button>
            </div>

            {/* Custom Buttons Table / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customButtons.map((btn) => {
                const styleObj = AIOGRAM_STYLES.find((s) => s.id === btn.style) || AIOGRAM_STYLES[0];
                return (
                  <div
                    key={btn.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs">{styleObj.indicator}</span>
                        <span className="font-bold text-xs text-slate-100 truncate">
                          {btn.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>سطر {btn.rowIndex}، ستون {btn.columnIndex}</span>
                        <span>•</span>
                        <span className="text-cyan-400">{btn.action}</span>
                        {btn.customEmojiId && (
                          <span className="text-amber-400 truncate max-w-[100px]">
                            💎 {btn.customEmojiId}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditButtonModal(btn)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteButton(btn.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {customButtons.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                هیچ دکمه اختصاصی تعریف نشده است. منو از دکمه‌های پیش‌فرض هوشمند استفاده می‌کند.
              </div>
            )}
          </div>

          {/* Button Text Labels Customizer */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-xl shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sliders className="w-4 h-4 text-cyan-400" />
              ویرایش متن دکمه‌های اصلی و پیش‌فرض
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
                <label className="block text-[11px] text-slate-400 mb-1">دکمه پکیج ترکیبی</label>
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
                <label className="block text-[11px] text-slate-400 mb-1">دکمه حساب کاربری</label>
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
                {editingBtn ? "ویرایش دکمه سفارشی" : "افزودن دکمه سفارشی جدید"}
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
                  متن دکمه *
                </label>
                <input
                  type="text"
                  value={btnText}
                  onChange={(e) => setBtnText(e.target.value)}
                  placeholder="مثال: 💎 پکیج فوق‌العاده سلف VIP"
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  عملکرد کلیک روی دکمه
                </label>
                <select
                  value={btnAction}
                  onChange={(e) => setBtnAction(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="buy_category">باز کردن دسته‌بندی خاص</option>
                  <option value="my_orders">پیگیری سفارشات کاربر</option>
                  <option value="my_account">مشاهده حساب کاربری و اشتراک</option>
                  <option value="support">ارتباط با پشتیبانی</option>
                  <option value="help">نمایش کل تعرفه‌ها و پلن‌ها</option>
                  <option value="rules">راهنمای اتصال و قوانین</option>
                  <option value="custom_url">باز کردن لینک خارجی (URL)</option>
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
                    placeholder="https://example.com"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 text-left"
                  />
                </div>
              )}

              {/* Aiogram Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رنگ و استایل Aiogram
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AIOGRAM_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setBtnStyle(st.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all ${
                        st.bg
                      } ${btnStyle === st.id ? "ring-2 ring-white shadow-md" : "opacity-75"}`}
                    >
                      <span className="truncate">{st.name.split(" ")[0]}</span>
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
                    max={10}
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
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ایموجی پرمیوم تلگرام (Custom Emoji ID)
                </label>
                <input
                  type="text"
                  value={btnCustomEmojiId}
                  onChange={(e) => setBtnCustomEmojiId(e.target.value)}
                  placeholder="مثال: 5368324170671202288"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBtnModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/25"
                >
                  {editingBtn ? "ذخیره دکمه" : "افزودن دکمه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
